import { Router } from "express";
import { jurnalController } from "../controllers";
import { validasiJurnal } from "../middlewares";
import { authGuard } from "../middlewares/auth.middleware";
import { requireRole } from "../middlewares/role.middleware";

const router = Router();

// peserta & mentor (siapapun login) boleh lihat jurnal miliknya sendiri
router.get("/saya", authGuard, jurnalController.getJurnalSaya);

// HANYA mentor boleh lihat SEMUA jurnal
router.get("/", authGuard, requireRole("mentor"), jurnalController.getSemuaJurnal);

router.get("/:id", jurnalController.getJurnalById);

// peserta & mentor (siapapun login) boleh buat jurnal
router.post("/", authGuard, validasiJurnal, jurnalController.buatJurnal);

// peserta hanya bisa edit jurnal miliknya sendiri; mentor bisa edit semua (dicek di service, Soal 3)
router.put("/:id", authGuard, validasiJurnal, jurnalController.updateJurnal);

// HANYA mentor boleh review jurnal
router.patch("/:id/review", authGuard, requireRole("mentor"), jurnalController.updateStatusReview);

router.delete("/:id", jurnalController.hapusJurnal);

export default router;