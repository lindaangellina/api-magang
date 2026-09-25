import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { sukses, suksesDenganTotal, dibuat } from "../utils/response";
import { jurnalService } from "../services";

export const getSemuaJurnal = asyncHandler(async (req: Request, res: Response) => {
  const { peserta, status } = req.query as { peserta?: string; status?: string };
  const hasil = await jurnalService.getSemuaJurnal({ peserta, status });
  suksesDenganTotal(res, hasil, "Daftar jurnal berhasil diambil");
});

export const getJurnalById = asyncHandler(async (req: Request, res: Response) => {
  const jurnal = await jurnalService.getJurnalById(Number(req.params.id));
  sukses(res, jurnal, "Detail jurnal berhasil diambil");
});

export const buatJurnal = asyncHandler(async (req: Request, res: Response) => {
  const baru = await jurnalService.buatJurnal(req.body);
  dibuat(res, baru, "Jurnal berhasil ditambahkan");
});

export const updateJurnal = asyncHandler(async (req: Request, res: Response) => {
  const hasil = await jurnalService.updateJurnal(Number(req.params.id), req.body);
  sukses(res, hasil, "Jurnal berhasil diupdate");
});

export const updateStatusReview = asyncHandler(async (req: Request, res: Response) => {
  const statusReview = req.body.statusReview ?? "sudah";
  const hasil = await jurnalService.updateStatusReview(Number(req.params.id), statusReview);
  sukses(res, hasil, "Status review berhasil diperbarui");
});

export const hapusJurnal = asyncHandler(async (req: Request, res: Response) => {
  await jurnalService.hapusJurnal(Number(req.params.id));
  res.status(204).send();
});