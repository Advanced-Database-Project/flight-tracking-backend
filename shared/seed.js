import connectneo4j from "./neo4j.js";
import { fetchflights } from "./utils.js";
import { storenodes } from "./utils.js";
import { storerelationships } from "./utils.js";
import { getdatafromNeo4j } from "./utils.js";
import { driver } from "./neo4j.js";


async function seed() {
  await connectneo4j()
  
   try {
    const flights = await fetchflights()

    await storenodes(flights)        
    await storerelationships(flights)

    const data = await getdatafromNeo4j()
    console.log('Sample record:', data)

  } catch (err) {
    console.error('Error:', err.message)
  } finally {
    await driver.close()
  }
}

seed()