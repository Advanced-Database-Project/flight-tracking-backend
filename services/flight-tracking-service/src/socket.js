import { Server } from "socket.io";
import { redisClient } from "./redis.js";
import { getHistoricalDataFromMongo, getLiveData } from "./dataIngestion.js";
import { startFlightTrackingPublisher } from "./flightTrackingPublisher.js";
import { handleViewportTracking } from "./ViewportTracker.js";
import { startCollisionDetector } from "./collisionDetector.js";

const PUB_CHANNEL = "live-flight-tracking";

let minLat = 48.725397018130344;
let maxLat = 50.22436656050065;
let minLng = 6.498413084540498;
let maxLng = 10.4534912095405;

export const initializeSocket = (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: "*", 
      methods: ["GET"],
    },
  });

  setInterval(async () => {
    await getLiveData();
    // startCollisionDetector();
    const collisionPayload = await startCollisionDetector();

    io.sockets.sockets.forEach((socket) => {
      handleViewportTracking(socket, collisionPayload);
    });

  }, 15000);


  io.on("connection", async (socket) => {
    console.log(`A user connected from React. Socket ID: ${socket.id}`);

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

    socket.on("live-flight-updates", (bounds) => {
      console.log("live-flight-updates EVENT CAME BROOOO", bounds);
      socket.currentViewport = bounds;
      minLat = bounds.minLat;
      maxLat = bounds.maxLat;
      minLng = bounds.minLng;
      maxLng = bounds.maxLng;
      console.log("current bouding box: ", minLat, minLng, maxLat, maxLng);
    });

    // setInterval(async (params) => {
    //   await getLiveData();
    //   handleViewportTracking(socket);
    //   startCollisionDetector();
    // },1500)

    // await getLiveData();

    // handleViewportTracking(socket);

    socket.on("disconnect", () => {
      console.log(`User disconnected. Socket ID: ${socket.id}`);
      // clearInterval(trackerInterval);
    });
  });

  return io;
};
