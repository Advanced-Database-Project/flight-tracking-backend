import express from "express";
import cors from "cors";
import { createServer } from "http";
import env from "../../../shared/env.js";

import { initializeSocket } from "./socket.js";
import { initializeRedisSubscriptions } from "./redis.js";

import "./cron.js"

const app = express();
app.use(cors());

const httpServer = createServer(app);

// 1. Initialize Socket.io and get the 'io' instance
const io = initializeSocket(httpServer);

// 2. Initialize Redis Pub/Sub, passing the 'io' instance so it can broadcast updates
initializeRedisSubscriptions(io);

const PORT = env.FLIGHT_TRACKING_SERIVCE_PORT || 5000;


httpServer.listen(PORT, () => {
  console.log(`Flight Tracking Service started at port ${PORT}`);
});
