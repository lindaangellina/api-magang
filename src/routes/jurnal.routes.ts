import { Router } from "express";
import { jurnalController } from "../controllers";
import { validasiJurnal } from "../middlewares";
import { authGuard } from "../middlewares/auth.middleware";

const router = Router();

router.get("/", authGuard, jurnalController.getSemuaJurnal);
router.get("/saya", authGuard, jurnalController.getJurnalSaya);
router.get("/:id", jurnalController.getJurnalById);
router.post("/", validasiJurnal, jurnalController.buatJurnal);
router.put("/:id", validasiJurnal, jurnalController.updateJurnal);
router.patch("/:id/review", jurnalController.updateStatusReview);
router.delete("/:id", jurnalController.hapusJurnal);

export default router;