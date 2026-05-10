import { Server } from "socket.io";
import { redisClient } from "./redis.js";
import { getHistoricalDataFromMongo, getLiveData } from "./dataIngestion.js";
import { startFlightTrackingPublisher } from "./flightTrackingPublisher.js";

const PUB_CHANNEL = "live-flight-tracking";

export const initializeSocket = (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: "*", // Secure this in production
      methods: ["GET"],
    },
  });

  io.on("connection", async (socket) => {
    console.log(`A user connected from React. Socket ID: ${socket.id}`);
    // await getHistoricalDataFromMongo();
    await getLiveData();

    startFlightTrackingPublisher();

    socket.on("request-initial-state", async () => {
      try {
        const activeIcaoIDs = await redisClient.zRange(
          "flight_timestamps",
          0,
          -1,
        );
        if (activeIcaoIDs.length > 0) {
          const keysToFetch = activeIcaoIDs.map((id) => `flight:${id}`);

          const rawFlightData = await redisClient.mGet(keysToFetch);

          const currentFlights = rawFlightData
            .filter((data) => data !== null)
            .map((data) => JSON.parse(data));

          await redisClient.publish(
            PUB_CHANNEL,
            JSON.stringify(currentFlights),
          );
          socket.emit(PUB_CHANNEL, JSON.stringify(currentFlights));
          console.log(`📡 Broadcasted ${currentFlights.length} live flights`);
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
