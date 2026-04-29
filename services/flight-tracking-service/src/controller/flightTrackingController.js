


export const transformFlight = (flight) => {
  return {
    icao24: flight[0],
    callsign: flight[1]?.trim(),
    country: flight[2],
    longitude: flight[5],
    latitude: flight[6],
    altitude: flight[7],
    velocity: flight[9],
  };
};