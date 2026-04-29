import Redis from "ioredis";
import env from "../../../shared/env.js";

// create redis client
const redisClient = new Redis(env.REDIS_URL || "redis://localhost:6379");

// create a duplicate client for Pub/Sub
const subscriberClient = redisClient.duplicate();


redisClient.on("error", (err) => console.error("Redis Client Error:", err));
subscriberClient.on("error", (err) =>
  console.error("Redis Subscriber Error:", err),
);

// export a function to initialize the subscriptions, passing in the Socket.io instance
const initializeRedisSubscriptions = (io) => {
  const channelName = "live-flight-updates";

  subscriberClient.subscribe(channelName, (err, count) => {
    if (err) {
      console.error("Failed to subscribe to Redis channel:", err);
      return;
    }
    console.log(
      `Subscribed successfully! Listening to ${count} Redis channel(s).`,
    );
  });

  subscriberClient.on("message", (channel, message) => {
    if (channel === channelName) {
      try {
        const flightData = JSON.parse(message);

        io.emit("flight-data", flightData);
      } catch (error) {
        console.error("Error parsing Redis message:", error);
      }
    }
  });
};

const storeObjectRedis = async (flights) => {
  // const user = {
  //   id: "1",
  //   name: "John",
  //   age: 25,
  //   city: "Karlsruhe",
  // };

  redisClient.setex("icao1", 60, JSON.stringify(flights));
  console.log("data stored with key icao", flights.length);
  // await redisClient.del("user1");

  const data = await redisClient.getex("icao1");
  
  console.log('=== final', JSON.parse(data.slice(0,1000)));
};

export { initializeRedisSubscriptions, redisClient, storeObjectRedis };
