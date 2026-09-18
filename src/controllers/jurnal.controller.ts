import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { sukses, suksesDenganTotal, dibuat } from "../utils/response";
import { jurnalService } from "../services";

export const getSemuaJurnal = asyncHandler(async (req: Request, res: Response) => {
  const { peserta, status } = req.query as { peserta?: string; status?: string };
  const hasil = jurnalService.getSemuaJurnal({ peserta, status });
  suksesDenganTotal(res, hasil, "Daftar jurnal berhasil diambil");
});

export const getJurnalById = asyncHandler(async (req: Request, res: Response) => {
  const jurnal = jurnalService.getJurnalById(Number(req.params.id));
  sukses(res, jurnal, "Detail jurnal berhasil diambil");
});

export const buatJurnal = asyncHandler(async (req: Request, res: Response) => {
  const baru = jurnalService.buatJurnal(req.body);
  dibuat(res, baru, "Jurnal berhasil ditambahkan");
});

export const updateJurnal = asyncHandler(async (req: Request, res: Response) => {
  const hasil = jurnalService.updateJurnal(Number(req.params.id), req.body);
  sukses(res, hasil, "Jurnal berhasil diupdate");
});

export const updateStatusReview = asyncHandler(async (req: Request, res: Response) => {
  const direview = req.body.direview ?? true;
  const hasil = jurnalService.updateStatusReview(Number(req.params.id), direview);
  sukses(res, hasil, "Status review berhasil diperbarui");
});

export const hapusJurnal = asyncHandler(async (req: Request, res: Response) => {
  jurnalService.hapusJurnal(Number(req.params.id));
  res.status(204).send();
});