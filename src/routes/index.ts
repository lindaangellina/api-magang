import { Router } from "express";
import pesertaRoutes from "./peserta.routes";
import jurnalRoutes from "./jurnal.routes";
import statsRoutes from "./stats.routes";
import authRoutes from "./auth.routes";

const router = Router();

router.use("/peserta", pesertaRoutes);
router.use("/jurnal", jurnalRoutes);
router.use("/stats", statsRoutes);
router.use("/auth", authRoutes);

export default router;