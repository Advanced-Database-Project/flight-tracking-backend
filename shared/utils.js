import axios from "axios";
import env from "./env.js";
import { driver } from "./neo4j.js";


export async function fetchflights() {
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

 export async function storenodes(flights) {
  console.log('Storing Airport and Airline nodes...')
 
  for (const flight of flights) {
    const dep = flight.departure
    const arr = flight.arrival
    const airline = flight.airline

    if (!dep?.iata || !arr?.iata) continue

    await driver.executeQuery(`
      MERGE (dep:Airport {code: $depIata})
      SET dep.code = $depIata,
          dep.name = $depName,
          dep.timezone = $depTimezone,
          dep.icao = $depIcao

      MERGE (arr:Airport {code: $arrIata})
      SET arr.code = $arrIata,
          arr.name = $arrName,
          arr.timezone = $arrTimezone,
          arr.icao = $arrIcao

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
      depName:        dep.airport        || null,
      depTimezone:    dep.timezone       || null,
      depIcao:        dep.icao           || null,

      arrIata:        arr.iata,
      arrName:        arr.airport        || null,
      arrTimezone:    arr.timezone       || null,
      arrIcao:        arr.icao           || null,

      airlineId:      airline?.id        || null,
      airlineIata:    airline?.iata      || null,
      airlineIcao:    airline?.icao      || null,
      airlineName:    airline?.name      || null,
      airlineCountry: airline?.country_name || null,
      airlineType:    airline?.type      || null,
    })

    console.log(`Nodes: ${dep.iata} | ${arr.iata} | Airline: ${airline?.name}`)
  }

  console.log('Done storing nodes!')
}

export async function storerelationships(flights) {
  console.log('Storing relationships...')
 
  for (const flight of flights) {
    const dep = flight.departure
    const arr = flight.arrival
    const airline = flight.airline
    const fl = flight.flight

    if (!dep?.iata || !arr?.iata) continue

    await driver.executeQuery(`
      MATCH (dep:Airport {code: $depIata})
      MATCH (arr:Airport {code: $arrIata})

      MERGE (dep)-[r1:FLIES_TO]->(arr)
      SET r1.flightIata       = $flightIata,
          r1.flightNumber     = $flightNumber,
          r1.flightIcao       = $flightIcao,
          r1.depScheduled     = $depScheduled,
          r1.depEstimated     = $depEstimated,
          r1.depActual        = $depActual,
          r1.depEstimatedRunway = $depEstimatedRunway,
          r1.depActualRunway  = $depActualRunway,
          r1.depDelay         = $depDelay,
          r1.depTerminal      = $depTerminal,
          r1.depGate          = $depGate,
          r1.depBaggage       = $depBaggage,
          r1.arrScheduled     = $arrScheduled,
          r1.arrEstimated     = $arrEstimated,
          r1.arrActual        = $arrActual,
          r1.arrEstimatedRunway = $arrEstimatedRunway,
          r1.arrActualRunway  = $arrActualRunway,
          r1.arrDelay         = $arrDelay,
          r1.arrTerminal      = $arrTerminal,
          r1.arrGate          = $arrGate,
          r1.arrBaggage       = $arrBaggage

      WITH dep, arr
      WHERE $airlineIata IS NOT NULL
      MATCH (al:Airline {iata: $airlineIata})
      MERGE (al)-[r2:OPERATES]->(dep)-[:FLIES_TO]->(arr)
    `, {
      depIata:              dep.iata,
      arrIata:              arr.iata,

      flightIata:           fl?.iata             || null,
      flightNumber:         fl?.number           || null,
      flightIcao:           fl?.icao             || null,

      depScheduled:         dep.scheduled        || null,
      depEstimated:         dep.estimated        || null,
      depActual:            dep.actual           || null,
      depEstimatedRunway:   dep.estimated_runway || null,
      depActualRunway:      dep.actual_runway    || null,
      depDelay:             dep.delay            || null,
      depTerminal:          dep.terminal         || null,
      depGate:              dep.gate             || null,
      depBaggage:           dep.baggage          || null,

      arrScheduled:         arr.scheduled        || null,
      arrEstimated:         arr.estimated        || null,
      arrActual:            arr.actual           || null,
      arrEstimatedRunway:   arr.estimated_runway || null,
      arrActualRunway:      arr.actual_runway    || null,
      arrDelay:             arr.delay            || null,
      arrTerminal:          arr.terminal         || null,
      arrGate:              arr.gate             || null,
      arrBaggage:           arr.baggage          || null,

      airlineIata:          airline?.iata        || null,
    })

    console.log(`Relation: ${dep.iata} → ${arr.iata} | Flight: ${fl?.iata}`)
  }

  console.log('Done storing relationships!')
}


export async function getdatafromNeo4j() {
  console.log('Retrieving data from Neo4j...')

  const result = await driver.executeQuery(`
    MATCH (a:Airport)-[r:FLIES_TO]->(b:Airport)
    RETURN a.code AS from, b.code AS to
  `)

  const data = result.records.map(record => ({
    from: record.get('from'),
    to: record.get('to')
  }))

  console.log(`Retrieved ${data.length} records`)
  return data
}

export async function findRoute(from, to) {
  const result = await driver.executeQuery(`
    MATCH path = shortestPath(
      (a:Airport {code: $from})-[:FLIES_TO*1..10]->(b:Airport {code: $to})
    )
    RETURN 
      [n in nodes(path) | properties(n)] AS airports,
      [r in relationships(path) | properties(r)] AS flights,
      length(path) AS hops
  `, { from: from.toUpperCase(), to: to.toUpperCase() })

  if (!result.records.length) return null

    //console.log(result.records);

  const r = result.records[0]

  const airports = r.get('airports')
  const flights = r.get('flights')

    //console.log(r);

  return {
    hops: r.get('hops').toNumber(),
    stops: airports.map(a => a.code),
    airports,
    flights
  }
}

  