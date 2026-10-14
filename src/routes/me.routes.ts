import { Router } from "express";
import { pesertaController, jurnalController } from "../controllers";
import { authGuard } from "../middlewares/auth.middleware";
import { validasi } from "../middlewares/validasi.middleware";
import { UpdateProfilDto } from "../dto/peserta.dto";

const router = Router();

router.get("/", authGuard, pesertaController.getProfilSaya);
router.patch("/", authGuard, validasi(UpdateProfilDto), pesertaController.ubahProfilSaya);
router.get("/jurnal", authGuard, jurnalController.getJurnalSaya);

export default router;