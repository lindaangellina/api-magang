import { Router } from "express";
import { pesertaController } from "../controllers";
import { validasiPeserta } from "../middlewares";
import { authGuard } from "../middlewares/auth.middleware";

const router = Router();

router.get("/", pesertaController.getSemuaPeserta);
router.get("/profil-saya", authGuard, pesertaController.getProfilSaya);
router.get("/:id", pesertaController.getPesertaById);
router.post("/", validasiPeserta, pesertaController.buatPeserta);
router.put("/:id", authGuard, validasiPeserta, pesertaController.updatePeserta);
router.delete("/:id", authGuard, pesertaController.hapusPeserta);
router.get("/:id/jurnal", pesertaController.getJurnalByPeserta);

export default router;