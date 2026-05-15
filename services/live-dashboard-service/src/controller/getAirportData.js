//

import axios from "axios";
import env from "../../../../shared/env.js";

// ----------------------------------------

export const getArrivalDepartureByAirportData = async (data) => {
  const arrOp = {
    method: "GET",
    url: "https://api.aviationstack.com/v1/flights",
    params: { access_key: env.AVIATIONSTACK_KEY, arr_icao: data?.city },
    headers: { Accept: "application/json" },
  };

  const depOp = {
    method: "GET",
    url: "https://api.aviationstack.com/v1/flights",
    params: { access_key: env.AVIATIONSTACK_KEY, dep_icao: data?.city },
    headers: { Accept: "application/json" },
  };

  try {
    const response = await Promise.all([
      axios.request(arrOp),
      axios.request(depOp),
    ]);

    return response;
  } catch (err) {
    console.log(err.message);
  }
};
