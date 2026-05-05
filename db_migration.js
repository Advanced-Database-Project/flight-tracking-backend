//

import { MongoClient } from "mongodb";
import env from "./shared/env.js";

// ----------------------------------------

async function run() {
  const client = new MongoClient(env.MONGODB_URI);
  await client.connect();
  const db = client.db(env.MONGODB_DATABASE_NAME);
  const collection = db.collection("live_flight_tracking");

  const result = await collection.find().toArray();

  console.log(result);
}

run();
