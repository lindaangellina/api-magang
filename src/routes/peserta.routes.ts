import { Router } from "express";
import { pesertaController } from "../controllers";
import { validasiPeserta } from "../middlewares";

const router = Router();

router.get("/", pesertaController.getSemuaPeserta);
router.get("/:id", pesertaController.getPesertaById);
router.post("/", validasiPeserta, pesertaController.buatPeserta);
router.put("/:id", validasiPeserta, pesertaController.updatePeserta);
router.delete("/:id", pesertaController.hapusPeserta);
router.get("/:id/jurnal", pesertaController.getJurnalByPeserta);

export default router;