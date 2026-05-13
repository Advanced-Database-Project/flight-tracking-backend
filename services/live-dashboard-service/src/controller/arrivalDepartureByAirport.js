//

import { getArrivalDepartureByAirportData } from "./getAirportData.js";
import { createClient } from "redis";

// ----------------------------------------

export const redis = createClient();

await redis.connect();

export const getArrivalDepartureByAirport = async (data) => {
  let reponse = {};

  reponse = await getArrivalDepartureByAirportData(data);

  for (const flight of reponse[0]?.data) {
    const key = `arr-${data.city}-${flight.icao24}`;

    await redis.hSet(key, {
      icao24: flight.icao24 || "",
      callsign: flight.callsign || "",
      departure: flight.estDepartureAirport || "",
      arrival: flight.estArrivalAirport || "",
      firstSeen: flight.firstSeen || "",
      lastSeen: flight.lastSeen || "",
    });

    await redis.expire(key, 3600);
  }

  for (const flight of reponse[1]?.data) {
    const key = `dep-${data.city}-${flight.icao24}`;

    await redis.hSet(key, {
      icao24: flight.icao24 || "",
      callsign: flight.callsign || "",
      departure: flight.estDepartureAirport || "",
      arrival: flight.estArrivalAirport || "",
      firstSeen: flight.firstSeen || "",
      lastSeen: flight.lastSeen || "",
    });

    await redis.expire(key, 3600);
  }

  return reponse;
};
