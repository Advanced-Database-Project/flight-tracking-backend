import { Server } from "socket.io";
import { redisClient } from "./redis.js";

export const initializeSocket = (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: "*", // Secure this in production
      methods: ["GET"],
    },
  });

  io.on("connection", (socket) => {
    console.log(`A user connected from React. Socket ID: ${socket.id}`);

    socket.on("request-initial-state", async () => {
      try {
        const currentFlights = await redisClient.get("current-state-vectors");
        if (currentFlights) {
          socket.emit("initial-flight-data", JSON.parse(currentFlights));
        }
      } catch (err) {
        console.error("Failed to fetch initial state:", err);
      }
    });

    socket.on("disconnect", () => {
      console.log(`User disconnected. Socket ID: ${socket.id}`);
    });
  });

  return io; 
};