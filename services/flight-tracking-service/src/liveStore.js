import { redis, redisPub } from "./redisClient.js";

// =====================================================================
// Redis key layout (memorise this — it's exam-grade material for viva)
// =====================================================================
//
//   flights:geo                  ZSET (geo)   icao24 → (lon, lat)
//   flight:<icao24>              HASH         all fields for one aircraft (TTL)
//   flights:active               SET          icao24 of every tracked plane
//   live:flights                 PUB/SUB ch.  JSON batch on every poll
//
// One stored aircraft looks like:
//   { icao24, callsign, originCountry, longitude, latitude,
//     baroAltitude, geoAltitude, velocity, heading, verticalRate,
//     onGround, lastContact, ts }
// =====================================================================

const GEO_KEY = "flights:geo";
const ACTIVE_KEY = "flights:active";
export const LIVE_CHANNEL = "live:flights";
const FLIGHT_KEY = (icao24) => `flight:${icao24}`;

// 120 seconds = 2 minutes. If a plane stops broadcasting for 2 min,
// its hash expires and it disappears from the map automatically.
const TTL_SECONDS = 120;

// Redis hash values must be strings or numbers. Drop nulls/undefined.
function toRedisHash(flight) {
  const out = {};
  for (const [k, v] of Object.entries(flight)) {
    if (v === null || v === undefined) continue;
    out[k] = typeof v === "boolean" ? (v ? "1" : "0") : String(v);
  }
  return out;
}

// Convert a Redis hash (everything is a string) back into a typed flight.
export function parseFlightHash(raw) {
  if (!raw || Object.keys(raw).length === 0) return null;
  const num = (k) => (raw[k] === undefined ? null : Number(raw[k]));
  return {
    icao24: raw.icao24,
    callsign: raw.callsign || "",
    originCountry: raw.originCountry || "",
    longitude: num("longitude"),
    latitude: num("latitude"),
    baroAltitude: num("baroAltitude"),
    geoAltitude: num("geoAltitude"),
    velocity: num("velocity"),
    true_track: num("true_track"),
    heading: num("heading"),
    verticalRate: num("verticalRate"),
    onGround: raw.onGround === "1",
    lastContact: num("lastContact"),
    ts: num("ts"),
  };
}

function isFinitePair(lon, lat) {
  return (
    Number.isFinite(lon) && Number.isFinite(lat) && lat >= -90 && lat <= 90
  );
}

// =====================================================================
// WRITE: take an array of flights from OpenSky and store them in Redis.
// Uses MULTI to batch all commands into one round-trip = much faster
// than 5 commands per flight × thousands of flights.
// =====================================================================
export async function upsertFlights(flights) {
  if (!flights?.length) return { written: 0 };

  const pipeline = redis.multi(); // a transaction-like batch
  const geoMembers = [];
  const ts = Math.floor(Date.now() / 1000);
  const writable = [];

  for (const f of flights) {
    if (!f.icao24) continue;
    if (!isFinitePair(f.longitude, f.latitude)) continue; // skip bad coords

    const doc = { ...f, ts };

    pipeline.hSet(FLIGHT_KEY(f.icao24), toRedisHash(doc)); // store hash
    pipeline.expire(FLIGHT_KEY(f.icao24), TTL_SECONDS); // TTL refresh
    pipeline.sAdd(ACTIVE_KEY, f.icao24); // active set

    geoMembers.push({
      longitude: f.longitude,
      latitude: f.latitude,
      member: f.icao24,
    });
    writable.push(doc);
  }

  if (geoMembers.length) {
    pipeline.geoAdd(GEO_KEY, geoMembers); // GEOADD in one shot
  }

  await pipeline.exec(); // send the whole batch to Redis

  // Pub/sub: tell every socket.io client there's new data.
  await redisPub.publish(
    LIVE_CHANNEL,
    JSON.stringify({
      type: "flights",
      ts,
      count: writable.length,
      flights: writable,
    }),
  );

  return { written: writable.length };
}

// =====================================================================
// READ helpers — used by socket.io snapshot + REST endpoints
// =====================================================================

export async function getAllFlights({ limit = 5000 } = {}) {
  const ids = await redis.sMembers(ACTIVE_KEY);
  const slice = ids.slice(0, limit);
  if (!slice.length) return [];

  const pipeline = redis.multi();
  slice.forEach((id) => pipeline.hGetAll(FLIGHT_KEY(id)));
  const rows = await pipeline.exec();

  return rows.map(parseFlightHash).filter(Boolean);
}

export async function getFlight(icao24) {
  const raw = await redis.hGetAll(FLIGHT_KEY(icao24));
  return parseFlightHash(raw);
}

// GEOSEARCH — "give me planes within X km of (lat, lon)"
export async function getNearby({ lat, lon, radiusKm = 200, limit = 500 }) {
  const results = await redis.geoSearchWith(
    GEO_KEY,
    { longitude: lon, latitude: lat },
    { radius: radiusKm, unit: "km" },
    ["WITHCOORD", "WITHDIST"],
    { COUNT: limit, SORT: "ASC" },
  );
  if (!results?.length) return [];

  const pipeline = redis.multi();
  results.forEach((r) => pipeline.hGetAll(FLIGHT_KEY(r.member)));
  const rows = await pipeline.exec();

  return results
    .map((r, i) => {
      const flight = parseFlightHash(rows[i]);
      if (!flight) return null;
      return { ...flight, distanceKm: Number(r.distance) };
    })
    .filter(Boolean);
}

// Drop GEO/SET entries whose hash already TTL-expired.
// Call this every minute or so to keep the GEO set tidy.
export async function reapStale() {
  const members = await redis.zRange(GEO_KEY, 0, -1);
  if (!members.length) return 0;

  const exists = await Promise.all(
    members.map((m) => redis.exists(FLIGHT_KEY(m))),
  );
  const dead = members.filter((_, i) => !exists[i]);
  if (!dead.length) return 0;

  const pipeline = redis.multi();
  pipeline.zRem(GEO_KEY, dead);
  pipeline.sRem(ACTIVE_KEY, dead);
  await pipeline.exec();
  return dead.length;
}

export async function getStats() {
  const [tracked, geoCount] = await Promise.all([
    redis.sCard(ACTIVE_KEY),
    redis.zCard(GEO_KEY),
  ]);
  return { tracked, geoCount, channel: LIVE_CHANNEL };
}
