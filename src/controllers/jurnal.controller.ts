import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { sukses, suksesDenganTotal, suksesDenganMeta, dibuat } from "../utils/response";
import { jurnalService } from "../services";
import { parseListQuery, buatMeta } from "../utils/pagination";
import { SORT_JURNAL } from "../services/jurnal.service";
import { StatusReview } from "../types";

export const getSemuaJurnal = asyncHandler(async (req: Request, res: Response) => {
  const lq = parseListQuery(req.query, SORT_JURNAL, "createdAt");
  const pesertaId = req.query.pesertaId ? Number(req.query.pesertaId) : undefined;
  const statusReview =
    typeof req.query.statusReview === "string" ? (req.query.statusReview as StatusReview) : undefined;
  const from = typeof req.query.from === "string" ? req.query.from : undefined;
  const to = typeof req.query.to === "string" ? req.query.to : undefined;

  const { data, total } = await jurnalService.daftarJurnal(lq, { pesertaId, statusReview, from, to });
  suksesDenganMeta(res, data, buatMeta(lq.page, lq.limit, total), "Daftar jurnal berhasil diambil");
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
  const hasil = await jurnalService.updateJurnal(
    Number(req.params.id),
    req.user!.id,
    req.user!.role,
    req.body
  );
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

export const getJurnalSaya = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const hasil = await jurnalService.getJurnalSaya(userId);
  suksesDenganTotal(res, hasil, "Jurnal milik saya berhasil diambil");
});