import cron from "node-cron";
import { fetchFlights } from "./fetchFlights.js";
import { transformFlight } from "./controller/flightTrackingController.js";
import { redisClient, storeObjectRedis } from "./redis.js";
import axios from "axios";
import fs from "fs";

cron.schedule("*/5 * * * * *", async () => {
  console.log("Fetching flights...");

  try {
    const data = fs.readFileSync("./src/response.json", "utf8");
    const jsonData = JSON.parse(data);

    const flights = jsonData?.states?.map(transformFlight);

    storeObjectRedis(jsonData);

    console.log(`Stored ${flights.length} flights`);
  } catch (err) {
    console.error("Error:", err);
  }
});
