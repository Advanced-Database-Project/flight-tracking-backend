import neo4j from "neo4j-driver";
import env from "./env.js";
import connectneo4j from "./neo4j.js";


async function seed() {
  const session = driver.session()

  try {
    console.log('Fetching routes from AviationStack...')

    const response = await axios.get('http://api.aviationstack.com/v1/routes', {
      params: {
        access_key: env.AVIATIONSTACK_KEY,
        limit: 100
      }
    })

    const routes = response.data.data
    console.log(`Got ${routes.length} routes`)

    for (const route of routes) {
      const dep = route.departure
      const arr = route.arrival

      if (!dep.iata || !arr.iata) continue

      await session.run(`
        MERGE (a:Airport {code: $from})
        MERGE (b:Airport {code: $to})
        MERGE (a)-[:FLIES_TO]->(b)
      `, { from: dep.iata, to: arr.iata })

      console.log(`Seeded: ${dep.iata} → ${arr.iata}`)
    }

    console.log('Done!')
  } catch (err) {
    console.error('Error:', err.message)
  } finally {
    await session.close()
    await driver.close()
  }
}

seed()