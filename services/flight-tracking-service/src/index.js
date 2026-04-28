import env from "../../../shared/env.js";
import { connectRedis } from "./redisClient.js";
import { fetchStates } from "./openSkyService.js";
import { upsertFlights, reapStale } from "./liveStore.js";

const POLL_MS = Number(env.FLIGHT_TRACKING_POLL_MS) || 20_000;
const REAP_MS = Number(env.FLIGHT_TRACKING_REAP_MS) || 60_000;

async function pollOpenSky() {
  try {
    const bbox = env.OPENSKY_BBOX
      ? JSON.parse(env.OPENSKY_BBOX)
      : undefined;

    const states = await fetchStates(bbox);
    const result = await upsertFlights(states);
    console.log(`[flight-tracking] stored ${result.written} flights`);
  } catch (error) {
    console.error("[flight-tracking] poll error:", error?.message || error);
  }
}

async function reapStaleFlights() {
  try {
    const removed = await reapStale();
    if (removed > 0) {
      console.log(`[flight-tracking] removed ${removed} stale flights`);
    }
  } catch (error) {
    console.error("[flight-tracking] reap error:", error?.message || error);
  }
}

async function start() {
  try {
    await connectRedis();

    console.log("[flight-tracking] service started");
    await pollOpenSky();
    await reapStaleFlights();

    setInterval(pollOpenSky, POLL_MS);
    setInterval(reapStaleFlights, REAP_MS);
  } catch (error) {
    console.error("[flight-tracking] failed to start:", error?.message || error);
    process.exit(1);
  }
}

start();
