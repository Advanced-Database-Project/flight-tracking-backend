import Airport from "../models/airport.js";

// CREATE
export const createAirport = async (req, res) => {
  try {
    const airport = new Airport(req.body);
    const saved = await airport.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// READ ALL
export const getAirports = async (req, res) => {
  try {
    const airports = await Airport.find({ type: "large_airport" });
    res.json(airports);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// READ ONE
export const getAirportById = async (req, res) => {
  try {
    const airport = await Airport.findById(req.params.id);
    if (!airport) {
      return res.status(404).json({ message: "Airport not found" });
    }
    res.json(airport);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// UPDATE
export const updateAirport = async (req, res) => {
  try {
    const updated = await Airport.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!updated) {
      return res.status(404).json({ message: "Airport not found" });
    }

    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// DELETE
export const deleteAirport = async (req, res) => {
  try {
    const deleted = await Airport.findByIdAndDelete(req.params.id);

    if (!deleted) {
      return res.status(404).json({ message: "Airport not found" });
    }

    res.json({ message: "Airport deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
