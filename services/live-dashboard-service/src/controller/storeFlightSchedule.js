//

import { createClient } from "redis";

const redis = createClient();
redis.connect();

// ----------------------------------------

async function storeFlightSchedule(data) {
  try {
    const callsign = data.flight.iata.trim().toUpperCase();

    const schedule = {
      departureAirport: data.departure.iata,

      scheduledDeparture: new Date(data.departure.scheduled).getTime(),

      arrivalAirport: data.arrival.iata,

      scheduledArrival: new Date(data.arrival.scheduled).getTime(),

      estimatedArrival: new Date(data.arrival.estimated).getTime(),
    };

    await redis.hset(`schedule:${callsign}`, schedule);

    console.log(`Stored schedule ${callsign}`);
  } catch (err) {
    console.error(err);
  }
}

module.exports = storeFlightSchedule;
