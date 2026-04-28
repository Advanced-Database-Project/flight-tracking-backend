import express from "express";
import { fetchAndStoreFlights, getFlights, getFlightById } from "../controller/flightController.js";

const flightRouter = express.Router();

flightRouter.post("/fetch", fetchAndStoreFlights);  
flightRouter.get("/", getFlights);                 
flightRouter.get("/:id", getFlightById);            

export default flightRouter;