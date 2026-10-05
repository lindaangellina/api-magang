import { Router } from "express";
import { pesertaController } from "../controllers";
import { validasiPeserta } from "../middlewares";
import { authGuard } from "../middlewares/auth.middleware";
import { requireRole } from "../middlewares/role.middleware";

const router = Router();

router.get("/", pesertaController.getSemuaPeserta);
router.get("/:id", pesertaController.getPesertaById);
router.post("/", validasiPeserta, pesertaController.buatPeserta);
router.put("/:id", authGuard, validasiPeserta, pesertaController.updatePeserta);
router.delete("/:id", authGuard, requireRole("mentor"), pesertaController.hapusPeserta);
router.get("/:id/jurnal", pesertaController.getJurnalByPeserta);

export default router;