import { Router } from "express";
import { AppDataSource } from "../config/database.config";

const router = Router();

// Liveness: apakah proses hidup? (tidak menyentuh database)
router.get("/health", (_req, res) => {
  res.json({ status: "ok", uptime: process.uptime() });
});

// Readiness: apakah siap melayani request? (cek dependensi)
router.get("/health/ready", async (_req, res) => {
  try {
    await AppDataSource.query("SELECT 1");
    res.json({ status: "ready", database: "up" });
  } catch {
    res.status(503).json({ status: "not_ready", database: "down" });
  }
});

export default router;