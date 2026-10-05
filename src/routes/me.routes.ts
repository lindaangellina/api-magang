import { Router } from "express";
import { pesertaController, jurnalController } from "../controllers";
import { authGuard } from "../middlewares/auth.middleware";

const router = Router();

router.get("/", authGuard, pesertaController.getProfilSaya);
router.get("/jurnal", authGuard, jurnalController.getJurnalSaya);

export default router;