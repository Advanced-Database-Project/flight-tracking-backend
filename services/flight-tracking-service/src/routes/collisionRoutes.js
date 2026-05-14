import { Router } from "express";
import {
  detectCollisions,
  getConeConfig,
  setConeConfig,
} from "../collisionDetector.js";

const router = Router();

// GET /api/collisions/cone — read current cone settings
router.get("/cone", async (req, res) => {
  const cone = await getConeConfig();
  res.json(cone);
});

// POST /api/collisions/cone — change cone settings
// Body: { "lengthKm": 80, "halfAngleDeg": 30 }
router.post("/cone", async (req, res) => {
  const cone = await setConeConfig(req.body || {});
  res.json({ updated: true, cone });
});

// GET /api/collisions/current — run detection right now and return alerts
router.get("/current", async (req, res) => {
  const payload = await detectCollisions();
  res.json({ ts: Math.floor(Date.now() / 1000), ...payload });
});

export default router;