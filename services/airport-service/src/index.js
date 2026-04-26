
import env from "../../../shared/env.js";
import express from "express";
import connectMongoDB from "../../../shared/db.js";
import airportRouter from "./routes/airportRoutes.js";

const app = express();

// middleware
app.use(express.json());

// DB connection
connectMongoDB();

// routes
app.use("/api/airports", airportRouter);

// server
const PORT = env.AIRPORT_SERVICE_PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
