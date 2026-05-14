import { redisClient } from "./redis.js";
import {
  getLiveFlightData,
  transformFlight,
} from "./controller/flightTrackingController.js";

let currentPlaybackTime = 1638748800;

const isValidFlight = (flight) => {
  return (
    flight[0] != null &&
    flight[5] != null &&
    flight[6] != null &&
    flight[7] != null &&
    flight[9] != null &&
    flight[10] != null
  );
};

const ingestHistoricalDataToRedis = async (mongoData) => {
  const ZSET_KEY = "flight-tracking-data";
  const multi = redisClient.multi();

  for (const flight of mongoData) {
    multi.zAdd(ZSET_KEY, {
      score: flight.time, // The timestamp sorts the data
      value: JSON.stringify(flight), // data
    });
  }

  await multi.exec();
  console.log(`✅ Queued ${mongoData.length} historical records into Redis.`);
};

const ingestLiveDataToRedis = async (timestamp, data) => {
  // const ZSET_KEY = "flight-tracking-data";
  const multi = redisClient.multi();

  for (const flight of data) {
    const flightString = JSON.stringify(flight);

    multi.set(`flight:${flight.icao24}`, flightString, { EX: 300 });

    if (flight.longitude && flight.latitude) {
      multi.geoAdd("flight_locations", {
        longitude: flight.longitude,
        latitude: flight.latitude,
        member: flight.icao24,
      });

      multi.zAdd("flight_timestamps", {
        score: timestamp,
        value: flight.icao24,
      });
    }
  }

  await multi.exec();
  console.log(`✅ Queued ${data.length} live records into Redis.`);
};

const getHistoricalDataFromMongo = async () => {
    setInterval(async () => {
  try {
    // 1. Fetch all data up for the current playback time
    // zRangeByScore fetches data where the score is between 0 and currentPlaybackTime
    const rawFlights = await getLiveFlightData();
    console.log(
      "GOT live flights for time stamp: ",
      rawFlights.time,
      " length: ",
      rawFlights.states.length,
    );

    if (rawFlights.states.length > 0) {
      const flights = rawFlights.states
      .filter(isValidFlight)
      .map(transformFlight);
      ingestLiveDataToRedis(rawFlights.time, flights);
    } else {
      console.log(
        `⏳ No data ready for time ${currentPlaybackTime} in MONGO DB. Waiting...`,
      );
    }
    currentPlaybackTime += 10;
  } catch (error) {
    console.error("Playback failed:", error);
  }
    }, 15000);
};

const getLiveData = async () => {
    // setInterval(async () => {
  try {
   
    const rawFlights = await getLiveFlightData();
    console.log(
      "GOT live flights for time stamp: ",
      rawFlights.time,
      " length: ",
      rawFlights.states.length,
    );

    if (rawFlights.states.length > 0) {
      const flights = rawFlights.states.map(transformFlight);
      ingestLiveDataToRedis(rawFlights.time, flights);
    } else {
      console.log(
        `⏳ No data ready for time ${currentPlaybackTime} in MONGO DB. Waiting...`,
      );
    }
    currentPlaybackTime += 10;
  } catch (error) {
    console.error("Playback failed:", error);
  }
    // }, 15000);
};

export { ingestHistoricalDataToRedis, getHistoricalDataFromMongo, getLiveData };
// Example usage:
// const data = await mongoDB.collection('flights').find({...}).toArray();
// ingestHistoricalDataFromMongo(data);
