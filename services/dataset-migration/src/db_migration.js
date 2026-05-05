//

import fs from "fs";
import path from "path";
import csv from "csv-parser";
import { MongoClient } from "mongodb";
import env from "../../../shared/env.js";

// ----------------------------------------

async function liveFlightTracking() {
  const client = new MongoClient(env.MONGODB_URI);

  await client.connect();

  const db = client.db(env.MONGODB_DATABASE_NAME);
  const collection = db.collection("live_flight_tracking");

  //   const result = await collection.find().toArray();
  //   console.log(result);

  // absolute path to dataset files
  const __dirname = path.dirname(new URL(import.meta.url).pathname);
  const csvPath = path.resolve(
    __dirname,
    "..",
    "..",
    "..",
    "datasets",
    "live_tracking_datasets",
    "states_2021-12-06-00.csv",
  );

  const stream = fs.createReadStream(csvPath);

  stream.on("error", (err) => {
    console.error("Failed to read CSV file:", csvPath, err.message);
    throw err;
  });

  const batch = [];

  stream
    .pipe(csv())
    .on("data", (row) => {
      if (row.lat && row.lon) {
        batch.push({
          time: Number(row.time),
          icao24: row.icao24,
          lat: Number(row.lat),
          lon: Number(row.lon),
          velocity: Number(row.velocity),
          heading: Number(row.heading),
          vertrate: Number(row.vertrate),
          onground: row.onground,
          baroaltitude: Number(row.baroaltitude),
          geoaltitude: Number(row.geoaltitude),
        });

        if (batch.length === 1000) {
          console.log("inserting with length: 1000 ", batch.length);

          // collection.insertMany(batch.splice(0, 1000));
        }
      }
    })
    .on("end", async () => {
      console.log("last batch to insert with length: ", batch.length);

      // if (batch.length) await collection.insertMany(batch);

      console.log(" insertion Done");
    });
}

export default liveFlightTracking;
