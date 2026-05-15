//

import { getArrivalDepartureByAirportData } from "./getAirportData.js";
import { createClient } from "redis";
// import { storeFlightState } from "./storeFlightStates.js";

// ----------------------------------------

export const redis = createClient();

await redis.connect();

export const getArrivalDepartureByAirport = async (data) => {
  let reponse = {};

  reponse = await getArrivalDepartureByAirportData(data);

  if (reponse?.length) {
    for (const flight of reponse[0]?.data?.data) {
      const key = `arr-${flight?.flight?.icao}`;

      // storeFlightState(flight);
      await redis.hSet(key, {
        icao24: flight?.flight?.icao24 || "",
        departure: flight?.departure?.scheduled || "",
        arrival: flight?.arrival?.scheduled || "",
      });
      await redis.expire(key, 3600);
    }

    for (const flight of reponse[1]?.data?.data) {
      const key = `dep-${flight?.flight?.icao}`;

      await redis.hSet(key, {
        icao24: flight?.flight?.icao24 || "",
        departure: flight?.departure?.scheduled || "",
        arrival: flight?.arrival?.scheduled || "",
      });

      await redis.expire(key, 3600);
    }
  }

  return reponse;
};
