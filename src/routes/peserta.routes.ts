import { Router } from "express";
import { pesertaController } from "../controllers";
import { validasi } from "../middlewares/validasi.middleware";
import { authGuard } from "../middlewares/auth.middleware";
import { requireRole } from "../middlewares/role.middleware";
import { IdParamDto } from "../dto/common.dto";
import { CreatePesertaDto, ListPesertaQueryDto, UpdateProfilDto } from "../dto/peserta.dto";

const router = Router();

router.get("/", validasi(ListPesertaQueryDto, "query"), pesertaController.getSemuaPeserta);
router.get("/:id", validasi(IdParamDto, "params"), pesertaController.getPesertaById);
router.post("/", validasi(CreatePesertaDto), pesertaController.buatPeserta);
router.patch(
  "/:id",
  authGuard,
  validasi(IdParamDto, "params"),
  validasi(UpdateProfilDto),
  pesertaController.ubahPeserta
);
router.delete(
  "/:id",
  authGuard,
  requireRole("mentor"),
  validasi(IdParamDto, "params"),
  pesertaController.hapusPeserta
);
router.get("/:id/jurnal", validasi(IdParamDto, "params"), pesertaController.getJurnalByPeserta);

export default router;