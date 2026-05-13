//

import axios from "axios";
import env from "../../../../shared/env.js";

// ----------------------------------------

const now = new Date("2026-05-10T12:00:00Z");

export const getArrivalDepartureByAirportData = async (data) => {
  const tenMinutesBefore = new Date(now.getTime() - 10 * 60 * 1000);
  const oneHourLater = new Date(now.getTime() + 5 * 60 * 60 * 1000);

  try {
    const response = await Promise.all([
      axios.get(
        env.LIVE_DASHBOARD_EXTERNAL_API +
          "api/flights/arrival?airport=" +
          data?.city +
          "&begin=" +
          Math.floor(tenMinutesBefore.getTime() / 1000) +
          "&end=" +
          Math.floor(oneHourLater.getTime() / 1000),
        {
          headers: {
            Authorization: "Bearer " + env.TOKEN,
          },
        },
      ),

      axios.get(
        env.LIVE_DASHBOARD_EXTERNAL_API +
          "api/flights/departure?airport=" +
          data?.city +
          "&begin=" +
          Math.floor(tenMinutesBefore.getTime() / 1000) +
          "&end=" +
          Math.floor(oneHourLater.getTime() / 1000),

        {
          headers: {
            Authorization: "Bearer " + env.TOKEN,
          },
        },
      ),
    ]);

    return response;
  } catch (err) {
    console.log(err);
  }
};
