//

import { createClient } from "redis";

const redis = createClient();
redis.connect();

// ----------------------------------------

export const storeFlightState = async (flight) => {
  try {
    // latest state
    await redis.hSet(`flight:${flight[0]}`, {
      callsign: flight[1],
      lat: flight[6],
      lon: flight[5],
      altitude: flight[7],
      velocity: flight[9],
      heading: flight[10],
      timestamp: flight[3],
    });

    // // track history
    const snapshot = JSON.stringify({
      lat: flight[6],
      lon: flight[5],
      altitude: flight[7],
      velocity: flight[9],
      timestamp: flight[3],
    });

    const time_position = flight[3];
    await redis.zAdd(`track:${flight[0]}`, time_position, snapshot);

    // // remove record after 1 day ...
    await redis.expire(`track:${flight[0]}`, 86400);

    // console.log(`Stored flight ${flight[0]}`);
  } catch (err) {
    console.error(err);
  }
};
