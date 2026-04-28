import { createClient } from "redis";
import env from "../../../shared/env.js";

const REDIS_URL = env.REDIS_URL || "redis://localhost:6379";

// We need THREE separate connections to Redis. Why?
// A Redis client that has SUBSCRIBE'd cannot run normal commands.
// And a publisher works fine on the main client, but keeping it separate
// is a clean convention that scales nicely.
//
//   redis     - normal commands (HSET, GEOADD, EXPIRE, ...)
//   redisPub  - publishes JSON batches on the "live:flights" channel
//   redisSub  - subscribes to that channel inside socketServer.js

export const redis = createClient({ url: REDIS_URL });
export const redisPub = redis.duplicate();
export const redisSub = redis.duplicate();

redis.on("error", (e) => console.error("[redis] error:", e.message));

export async function connectRedis() {
  await Promise.all([
    redis.connect(),
    redisPub.connect(),
    redisSub.connect(),
  ]);
  console.log("[redis] connected");
}
