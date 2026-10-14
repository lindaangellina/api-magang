import { Router } from "express";
import { pesertaController, jurnalController } from "../controllers";
import { authGuard } from "../middlewares/auth.middleware";
import { validasiUbahProfil } from "../middlewares";

const router = Router();

router.get("/", authGuard, pesertaController.getProfilSaya);
router.patch("/", authGuard, validasiUbahProfil, pesertaController.ubahProfilSaya);
router.get("/jurnal", authGuard, jurnalController.getJurnalSaya);

export default router;