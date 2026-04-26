
import express from 'express'
import {createAirport, getAirportById, getAirports, updateAirport, deleteAirport} from '../controller/airportController.js'

const airportRouter = express.Router();

airportRouter.post("/", createAirport);
airportRouter.get("/", getAirports);
airportRouter.get("/:id", getAirportById);
airportRouter.put("/:id", updateAirport);
airportRouter.delete("/:id", deleteAirport);

export default airportRouter;