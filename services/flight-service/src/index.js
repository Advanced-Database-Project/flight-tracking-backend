import express from "express";
import cors from "cors";
import env from "../../../shared/env.js";
import connectMongoDB from "../../../shared/db.js";
import flightRouter from "./routes/flightRoutes.js";

const app = express();

// middleware
app.use(express.json());
app.use(cors());

// DB connection
connectMongoDB();

// routes
app.use("/api/flights", flightRouter);

const PORT = env.FLIGHT_SERVICE_PORT || 5000;
app.listen(PORT, () => console.log(`Flight service running on port ${PORT}`));

// // Runs every 2 days at midnight
// cron.schedule("0 0 * * *", async () => {
//   await axios.post(`http://localhost:${PORT}/api/flights/fetch`);
// });