import mongoose from "mongoose";

const LiveFlightTrackingSchema = new mongoose.Schema(
  {
    time: {
      type: Number,
      required: true,
    },

    icao24: {
      type: String,
      required: true,
      trim: true,
    },

    lat: {
      type: Number,
    },

    lon: {
      type: Number,
    },

    velocity: {
      type: Number,
    },

    heading: {
      type: Number,
    },

    vertrate: {
      type: Number,
    },

    onground: {
      type: String,
    },

    baroaltitude: {
      type: Number,
    },

    geoaltitude: {
      type: Number,
    },
  },
  {
    collection: "live_flight_tracking",
    strict: false,
  },
);

const LiveFlightTracking = mongoose.model(
  "LiveFlightTracking",
  LiveFlightTrackingSchema,
);

export default LiveFlightTracking;
