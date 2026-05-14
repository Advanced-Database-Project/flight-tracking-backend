import { redisClient } from "./redis.js";

// let

// Calculates distance between two coordinates in kilometers
const getRadiusInKm = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

export const handleViewportTracking = async (socket, collisionPayload) => {
  // const trackerInterval = setInterval(async () => {
    try {
      // If they haven't moved the map yet, do nothing
      if (!socket) {
        console.log("didi current viewport nahi hai bhai");
        return;
      }

      const {
        minLat = 48.725397018130344,
        maxLat = 50.22436656050065,
        minLng = 6.498413084540498,
        maxLng = 10.4534912095405,
      } = socket.currentViewport || {};

      // Calculate the exact center of their screen
      const centerLat = (minLat + maxLat) / 2;
      const centerLng = (minLng + maxLng) / 2;

      // Calculate the radius from the center to the top-right corner
      const radiusKm = getRadiusInKm(centerLat, centerLng, maxLat, maxLng);

      console.log(
        "center latitude: ",
        centerLat,
        " center longitude: ",
        centerLng,
        " redius in km: ",
        radiusKm,
      );

      // 3. Let Redis do the heavy lifting: Find planes ONLY in this circle
      const activeIcaoIDs = await redisClient.geoSearch(
        "flight_locations", // Your GEO index name
        { longitude: centerLng, latitude: centerLat },
        { radius: radiusKm, unit: "km" },
      );

      if (activeIcaoIDs.length > 0) {
        // Map the IDs to your JSON keys
        const keysToFetch = activeIcaoIDs.map((id) => `flight:${id}`);

        // Fetch the rich JSON payloads for only the planes on screen
        const rawFlightData = await redisClient.mGet(keysToFetch);

        const currentFlights = rawFlightData
          .filter((data) => data !== null)
          .map((data) => JSON.parse(data));

        // 4. Emit ONLY to this specific user, not a global broadcast!
        // socket.emit("live-flight-tracking", currentFlights);
        await redisClient.publish("live-flight-tracking",  JSON.stringify({
        currentFlights,
        ...collisionPayload,
      }));

        console.log(
          `📡 Sent ${currentFlights.length} live flights to Socket ${socket.id}`,
        );
      }
    } catch (error) {
      console.error("Viewport fetch failed:", error);
    }
  // }, 15000); 

  // Clean up the memory leak when the user closes the React app
  // socket.on("disconnect", () => {

  // });
};
