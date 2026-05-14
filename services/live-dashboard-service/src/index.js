//

import express from "express";
import cors from "cors";
import { createServer } from "http";

import env from "../../../shared/env.js";
import { liveDashboardRouter } from "./routes/liveDashboardRouter.js";

// ----------------------------------------

const app = express();

// middleware
app.use(express.json());
app.use(cors());

const httpServer = createServer(app);

// routes
liveDashboardRouter(httpServer);

// server
const PORT = env.LIVE_DASHBOARD_SERVICE_PORT || 5006;
httpServer.listen(PORT, () => console.log(`Server running on port ${PORT}`));
