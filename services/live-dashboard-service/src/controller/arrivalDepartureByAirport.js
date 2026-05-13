//

import { getArrivalDepartureByAirportData } from "./getAirportData.js";

// ----------------------------------------

export const getArrivalDepartureByAirport = async (data) => {
  let reponse = {};

  reponse = await getArrivalDepartureByAirportData(data);

  return reponse;
};
