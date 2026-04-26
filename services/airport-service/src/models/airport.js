// models/airport.js
import mongoose from "mongoose";

const AirportSchema = new mongoose.Schema(
  {
    continent: String,
    elevation_ft: Number,
    gps_code: String,
    home_link: String,
    iata_code: String,
    icao_code: String,

    id: Number,
    ident: String,

    iso_country: String,
    iso_region: String,

    keywords: String,

    latitude_deg: mongoose.Schema.Types.Mixed,
    longitude_deg: mongoose.Schema.Types.Mixed,

    local_code: mongoose.Schema.Types.Mixed,

    municipality: String,
    name: String,

    scheduled_service: String,
    type: String,

    wikipedia_link: String,
  },
  {
    collection: "airports", 
    strict: false,         
  }
);

const Airport = mongoose.model("Airport", AirportSchema);

export default Airport;