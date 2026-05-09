import axios from "axios";
import env from "../../../../shared/env.js";

import LiveFlightTracking from "../model/LiveFlightTracking.js";

export const transformFlight = (flight) => {
  return {
    icao24: flight[0],
    callsign: flight[1]?.trim(),
    country: flight[2],
    longitude: flight[5],
    latitude: flight[6],
    altitude: flight[7],
    velocity: flight[9],
  };
};

export const getFlightDataForTimestamp = async (timestamp) => {
  try {
    const flightData = await LiveFlightTracking.find({
      time: `${timestamp}`,
    }).limit(10);
    console.log(
      "SUCCESS for getting flight tracking data in MONGO DB for: ",
      timestamp,
      "length: ",
      flightData.length,
    );
    return flightData;
  } catch (err) {
    console.log("ERROR getting flight tracking data for time: ", timestamp);
    console.log("ERRORRRRRRRRRRRRR: ", err.message);
  }
};

export const getLiveFlightData = async () => {
  try {

    const response = await axios.get(
      "https://opensky-network.org/api/states/all",
      {
        headers: {
          Authorization: "Bearer " + env.TOKEN,
        },
      },
    );
    const flightData = response.data;
    console.log(
      "SUCCESS for getting live flight tracking from API time:",
      flightData.time,
      " length: ",
      flightData.length,
    );
    return response.data;
  } catch (err) {
    console.log("ERROR getting  live flight tracking data from API ");
    console.log("ERRORRRRRRRRRRRRR: ", err.message);
  }
};
