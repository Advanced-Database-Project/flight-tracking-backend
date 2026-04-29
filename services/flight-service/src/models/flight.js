import mongoose from "mongoose";

const FlightSchema = new mongoose.Schema(
  {
    flight_date: String,
    flight_status: String,

    departure: {
      airport: String,
      timezone: String,
      iata: String,
      icao: String,
      terminal: String,
      gate: String,
      delay: Number,
      scheduled: String,
      estimated: String,
      actual: String,
      estimated_runway: String,
      actual_runway: String,
      baggage: String,
    },

    arrival: {
      airport: String,
      timezone: String,
      iata: String,
      icao: String,
      terminal: String,
      gate: String,
      delay: Number,
      scheduled: String,
      estimated: String,
      actual: String,
      estimated_runway: String,
      actual_runway: String,
      baggage: String,
    },

    airline: {
      id: String,
      fleet_average_age: Number,
      airline_id: String,
      callsign: String,
      hub_code: String,
      iata_code: String,
      icao_code: String,
      country_iso2: String,
      date_founded: String,
      iata_prefix_accounting: String,
      airline_name: String,
      country_name: String,
      fleet_size: Number,
      status: String,
      type: String,
    },

    flight: {
      number: String,
      iata: String,
      icao: String,
      codeshared: mongoose.Schema.Types.Mixed,
    },

    airline: mongoose.Schema.Types.Mixed,

    live: {
      updated: String,
      latitude: Number,
      longitude: Number,
      altitude: Number,
      direction: Number,
      speed_horizontal: Number,
      speed_vertical: Number,
      is_ground: Boolean,
    },

    fetchedAt: { type: Date, default: Date.now },
  },
  {
    collection: "flights",
    strict: false,
  },
);

const Flight = mongoose.model("Flight", FlightSchema);
export default Flight;
