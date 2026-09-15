import { Router } from "express";
import pesertaRoutes from "./peserta.routes";
import jurnalRoutes from "./jurnal.routes";

const router = Router();

router.use("/peserta", pesertaRoutes);
router.use("/jurnal", jurnalRoutes);

export default router;