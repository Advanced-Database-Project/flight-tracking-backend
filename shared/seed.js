import connectneo4j from "./neo4j.js";
import { fetchFlights } from "./utils.js";
import { storeNodes } from "./utils.js";
import { storeRelationships } from "./utils.js";
import { getDataFromNeo4j } from "./utils.js";
import { driver } from "./neo4j.js";


async function seed() {
  await connectneo4j()

  try {
    const flights = await fetchFlights()

    await storeNodes(flights)
    await storeRelationships(flights)

    const data = await getDataFromNeo4j()
    console.log('Sample record:', data)

  } catch (err) {
    console.error('Error:', err.message)
  } finally {
    await driver.close()
  }
}

seed()