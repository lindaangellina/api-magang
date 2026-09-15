import { Router } from "express";
import * as pesertaController from "../controllers/peserta.controller";
import * as jurnalController from "../controllers/jurnal.controller";

const router = Router();

router.get("/", pesertaController.getSemuaPeserta);
router.get("/:id", pesertaController.getPesertaById);
router.post("/", pesertaController.buatPeserta);
router.put("/:id", pesertaController.updatePeserta);
router.delete("/:id", pesertaController.hapusPeserta);

// Nested route — jurnal milik peserta tertentu
router.get("/:id/jurnal", jurnalController.getJurnalByPeserta);

export default router;