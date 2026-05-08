import axios from "axios";
import env from "./env.js";
import { driver } from "./neo4j.js";


export async function fetchFlights() {
  console.log('Fetching flights from AviationStack...')

  const response = await axios.get('http://api.aviationstack.com/v1/flights', {
    params: {
      access_key: env.AVIATIONSTACK_KEY,
      limit: 100
    }
  })

  const flights = response.data.data
  console.log(`Got ${flights.length} flights`)
  return flights
}

export async function storeNodes(flights) {
  console.log('Storing Airport and Airline nodes...')

  for (const flight of flights) {
    const dep = flight.departure
    const arr = flight.arrival
    const airline = flight.airline

    if (!dep?.iata || !arr?.iata) continue

    await driver.executeQuery(`
      MERGE (dep:Airport {code: $depIata})
      SET dep.code     = $depIata,
          dep.name     = $depName,
          dep.timezone = $depTimezone,
          dep.icao     = $depIcao

      MERGE (arr:Airport {code: $arrIata})
      SET arr.code     = $arrIata,
          arr.name     = $arrName,
          arr.timezone = $arrTimezone,
          arr.icao     = $arrIcao

      WITH dep, arr
      WHERE $airlineIata IS NOT NULL
      MERGE (al:Airline {iata: $airlineIata})
      SET al.id          = $airlineId,
          al.iata        = $airlineIata,
          al.icao        = $airlineIcao,
          al.name        = $airlineName,
          al.countryName = $airlineCountry,
          al.type        = $airlineType
    `, {
      depIata:        dep.iata,
      depName:        dep.airport          || null,
      depTimezone:    dep.timezone         || null,
      depIcao:        dep.icao             || null,

      arrIata:        arr.iata,
      arrName:        arr.airport          || null,
      arrTimezone:    arr.timezone         || null,
      arrIcao:        arr.icao             || null,

      airlineId:      airline?.id          || null,
      airlineIata:    airline?.iata        || null,
      airlineIcao:    airline?.icao        || null,
      airlineName:    airline?.name        || null,
      airlineCountry: airline?.country_name || null,
      airlineType:    airline?.type        || null,
    })

    console.log(`Nodes: ${dep.iata} | ${arr.iata} | Airline: ${airline?.name}`)
  }

  console.log('Done storing nodes!')
}

export async function storeRelationships(flights) {
  console.log('Storing Flight nodes and relationships...')

  for (const flight of flights) {
    const dep = flight.departure
    const arr = flight.arrival
    const airline = flight.airline
    const fl = flight.flight

    if (!dep?.iata || !arr?.iata || !fl?.iata) continue

    await driver.executeQuery(`
      MATCH (dep:Airport {code: $depIata})
      MATCH (arr:Airport {code: $arrIata})

      MERGE (f:Flight {iata: $flightIata})
      SET f.iata   = $flightIata,
          f.number = $flightNumber,
          f.icao   = $flightIcao

      MERGE (f)-[r1:DEPARTS_FROM]->(dep)
      SET r1.scheduled       = $depScheduled,
          r1.estimated       = $depEstimated,
          r1.actual          = $depActual,
          r1.estimatedRunway = $depEstimatedRunway,
          r1.actualRunway    = $depActualRunway,
          r1.delay           = $depDelay,
          r1.terminal        = $depTerminal,
          r1.gate            = $depGate,
          r1.baggage         = $depBaggage

      MERGE (f)-[r2:ARRIVES_AT]->(arr)
      SET r2.scheduled       = $arrScheduled,
          r2.estimated       = $arrEstimated,
          r2.actual          = $arrActual,
          r2.estimatedRunway = $arrEstimatedRunway,
          r2.actualRunway    = $arrActualRunway,
          r2.delay           = $arrDelay,
          r2.terminal        = $arrTerminal,
          r2.gate            = $arrGate,
          r2.baggage         = $arrBaggage

      WITH f
      WHERE $airlineIata IS NOT NULL
      MATCH (al:Airline {iata: $airlineIata})
      MERGE (al)-[:OPERATES]->(f)
    `, {
      depIata:            dep.iata,
      arrIata:            arr.iata,

      flightIata:         fl.iata,
      flightNumber:       fl?.number           || null,
      flightIcao:         fl?.icao             || null,

      depScheduled:       dep.scheduled        || null,
      depEstimated:       dep.estimated        || null,
      depActual:          dep.actual           || null,
      depEstimatedRunway: dep.estimated_runway || null,
      depActualRunway:    dep.actual_runway    || null,
      depDelay:           dep.delay            || null,
      depTerminal:        dep.terminal         || null,
      depGate:            dep.gate             || null,
      depBaggage:         dep.baggage          || null,

      arrScheduled:       arr.scheduled        || null,
      arrEstimated:       arr.estimated        || null,
      arrActual:          arr.actual           || null,
      arrEstimatedRunway: arr.estimated_runway || null,
      arrActualRunway:    arr.actual_runway    || null,
      arrDelay:           arr.delay            || null,
      arrTerminal:        arr.terminal         || null,
      arrGate:            arr.gate             || null,
      arrBaggage:         arr.baggage          || null,

      airlineIata:        airline?.iata        || null,
    })

    console.log(`Flight: ${fl.iata} | ${dep.iata} → ${arr.iata}`)
  }

  console.log('Done storing flights!')
}

export async function getDataFromNeo4j() {
  console.log('Retrieving data from Neo4j...')

  const result = await driver.executeQuery(`
    MATCH (al:Airline)-[:OPERATES]->(f:Flight)-[:DEPARTS_FROM]->(dep:Airport)
    MATCH (f)-[:ARRIVES_AT]->(arr:Airport)
    RETURN properties(al) AS airline,
           properties(f)  AS flight,
           properties(dep) AS departure,
           properties(arr) AS arrival
  `)

  const data = result.records.map(record => ({
    airline:   record.get('airline'),
    flight:    record.get('flight'),
    departure: record.get('departure'),
    arrival:   record.get('arrival')
  }))

  console.log(`Retrieved ${data.length} records`)
  return data
}

export async function findRoute(from, to) {
  const result = await driver.executeQuery(`
    MATCH (src:Airport {code: $from})<-[r1:DEPARTS_FROM]-(f1:Flight)-[r2:ARRIVES_AT]->(dst:Airport {code: $to})
    WHERE r1.scheduled >= datetime()
    OPTIONAL MATCH (al1:Airline)-[:OPERATES]->(f1)
    RETURN 0 AS layovers,
           properties(src) AS source,
           properties(dst) AS destination,
           [] AS layoverAirports,
           [{from: src.code, to: dst.code, flight: properties(f1), airline: properties(al1),
             departure: properties(r1), arrival: properties(r2)}] AS segments
    LIMIT 5

    UNION

    MATCH (src:Airport {code: $from})<-[r1:DEPARTS_FROM]-(f1:Flight)-[r2:ARRIVES_AT]->(mid:Airport)<-[r3:DEPARTS_FROM]-(f2:Flight)-[r4:ARRIVES_AT]->(dst:Airport {code: $to})
    WHERE mid.code <> $from AND mid.code <> $to
      AND r1.scheduled >= datetime()
      AND r3.scheduled >= r2.scheduled + duration({minutes: 30})
    OPTIONAL MATCH (al1:Airline)-[:OPERATES]->(f1)
    OPTIONAL MATCH (al2:Airline)-[:OPERATES]->(f2)
    RETURN 1 AS layovers,
           properties(src) AS source,
           properties(dst) AS destination,
           [properties(mid)] AS layoverAirports,
           [{from: src.code, to: mid.code, flight: properties(f1), airline: properties(al1),
             departure: properties(r1), arrival: properties(r2)},
            {from: mid.code, to: dst.code, flight: properties(f2), airline: properties(al2),
             departure: properties(r3), arrival: properties(r4)}] AS segments
    LIMIT 5

    UNION

    MATCH (src:Airport {code: $from})<-[r1:DEPARTS_FROM]-(f1:Flight)-[r2:ARRIVES_AT]->(mid1:Airport)<-[r3:DEPARTS_FROM]-(f2:Flight)-[r4:ARRIVES_AT]->(mid2:Airport)<-[r5:DEPARTS_FROM]-(f3:Flight)-[r6:ARRIVES_AT]->(dst:Airport {code: $to})
    WHERE mid1.code <> $from AND mid1.code <> $to
      AND mid2.code <> $from AND mid2.code <> $to
      AND mid1.code <> mid2.code
      AND r1.scheduled >= datetime()
      AND r3.scheduled >= r2.scheduled + duration({minutes: 30})
      AND r5.scheduled >= r4.scheduled + duration({minutes: 30})
    OPTIONAL MATCH (al1:Airline)-[:OPERATES]->(f1)
    OPTIONAL MATCH (al2:Airline)-[:OPERATES]->(f2)
    OPTIONAL MATCH (al3:Airline)-[:OPERATES]->(f3)
    RETURN 2 AS layovers,
           properties(src) AS source,
           properties(dst) AS destination,
           [properties(mid1), properties(mid2)] AS layoverAirports,
           [{from: src.code, to: mid1.code, flight: properties(f1), airline: properties(al1),
             departure: properties(r1), arrival: properties(r2)},
            {from: mid1.code, to: mid2.code, flight: properties(f2), airline: properties(al2),
             departure: properties(r3), arrival: properties(r4)},
            {from: mid2.code, to: dst.code, flight: properties(f3), airline: properties(al3),
             departure: properties(r5), arrival: properties(r6)}] AS segments
    LIMIT 5
  `, { from: from.toUpperCase(), to: to.toUpperCase() })

  if (!result.records.length) return null
  
  return result.records
    .sort((a, b) => Number(a.get('layovers')) - Number(b.get('layovers')))
    .slice(0, 5)
    .map(r => ({
      source:          r.get('source'),
      destination:     r.get('destination'),
      layovers:        parseInt(r.get('layovers')),
      layoverAirports: r.get('layoverAirports'),
      segments:        r.get('segments')
    }))
}

  