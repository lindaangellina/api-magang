import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { sukses, suksesDenganMeta, dibuat } from "../utils/response";
import { pesertaService, jurnalService } from "../services";
import { tanpaPassword } from "../utils/password";
import { parseListQuery, buatMeta } from "../utils/pagination";
import { SORT_PESERTA } from "../services/peserta.service";
import { ForbiddenError } from "../utils/AppError";
import { API_PREFIX } from "../config/constants";
import { ambilDto } from "../middlewares/validasi.middleware";
import { UpdateProfilDto } from "../dto/peserta.dto";

export const getSemuaPeserta = asyncHandler(async (req: Request, res: Response) => {
  const lq = parseListQuery(req.query, SORT_PESERTA);
  const sekolah = typeof req.query.sekolah === "string" ? req.query.sekolah : undefined;
  const fase = req.query.fase ? Number(req.query.fase) : undefined;

  const { data, total } = await pesertaService.daftarPeserta(lq, { sekolah, fase });
  suksesDenganMeta(res, data.map(tanpaPassword), buatMeta(lq.page, lq.limit, total), "Daftar peserta berhasil diambil");
});

export const getPesertaById = asyncHandler(async (req: Request, res: Response) => {
  const peserta = await pesertaService.getPesertaById(Number(req.params.id));
  sukses(res, tanpaPassword(peserta), "Detail peserta berhasil diambil");
});

export const buatPeserta = asyncHandler(async (req: Request, res: Response) => {
  const baru = await pesertaService.buatPeserta(req.body);
  dibuat(res, tanpaPassword(baru), "Peserta berhasil ditambahkan", `${API_PREFIX}/peserta/${baru.id}`);
});

// PATCH /peserta/:id: peserta hanya boleh mengubah dirinya sendiri, mentor boleh semua
export const ubahPeserta = asyncHandler(async (req: Request, res: Response) => {
  const targetId = Number(req.params.id);

  if (req.user!.role !== "mentor" && req.user!.id !== targetId) {
    throw new ForbiddenError("Kamu tidak berhak mengubah data peserta lain");
  }

  const data = ambilDto<UpdateProfilDto>(req); // sudah divalidasi dan bersih
  const hasil = await pesertaService.ubahProfil(targetId, data);
  sukses(res, tanpaPassword(hasil), "Peserta berhasil diubah");
});

// PATCH /me
export const ubahProfilSaya = asyncHandler(async (req: Request, res: Response) => {
  const data = ambilDto<UpdateProfilDto>(req); // sudah divalidasi dan bersih
  const hasil = await pesertaService.ubahProfil(req.user!.id, data);
  sukses(res, tanpaPassword(hasil), "Profil berhasil diubah");
});

export const hapusPeserta = asyncHandler(async (req: Request, res: Response) => {
  await pesertaService.hapusPeserta(Number(req.params.id));
  res.status(204).send();
});

export const getJurnalByPeserta = asyncHandler(async (req: Request, res: Response) => {
  const hasil = await jurnalService.getJurnalByPeserta(Number(req.params.id));
  sukses(res, hasil, "Jurnal milik peserta berhasil diambil");
});

export const getProfilSaya = asyncHandler(async (req: Request, res: Response) => {
  const peserta = await pesertaService.getPesertaById(req.user!.id);
  sukses(res, tanpaPassword(peserta), "Profil berhasil diambil");
});