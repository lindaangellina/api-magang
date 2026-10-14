import { Router } from "express";
import { pesertaController } from "../controllers";
import { validasiPeserta } from "../middlewares";
import { validasi } from "../middlewares/validasi.middleware";
import { authGuard } from "../middlewares/auth.middleware";
import { requireRole } from "../middlewares/role.middleware";
import { UpdateProfilDto } from "../dto/peserta.dto";

const router = Router();

router.get("/", pesertaController.getSemuaPeserta);
router.get("/:id", pesertaController.getPesertaById);
router.post("/", validasiPeserta, pesertaController.buatPeserta);
router.patch("/:id", authGuard, validasi(UpdateProfilDto), pesertaController.ubahPeserta);
router.delete("/:id", authGuard, requireRole("mentor"), pesertaController.hapusPeserta);
router.get("/:id/jurnal", pesertaController.getJurnalByPeserta);

export default router;