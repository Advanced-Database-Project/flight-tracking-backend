
import express from 'express'
import {createWebSocketConnection} from '../controller/flightTrackingController.js'

const flightTrackingRouter = express.Router();

flightTrackingRouter.get("/", createWebSocketConnection);

export default flightTrackingRouter;