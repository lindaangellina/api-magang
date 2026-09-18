import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { sukses, suksesDenganTotal, dibuat } from "../utils/response";
import { pesertaService, jurnalService } from "../services";

export const getSemuaPeserta = asyncHandler(async (req: Request, res: Response) => {
  const { sekolah, fase, limit } = req.query as { sekolah?: string; fase?: string; limit?: string };
  const hasil = pesertaService.getSemuaPeserta({ sekolah, fase, limit });
  suksesDenganTotal(res, hasil, "Daftar peserta berhasil diambil");
});

export const getPesertaById = asyncHandler(async (req: Request, res: Response) => {
  const peserta = pesertaService.getPesertaById(Number(req.params.id));
  sukses(res, peserta, "Detail peserta berhasil diambil");
});

export const buatPeserta = asyncHandler(async (req: Request, res: Response) => {
  const baru = pesertaService.buatPeserta(req.body);
  dibuat(res, baru, "Peserta berhasil ditambahkan");
});

export const updatePeserta = asyncHandler(async (req: Request, res: Response) => {
  const hasil = pesertaService.updatePeserta(Number(req.params.id), req.body);
  sukses(res, hasil, "Peserta berhasil diupdate");
});

export const hapusPeserta = asyncHandler(async (req: Request, res: Response) => {
  pesertaService.hapusPeserta(Number(req.params.id));
  res.status(204).send();
});

export const getJurnalByPeserta = asyncHandler(async (req: Request, res: Response) => {
  const hasil = jurnalService.getJurnalByPeserta(Number(req.params.id));
  sukses(res, hasil, "Jurnal milik peserta berhasil diambil");
});