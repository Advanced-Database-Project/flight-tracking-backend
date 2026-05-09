// there will be some functions here which are shared by the services

import { get } from "mongoose";
import axios from "axios";
import env from "./env.js";

export const getAccesstoken = async () => {
  try {
    const response = await axios.post(
      "https://auth.opensky-network.org/auth/realms/opensky-network/protocol/openid-connect/token",
      new URLSearchParams({
        grant_type: "client_credentials",
        client_id: env.CLIENT_ID,
        client_secret: env.CLIENT_SECRET,
      }),
    );

    console.log(response);

    console.log("SUCCESS for getting access token: ", response.data);

    return response.data.access_token;
  } catch (err) {
    console.log("ERROR getting  live flight tracking data from API ");
    console.log("ERRORRRRRRRRRRRRR: ", err.message);
  }
};

getAccesstoken();
