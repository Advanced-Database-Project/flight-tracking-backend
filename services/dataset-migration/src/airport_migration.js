//

import fs from "fs";
import path from "path";
import csv from "csv-parser";
import { MongoClient } from "mongodb";
import env from "../../../shared/env.js";

// ----------------------------------------

const collectionName = "airports";
const fileName = "airports.csv";

async function airportsMigration() {
  const client = new MongoClient(env.MONGODB_URI);

  await client.connect();

  const db = client.db(env.MONGODB_DATABASE_NAME);
  const collection = db.collection(collectionName);

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
    "airports",
    fileName,
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
      if (row?.name) {
        batch.push({
          name: row.name,
          iata: row.iata,
          icao: row.icao,
          lat: row.lat,
          lon: row.lon,
          country: row.country,
          alt: row.alt,
        });

        if (batch.length === 1000) {
          console.log("inserting with length: 1000 ", batch.length);

          //   collection.insertMany(batch.splice(0, 1000));
        }
      }
    })
    .on("end", async () => {
      console.log("last batch to insert with length: ", batch.length);

      //   if (batch.length) await collection.insertMany(batch);

      console.log(" insertion Done");
    });
}

export default airportsMigration;
