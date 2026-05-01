import express from "express";
import cors from "cors";
import { createServer } from "http";
import { Server } from "socket.io";
import env from "../../../shared/env.js";

const app = express();
app.use(cors());
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    methods: ["GET"],
  },
});

io.on("connection", (socket) => {
  console.log(`A user connected from React. Socket ID: ${socket.id}`);
});

httpServer.listen(env.FLIGHT_TRACKING_SERIVCE_PORT || 5000, () => {
  console.log(
    `Flight Tracking Service started at ${env.FLIGHT_TRACKING_SERIVCE_PORT}`,
  );
});
