import Flight from "../models/flight.js";
import axios from "axios";
import env from "../../../../shared/env.js";

const AVIATIONSTACK_KEY = env.AVIATIONSTACK_KEY;
const AVIATIONSTACK_URL = "http://api.aviationstack.com/v1/flights";

// Fetch from Aviationstack
export const fetchAndStoreFlights = async (req, res) => {
  try {
    const params = {
      access_key: AVIATIONSTACK_KEY,
      ...req.query,
    };

    const { data } = await axios.get(AVIATIONSTACK_URL, { params });
    const flights = data.data;

    await Flight.deleteMany({});

    const result = await Flight.insertMany(flights);

    res.status(200).json({
      message: "Flights replaced successfully",
      inserted: result.length,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Read all stored flights
export const getFlights = async (req, res) => {
  try {
    const flights = await Flight.find(req.query);
    res.json(flights);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Read one stored flight by Mongo_id
export const getFlightById = async (req, res) => {
  try {
    const flight = await Flight.findById(req.params.id);
    if (!flight) return res.status(404).json({ message: "Flight not found" });
    res.json(flight);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};