import { Router } from "express";
import { jurnalController } from "../controllers";
import { validasiJurnal } from "../middlewares";
import { validasi } from "../middlewares/validasi.middleware";
import { authGuard } from "../middlewares/auth.middleware";
import { requireRole } from "../middlewares/role.middleware";
import { IdParamDto } from "../dto/common.dto";
import { ListJurnalQueryDto } from "../dto/jurnal.dto";

const router = Router();

router.get(
  "/",
  authGuard,
  requireRole("mentor"),
  validasi(ListJurnalQueryDto, "query"),
  jurnalController.getSemuaJurnal
);
router.get("/:id", validasi(IdParamDto, "params"), jurnalController.getJurnalById);
router.post("/", authGuard, validasiJurnal, jurnalController.buatJurnal);
router.put(
  "/:id",
  authGuard,
  validasi(IdParamDto, "params"),
  validasiJurnal,
  jurnalController.updateJurnal
);
router.patch(
  "/:id/review",
  authGuard,
  requireRole("mentor"),
  validasi(IdParamDto, "params"),
  jurnalController.updateStatusReview
);
router.delete("/:id", authGuard, validasi(IdParamDto, "params"), jurnalController.hapusJurnal);

export default router;