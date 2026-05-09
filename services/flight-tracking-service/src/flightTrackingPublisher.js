// (Runs every 1 second)

import { redisClient } from "./redis.js";

const ZSET_KEY = "flight-tracking-data";
const PUB_CHANNEL = "live-flight-tracking";

// historical data starts at this timestamp
let currentPlaybackTime = 1778330347;

const startFlightTrackingPublisher = async () => {
    setInterval(async () => {
  try {
    

    const activeIcaoIDs = await redisClient.zRange("flight_timestamps", 0, -1);
    if (activeIcaoIDs.length > 0) {
      const keysToFetch = activeIcaoIDs.map((id) => `flight:${id}`);

     
      const rawFlightData = await redisClient.mGet(keysToFetch);

   
      const currentFlights = rawFlightData
        .filter((data) => data !== null)
        .map((data) => JSON.parse(data));

     await redisClient.publish(PUB_CHANNEL, JSON.stringify(currentFlights));
      console.log(
        `📡 Broadcasted ${currentFlights.length} live flights`,
      );
    }


    

    // Advance the playback clock by 10 second for the next loop
    currentPlaybackTime += 10;
  } catch (error) {
    console.error("Playback failed:", error);
  }
    }, 15000);
};
export { startFlightTrackingPublisher };
