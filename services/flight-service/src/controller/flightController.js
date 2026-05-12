import Flight from "../models/flight.js";
import axios from "axios";
import env from "../../../../shared/env.js";

const AVIATIONSTACK_KEY = env.AVIATIONSTACK_KEY;
const AVIATIONSTACK_URL = "http://api.aviationstack.com/v1/flights";

// Fetch from Aviationstack
export const fetchAndStoreFlights = async (req, res) => {
  try {
    let flights = [];

    for (let i = 0; i < 5; i++) {
      const params = {
        access_key: AVIATIONSTACK_KEY,
        limit: 100,
        offset: i * 100,
      };

      const { data } = await axios.get(AVIATIONSTACK_URL, { params });
      flights.push(...data.data);
    }

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
    const flights = await Flight.find();
    if (!flights)
      return res
        .status(404)
        .json({ status: 404, message: "Not found", entry: { data: [] } });

    res.json({
      status: 200,
      mesage: "Flight records found",
      entry: { data: [flights] },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Read one stored flight using iata and date
export const getFlightById = async (req, res) => {
  try {
    const { iata, date } = req.query;
    const flight = await Flight.findOne({
      "flight.iata": iata,
      flight_date: date,
    });
    if (!flight)
      return res
        .status(404)
        .json({ status: 404, message: "Not found", entry: { data: [] } });
    res.json({
      status: 200,
      mesage: "Flight record found",
      entry: { data: [flight] },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
