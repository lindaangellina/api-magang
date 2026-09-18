import { Router } from "express";
import { jurnalController } from "../controllers";
import { validasiJurnal } from "../middlewares";

const router = Router();

router.get("/", jurnalController.getSemuaJurnal);
router.get("/:id", jurnalController.getJurnalById);
router.post("/", validasiJurnal, jurnalController.buatJurnal);
router.put("/:id", validasiJurnal, jurnalController.updateJurnal);
router.patch("/:id/review", jurnalController.updateStatusReview);
router.delete("/:id", jurnalController.hapusJurnal);

export default router;