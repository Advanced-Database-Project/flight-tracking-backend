import { redisClient } from "./redis.js";

const GEO_KEY = "flight_locations";
const FLIGHT_KEY = (id) => `flight:${id}`;
const CONE_KEY = "cone:config";
const ALERT_CHANNEL = "collision-alerts";

const DEFAULT_CONE = { lengthKm: 50, halfAngleDeg: 25 };

const toRad = (d) => d * Math.PI / 180;
const toDeg = (r) => r * 180 / Math.PI;
const R_EARTH = 6371000;

function toENU(refLat, refLon, refAlt, lat, lon, alt) {
  const east  = toRad(lon - refLon) * Math.cos(toRad(refLat)) * R_EARTH;
  const north = toRad(lat - refLat) * R_EARTH;
  const up    = (alt ?? 0) - (refAlt ?? 0);
  return [east, north, up];
}

function velocityENU(p) {
  const theta = toRad(p.true_track ?? 0);
  const vh = p.velocity ?? 0;
  const vu = p.verticalRate ?? 0;
  return [vh * Math.sin(theta), vh * Math.cos(theta), vu];
}

const dot  = (a, b) => a[0]*b[0] + a[1]*b[1] + a[2]*b[2];
const norm = (a)    => Math.sqrt(dot(a, a));

function isInCone3D(viewer, target, lengthM, halfAngleDeg) {
  const vAlt = viewer.geoAltitude ?? viewer.altitude ?? 0;
  const tAlt = target.geoAltitude ?? target.altitude ?? 0;
  const rel = toENU(viewer.latitude, viewer.longitude, vAlt,
                    target.latitude, target.longitude, tAlt);
  const dist = norm(rel);
  if (dist === 0 || dist > lengthM) return false;

  const v = velocityENU(viewer);
  const vMag = norm(v);
  if (vMag < 1) return false;

  const cosAngle = dot(rel, v) / (dist * vMag);
  const clamped = Math.max(-1, Math.min(1, cosAngle));
  const angleDeg = toDeg(Math.acos(clamped));
  return angleDeg <= halfAngleDeg;
}

function closestApproach3D(a, b) {
  const aAlt = a.geoAltitude ?? a.altitude ?? 0;
  const bAlt = b.geoAltitude ?? b.altitude ?? 0;
  const rel = toENU(a.latitude, a.longitude, aAlt,
                    b.latitude, b.longitude, bAlt);
  const vA = velocityENU(a), vB = velocityENU(b);
  const dv = [vB[0]-vA[0], vB[1]-vA[1], vB[2]-vA[2]];
  const dotDvDv = dot(dv, dv);
  if (dotDvDv < 1e-6) return null;
  const tCPA = -dot(rel, dv) / dotDvDv;
  if (tCPA < 0) return null;
  const c = [rel[0] + dv[0]*tCPA, rel[1] + dv[1]*tCPA, rel[2] + dv[2]*tCPA];
  return { tCPA, dCPA: norm(c) };
}

export async function getConeConfig() {
  const raw = await redisClient.hGetAll(CONE_KEY);
  return {
    lengthKm:     Number(raw.lengthKm)     || DEFAULT_CONE.lengthKm,
    halfAngleDeg: Number(raw.halfAngleDeg) || DEFAULT_CONE.halfAngleDeg,
  };
}

export async function setConeConfig({ lengthKm, halfAngleDeg }) {
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const cfg = {
    lengthKm:     String(clamp(Number(lengthKm)     || 50, 1, 500)),
    halfAngleDeg: String(clamp(Number(halfAngleDeg) || 25, 1, 90)),
  };
  await redisClient.hSet(CONE_KEY, cfg);
  return { lengthKm: Number(cfg.lengthKm), halfAngleDeg: Number(cfg.halfAngleDeg) };
}

function classify(cpa, distKm) {
  if (cpa && cpa.tCPA < 30 && cpa.dCPA < 1000) return "critical";
  if (cpa && cpa.tCPA < 90 && cpa.dCPA < 5000) return "warning";
  if (distKm < 5) return "warning";
  return "info";
}

function pickFields(p) {
  return {
    icao24: p.icao24, callsign: p.callsign,
    latitude: p.latitude, longitude: p.longitude,
    geoAltitude: p.geoAltitude ?? p.altitude ?? null,
    true_track: p.true_track, velocity: p.velocity,
  };
}

function parseFlight(raw) {
  if (!raw) return null;
  try { return JSON.parse(raw); }
  catch { return null; }
}

export async function detectCollisions() {
  const cone = await getConeConfig();

  const ids = await redisClient.zRange(GEO_KEY, 0, -1);
  if (ids.length < 2) return { cone, alerts: [] };

  const pipe = redisClient.multi();
  ids.forEach((id) => pipe.get(FLIGHT_KEY(id)));
  const rawList = await pipe.exec();
  const planes = rawList.map(parseFlight).filter((p) =>
    p && p.latitude != null && p.longitude != null
      && p.true_track != null && p.velocity != null
  );
  const byId = new Map(planes.map((p) => [p.icao24, p]));

  const seenPairs = new Set();
  const alerts = [];

  await Promise.all(planes.map(async (a) => {
    const neighbors = await redisClient.geoSearchWith(
      GEO_KEY,
      { longitude: a.longitude, latitude: a.latitude },
      { radius: cone.lengthKm, unit: "km" },
      ["WITHCOORD", "WITHDIST"],
      { COUNT: 200, SORT: "ASC" }
    );

    for (const n of neighbors) {
      if (n.member === a.icao24) continue;

      const [lo, hi] = a.icao24 < n.member
        ? [a.icao24, n.member]
        : [n.member, a.icao24];
      const key = `${lo}|${hi}`;
      if (seenPairs.has(key)) continue;
      seenPairs.add(key);

      const b = byId.get(n.member);
      if (!b) continue;

      const lengthM = cone.lengthKm * 1000;
      const aSeesB = isInCone3D(a, b, lengthM, cone.halfAngleDeg);
      const bSeesA = isInCone3D(b, a, lengthM, cone.halfAngleDeg);
      if (!aSeesB || !bSeesA) continue;

      const cpa = closestApproach3D(a, b);
      const aAlt = a.geoAltitude ?? a.altitude ?? 0;
      const bAlt = b.geoAltitude ?? b.altitude ?? 0;
      alerts.push({
        pair: [lo, hi],
        a: pickFields(a),
        b: pickFields(b),
        distanceKm: Number(n.distance),
        altDiffM: Math.abs(aAlt - bAlt),
        tCPA: cpa?.tCPA ?? null,
        dCPA: cpa?.dCPA ?? null,
        severity: classify(cpa, Number(n.distance)),
      });
    }
  }));

  return { cone, alerts };
}

export function startCollisionDetector() {
  setInterval(async () => {
    try {
      const payload = await detectCollisions();
      if (payload.alerts.length === 0) return;
      const message = JSON.stringify({
        ts: Math.floor(Date.now() / 1000),
        ...payload,
      });
      await redisClient.publish(ALERT_CHANNEL, message);
      console.log(`[collision] ${payload.alerts.length} alert(s) published`);
    } catch (e) {
      console.error("collision detector error:", e.message);
    }
  }, 3000);
}

export { ALERT_CHANNEL };
