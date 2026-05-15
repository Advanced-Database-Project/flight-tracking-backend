//

import { Server } from "socket.io";
// env
import env from "../../../../shared/env.js";
import { getArrivalDepartureByAirport } from "../controller/arrivalDepartureByAirport.js";

// ----------------------------------------

export const liveDashboardRouter = (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET"],
    },
  });

  io.on("connection", async (socket) => {
    console.log(`📢 A user connected from React. Socket ID: ${socket.id}`);

    socket.on(env.AIRPORT_LIVE_DASHBOARD_CHANNEL_INIT, async (data) => {
      console.log({ data });

      console.log(
        "📢 Received request for initial data. Fetching from api ...",
      );

      const executeIntervalFunc = async (data) => {
        const response = await getArrivalDepartureByAirport(data);

        console.log("📢 Sent initial data to client ...");

        socket.emit(
          env.AIRPORT_LIVE_DASHBOARD_CHANNEL,
          JSON.stringify({
            arr: response[0]?.data?.data,
            dep: response[1]?.data?.data,
          }),
        );
      };

      setInterval(() => executeIntervalFunc(data), 60000);
      executeIntervalFunc(data);
    });

    socket.on("disconnect", () => {
      console.log(`User disconnected. Socket ID: ${socket.id}`);
    });
  });

  return io;
};
