import env from "../../../shared/env.js";
import { createClient } from "redis";

const redisClient = createClient();
redisClient.connect();

const subscriberClient = createClient();
subscriberClient.connect();

redisClient.on("error", (err) => console.error("Redis Client Error:", err));
subscriberClient.on("error", (err) =>
  console.error("Redis Subscriber Error:", err),
);

// export a function to initialize the subscriptions, passing in the Socket.io instance
const initializeRedisSubscriptions = (io) => {
  const channelName = "live-flight-tracking";

  subscriberClient.subscribe(channelName, (message, channel) => {
    try {
      const flightData = JSON.parse(message);
      io.emit("live-flight-tracking", flightData);
      console.log(
        `📡 Emitting live flight data to React frontend from ${channel}`,
      );
    } catch (error) {
      console.error("Error parsing Redis message:", error);
    }
  });
  // NEW: forward collision alerts to all connected socket clients
  subscriberClient.subscribe("collision-alerts", (message) => {
    try {
      const payload = JSON.parse(message);
      io.emit("collision-alerts", payload);
      console.log(
        `⚠️  Emitted ${payload.alerts.length} collision alert(s) to clients`,
      );
    } catch (error) {
      console.error("Error parsing collision message:", error);
    }
  });
};

export { initializeRedisSubscriptions, redisClient, subscriberClient };
