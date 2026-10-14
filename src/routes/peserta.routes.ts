import { Router } from "express";
import { pesertaController } from "../controllers";
import { validasiPeserta, validasiUbahProfil } from "../middlewares";
import { authGuard } from "../middlewares/auth.middleware";
import { requireRole } from "../middlewares/role.middleware";

const router = Router();

router.get("/", pesertaController.getSemuaPeserta);
router.get("/:id", pesertaController.getPesertaById);
router.post("/", validasiPeserta, pesertaController.buatPeserta);
router.patch("/:id", authGuard, validasiUbahProfil, pesertaController.ubahPeserta);
router.delete("/:id", authGuard, requireRole("mentor"), pesertaController.hapusPeserta);
router.get("/:id/jurnal", pesertaController.getJurnalByPeserta);

export default router;