

import axios from "axios";
import env from "../../../shared/env.js";

export const fetchFlights = async () => {
    try {
      const response = await axios.get(
          "https://opensky-network.org/api/states/all",
        // env.OPENSKY_API_ENDPOINT_STATE_ALL,
        {
          auth: {
            username: "username",
            password: "password",
          },
        },
      );

      console.log(response.data);

      return response.data.states || [];
    } catch (error) {
      console.error("OpenSky error:", error.message);
      return [];
    }

  const response = await axios
    .get("https://opensky-network.org/api/states/all", {
      headers: {
        Authorization:
          "Bearer " +
          "eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICJ0SVIwSDB0bmNEZTlKYmp4dFctWEtqZ0RYSWExNnR5eU5DWHJxUzJQNkRjIn0.eyJleHAiOjE3Nzc0NzQyNjYsImlhdCI6MTc3NzQ3MjQ2NiwianRpIjoiMDE0YWExYzgtYWRhYy00NjE1LTliNjgtYjBmZjNlNDgyYjk2IiwiaXNzIjoiaHR0cHM6Ly9hdXRoLm9wZW5za3ktbmV0d29yay5vcmcvYXV0aC9yZWFsbXMvb3BlbnNreS1uZXR3b3JrIiwiYXVkIjpbIndlYnNpdGUtdWkiLCJhY2NvdW50Il0sInN1YiI6ImNjOWY5N2YwLWIxOWMtNGViNi05MGRkLTNjOGY4NGU2ZmEyNSIsInR5cCI6IkJlYXJlciIsImF6cCI6ImRlZXB2YWR1a2l5YS1hcGktY2xpZW50IiwiYWNyIjoiMSIsInJlYWxtX2FjY2VzcyI6eyJyb2xlcyI6WyJvZmZsaW5lX2FjY2VzcyIsIk9QRU5TS1lfQVBJX0RFRkFVTFQiLCJ1bWFfYXV0aG9yaXphdGlvbiIsImRlZmF1bHQtcm9sZXMtb3BlbnNreS1uZXR3b3JrIl19LCJyZXNvdXJjZV9hY2Nlc3MiOnsid2Vic2l0ZS11aSI6eyJyb2xlcyI6WyJvcGVuc2t5X3dlYnNpdGVfdXNlciJdfSwiYWNjb3VudCI6eyJyb2xlcyI6WyJtYW5hZ2UtYWNjb3VudCIsIm1hbmFnZS1hY2NvdW50LWxpbmtzIiwidmlldy1wcm9maWxlIl19fSwic2NvcGUiOiJwcm9maWxlIGVtYWlsIiwiY2xpZW50SG9zdCI6IjE5My4xOTcuNzQuMzkiLCJjbGllbnRJZCI6ImRlZXB2YWR1a2l5YS1hcGktY2xpZW50IiwiZW1haWxfdmVyaWZpZWQiOmZhbHNlLCJwcmVmZXJyZWRfdXNlcm5hbWUiOiJzZXJ2aWNlLWFjY291bnQtZGVlcHZhZHVraXlhLWFwaS1jbGllbnQiLCJjbGllbnRBZGRyZXNzIjoiMTkzLjE5Ny43NC4zOSJ9.FSq5c67cfojpPE0hX0SUV7EGE8LXkV8sQ-mmGnPVODcpHSNnRS3Dor4tPnKda-Y81CE-R5vRiYqM7raPN9e1XIjPU4_yfZWZ9xj-g-Vic63fzgAqyP-QUpOxLwiCeD_2WHY6rIRlcB5uDxo66Rq0GTWbkKYFUGQjyBDNn4b1yqgl8JPdOwKd_906t6CHj0A1KsouK7BNA4CbTza7OBvdpjNQOmg3MlzcfwxseqjpQCwhceI8HiYlO_T9v0qQWVeSJ_qCinofw_7nMbECpgIBMl9r3HLcgTKoZt867IUA2SXoNgyoHwiKEybnBYCVa6PavORsqsJRL1b93nVpGQCBkw",
      },
    })
    .then((res) => {
      console.log(res);
      console.log(res.data.states[0][0]);
      fs.writeFileSync("response.json", JSON.stringify(res.data, null, 2));
      console.log("Response saved to response.json");
      // console.log(res.access_token);
    })
    .catch((err) => {
      console.log("EEEEEEEEEEEEEEEEEEEEEEEEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRR");
      console.log(err);
    });
    return response;
};
