import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { sukses, suksesDenganMeta, dibuat } from "../utils/response";
import { pesertaService, jurnalService } from "../services";
import { tanpaPassword } from "../utils/password";
import { parseListQuery, buatMeta } from "../utils/pagination";
import { SORT_PESERTA } from "../services/peserta.service";

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
  dibuat(res, tanpaPassword(baru), "Peserta berhasil ditambahkan");
});

export const updatePeserta = asyncHandler(async (req: Request, res: Response) => {
  const hasil = await pesertaService.updatePeserta(Number(req.params.id), req.body);
  sukses(res, tanpaPassword(hasil), "Peserta berhasil diupdate");
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
  const userId = req.user!.id;
  const peserta = await pesertaService.getPesertaById(userId);
  sukses(res, tanpaPassword(peserta), "Profil berhasil diambil");
});