//

import fs from "fs";
import path from "path";
import csv from "csv-parser";
import { MongoClient } from "mongodb";
import env from "../../../shared/env.js";

// ----------------------------------------

const collectionName = "flight_records";
const fileName = "aircraft-database-complete-2021-12.csv";

async function flightRecordsMigration() {
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
    "flights",
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
      if (row?.icao24?.length) {
        batch.push({
          icao24: row.icao24,
          registration: row.registration,
          manufacturerIcao: row.manufacturerIcao,
          manufacturerName: row.manufacturerName,
          model: row.module,
          typecode: row.typecode,
          serialNumber: row.serialNumber,
          lineNumber: row.lineNumber,
          aircraftType: row.aircraftType,
          operator: row.operator,
          operatorCallsign: row.operatorCallsign,
          operatorIcao: row.operatorIcao,
          operatorIata: row.operatorIata,
          owner: row.owner,
          adsbCategory: row.adsbCategory,
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

export default flightRecordsMigration;
