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
  const theta = toRad(p.true_track ?? 0); // from true track it gets the north or east , angle 
  const vh = p.velocity ?? 0;// verticle rate while flying horizontal
  const vu = p.verticalRate ?? 0; // vertical rate while climbing or descending
  return [vh * Math.sin(theta), vh * Math.cos(theta), vu]; //east nd north speed 
}

const dot  = (a, b) => a[0]*b[0] + a[1]*b[1] + a[2]*b[2]; //Are these two things pointing at the same spot?
const norm = (a)    => Math.sqrt(dot(a, a));// How long is this line? uses ENU [1, 2, 3] => sqrt(1^2 + 2^2 + 3^2) = sqrt(14)

function isInCone3D(viewer, target, lengthM, halfAngleDeg) {
  const vAlt = viewer.geoAltitude ?? viewer.altitude ?? 0;// using GPS (very accurate), and sometimes they use air pressure (less accurate)
  const tAlt = target.geoAltitude ?? target.altitude ?? 0;
  const rel = toENU(viewer.latitude, viewer.longitude, vAlt,
                    target.latitude, target.longitude, tAlt);//(the "Relative" position). This is just an invisible line drawn from you to the other plane
  const dist = norm(rel);//(the measuring tape) to see how long that line is.
  if (dist === 0 || dist > lengthM) return false; // safety check if they r not the same plane 

  const v = velocityENU(viewer);//it looks at your speed and direction (v)
  const vMag = norm(v);//It uses the norm again to see how fast you are going (vMag).
  if (vMag < 1) return false;  // safety check if you are not moving 

  const cosAngle = dot(rel, v) / (dist * vMag); // By dividing by the two norm values (dist * vMag), //it cancels out the speed and distance so it only cares about the direction. This gives us a number between -1 and 1.
  const clamped = Math.max(-1, Math.min(1, cosAngle)); //
  const angleDeg = toDeg(Math.acos(clamped)); // If the angle is smaller than your flashlight beam (halfAngleDeg), the other plane is inside your light!
  return angleDeg <= halfAngleDeg;   // true == danger 
}

  function closestApproach3D(a, b) {          //time travel 
    const aAlt = a.geoAltitude ?? a.altitude ?? 0;
    const bAlt = b.geoAltitude ?? b.altitude ?? 0;
    const rel = toENU(a.latitude, a.longitude, aAlt,
                      b.latitude, b.longitude, bAlt);
    const vA = velocityENU(a), vB = velocityENU(b);
    const dv = [vB[0]-vA[0], vB[1]-vA[1], vB[2]-vA[2]];  //calculates how fast Plane B is moving compared to you.
    const dotDvDv = dot(dv, dv);
    if (dotDvDv < 1e-6) return null; //if 0 the planes dont collide because they r moving at the same speed and direction
    const tCPA = -dot(rel, dv) / dotDvDv;  //It calculates exactly how many seconds it will take until the planes reach their Closest Point of Approach (CPA)
    if (tCPA < 0) return null; // if its null they have already passed each other, so we dont care about it
    const c = [rel[0] + dv[0]*tCPA, rel[1] + dv[1]*tCPA, rel[2] + dv[2]*tCPA];  //It calculates where the planes will be at tCPA
    return { tCPA, dCPA: norm(c) }; // same as above
}

export async function getConeConfig() {
  const raw = await redisClient.hGetAll(CONE_KEY);//It opens a little box in the Redis memory called CONE_KEY and reads
  return {
    lengthKm:     Number(raw.lengthKm)     || DEFAULT_CONE.lengthKm,  // raw treates as numbers , also tells if not tis use this 
    halfAngleDeg: Number(raw.halfAngleDeg) || DEFAULT_CONE.halfAngleDeg, //
  };
}

export async function setConeConfig({ lengthKm, halfAngleDeg }) {
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v)); // it locks it to the range of values that we want to allow, so you cant set a cone length of 1000 km or a half angle of 180 degrees, because that would be ridiculous and not useful for collision detection.
  const cfg = {
    lengthKm:     String(clamp(Number(lengthKm)     || 50, 1, 500)),
    halfAngleDeg: String(clamp(Number(halfAngleDeg) || 25, 1, 90)),  // string for redis storage, but we will convert it back to number when we read it
  };
  await redisClient.hSet(CONE_KEY, cfg);  // it writes into the redis about hte cone
  return { lengthKm: Number(cfg.lengthKm), halfAngleDeg: Number(cfg.halfAngleDeg) };
}

function classify(cpa, distKm) {
  if (cpa && cpa.tCPA < 30 && cpa.dCPA < 1000) return "critical";  // classify the severity of the alert based on how close the planes will be and how soon. If they will be within 1 km of each other in the next 30 seconds, that's a critical alert.
  if (cpa && cpa.tCPA < 90 && cpa.dCPA < 5000) return "warning";
  if (distKm < 5) return "warning";
  return "info";  
}

function pickFields(p) {  // we only care about these specific fields when we send out an alert, so we pick them out and ignore the rest. This keeps our alert messages smaller and focused on the important info.
  return {
    icao24: p.icao24, callsign: p.callsign,
    latitude: p.latitude, longitude: p.longitude,
    geoAltitude: p.geoAltitude ?? p.altitude ?? null,
    true_track: p.true_track, velocity: p.velocity,
  };
}

function parseFlight(raw) {
  if (!raw) return null;
  try { return JSON.parse(raw); } // turns the string so that the computer can understand if its long it picks out the essential fields
  catch { return null; }
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
export async function detectCollisions() {
//get cone params
  const cone = await getConeConfig();

  // get all ids of flight
  const ids = await redisClient.zRange(GEO_KEY, 0, -1);
  if (ids.length < 2) return { cone, alerts: [] };

  // get all data of flights using their ids
  const pipe = redisClient.multi();
  ids.forEach((id) => pipe.get(FLIGHT_KEY(id)));
  const rawList = await pipe.exec();
  // filter out flights if they do not hav lat, lon, true track or velocity 
  const planes = rawList.map(parseFlight).filter((p) =>
    p && p.latitude != null && p.longitude != null
      && p.true_track != null && p.velocity != null
  );
  // transform each flight to [icao, flight location]
  const byId = new Map(planes.map((p) => [p.icao24, p]));

  const seenPairs = new Set();// we will be comparing each plane to its neighbors, but we dont want to compare the same pair twice (A vs B and B vs A), so we keep track of which pairs we have already seen in this set. We create a unique key for each pair by sorting their ICAO24 identifiers and joining them with a "|". 
  const alerts = [];// we will store any collision alerts we generate in this array, and return it at the end. Each alert will include the pair of planes involved, their current positions and velocities, how close they will be to each other, and how soon that will happen.

  await Promise.all(planes.map(async (a) => {
    // for each plane search nerby flights with radius =  cone length
    const neighbors = await redisClient.geoSearchWith(
      GEO_KEY,
      { longitude: a.longitude, latitude: a.latitude },
      { radius: cone.lengthKm, unit: "km" },//Draw a big circle around Plane A. The circle should be as big as our 'danger flashlight
      ["WITHCOORD", "WITHDIST"],//Tell me exactly where the neighbors are and exactly how many kilometers away they are
      { COUNT: 200, SORT: "ASC" } //Find up to 200 neighbors, and show me the closest ones first (ASC means Ascending)
    );

    // 
    for (const n of neighbors) {
      if (n.member === a.icao24) continue;  // ignore yourself for redis search result it sometimes return yourself as a neighbor, so we skip that one

      const [lo, hi] = a.icao24 < n.member ? [a.icao24, n.member] : [n.member, a.icao24];//First, the code checks Plane A and finds Plane B as a neighbor. It does the math Later, the code checks Plane B and finds Plane A as a neighbor
      const key = `${lo}|${hi}`;  // seen pairs that we have alredy compared them 
      if (seenPairs.has(key)) continue;
      seenPairs.add(key);

      const b = byId.get(n.member); // we look up the full flight data for Plane B using its ICAO24 identifier. 
      // If we cant find it, we skip this neighbor and move on to the next one.
      if (!b) continue;

      const lengthM = cone.lengthKm * 1000;
      const aSeesB = isInCone3D(a, b, lengthM, cone.halfAngleDeg); // we check if Plane A sees Plane B in its danger flashlight cone.
      const bSeesA = isInCone3D(b, a, lengthM, cone.halfAngleDeg);//  If not, we skip this pair and move on to the next neighbor.
      if (!aSeesB || !bSeesA) continue;

      const cpa = closestApproach3D(a, b); // If they do see each other, we calculate their Closest Point of Approach (CPA) to see how close they will actually get to each other,
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

export async function startCollisionDetector() {
  // setInterval(async () => {
    try {
      const payload = await detectCollisions();
      console.log("alerts generated: ", payload.alerts.length)
      if (payload.alerts.length === 0) return;

      return payload;
      // const message = JSON.stringify({
      //   ts: Math.floor(Date.now() / 1000),
      //   ...payload,
      // });
      // await redisClient.publish(ALERT_CHANNEL, message);
      // console.log(`[collision] ${payload.alerts.length} alert(s) published`);
    } catch (e) {
      console.error("collision detector error:", e.message);
    }
  // }, 15000);
}

export { ALERT_CHANNEL };
