import { Router } from "express";
import { jurnalController } from "../controllers";
import { validasiJurnal } from "../middlewares";
import { authGuard } from "../middlewares/auth.middleware";
import { requireRole } from "../middlewares/role.middleware";

const router = Router();

router.get("/", authGuard, requireRole("mentor"), jurnalController.getSemuaJurnal);
router.get("/:id", jurnalController.getJurnalById);
router.post("/", authGuard, validasiJurnal, jurnalController.buatJurnal);
router.put("/:id", authGuard, validasiJurnal, jurnalController.updateJurnal);
router.patch("/:id/review", authGuard, requireRole("mentor"), jurnalController.updateStatusReview);
router.delete("/:id", authGuard, jurnalController.hapusJurnal);

export default router;