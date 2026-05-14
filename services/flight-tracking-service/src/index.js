import env from "../../../shared/env.js";
import express from "express";
import cors from "cors";
import { createServer } from "http";
import { initializeSocket } from "./socket.js";
import { initializeRedisSubscriptions } from "./redis.js";
import { connectOpenskyMongoDB } from "../../../shared/db.js";
// import { startFlightTrackingPublisher } from "./flightTrackingPublisher.js";
import { getHistoricalDataFromMongo } from "./dataIngestion.js";
import { startCollisionDetector } from "./collisionDetector.js";
import collisionRoutes from "./routes/collisionRoutes.js";
import { handleViewportTracking } from "./ViewportTracker.js";


const app = express();
app.use(cors());
app.use(express.json());
app.use("/api/collisions", collisionRoutes);

const httpServer = createServer(app);


// 1. Initialize Socket.io and get the 'io' instance
const io = initializeSocket(httpServer);

// 2. Initialize Redis Pub/Sub, passing the 'io' instance so it can broadcast updates
initializeRedisSubscriptions(io);
// handleViewportTracking(io)

// 3. Start the collision-detection loop (runs every 3 seconds)
// startCollisionDetector();

const PORT = env.FLIGHT_TRACKING_SERIVCE_PORT || 5000;

httpServer.listen(PORT, () => {
  console.log(`Flight Tracking Service started at port ${PORT}`);
});