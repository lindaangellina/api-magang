import { Router } from "express";
import * as pesertaController from "../controllers/peserta.controller";
import * as jurnalController from "../controllers/jurnal.controller";
import { validasiPeserta } from "../middlewares/validasi.middleware";

const router = Router();

router.get("/", pesertaController.getSemuaPeserta);
router.get("/:id", pesertaController.getPesertaById);
router.post("/", validasiPeserta, pesertaController.buatPeserta);
router.put("/:id", validasiPeserta, pesertaController.updatePeserta);
router.delete("/:id", pesertaController.hapusPeserta);

router.get("/:id/jurnal", jurnalController.getJurnalByPeserta);

export default router;