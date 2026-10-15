import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { sukses, suksesDenganTotal, suksesDenganMeta, dibuat } from "../utils/response";
import { jurnalService } from "../services";
import { buatMeta } from "../utils/pagination";
import { StatusReview } from "../types";
import { ValidationError } from "../utils/AppError";
import { API_PREFIX } from "../config/constants";
import { ambilDto } from "../middlewares/validasi.middleware";
import { IdParamDto } from "../dto/common.dto";
import { ListJurnalQueryDto } from "../dto/jurnal.dto";

export const getSemuaJurnal = asyncHandler(async (req: Request, res: Response) => {
  const query = ambilDto<ListJurnalQueryDto>(req, "query");

  // belumDireview=true setara statusReview=belum, belumDireview=false setara statusReview=sudah.
  // Kalau keduanya dikirim dan saling bertentangan, tolak (jangan pilih salah satu diam-diam).
  let statusReview: StatusReview | undefined = query.statusReview;
  if (query.belumDireview !== undefined) {
    const dariBoolean: StatusReview = query.belumDireview ? "belum" : "sudah";
    if (statusReview !== undefined && statusReview !== dariBoolean) {
      throw new ValidationError([
        { field: "belumDireview", pesan: "belumDireview bertentangan dengan statusReview" },
      ]);
    }
    statusReview = dariBoolean;
  }

  const { data, total } = await jurnalService.daftarJurnal(query, {
    pesertaId: query.pesertaId,
    statusReview,
    from: query.from,
    to: query.to,
  });
  suksesDenganMeta(res, data, buatMeta(query.page, query.limit, total), "Daftar jurnal berhasil diambil");
});

export const getJurnalById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = ambilDto<IdParamDto>(req, "params");
  const jurnal = await jurnalService.getJurnalById(id);
  sukses(res, jurnal, "Detail jurnal berhasil diambil");
});

export const buatJurnal = asyncHandler(async (req: Request, res: Response) => {
  const baru = await jurnalService.buatJurnal(req.user!.id, req.body);
  dibuat(res, baru, "Jurnal berhasil ditambahkan", `${API_PREFIX}/jurnal/${baru.id}`);
});

export const updateJurnal = asyncHandler(async (req: Request, res: Response) => {
  const { id } = ambilDto<IdParamDto>(req, "params");
  const hasil = await jurnalService.updateJurnal(
    id,
    req.user!.id,
    req.user!.role,
    req.body ?? {}
  );
  sukses(res, hasil, "Jurnal berhasil diupdate");
});

export const updateStatusReview = asyncHandler(async (req: Request, res: Response) => {
  const { id } = ambilDto<IdParamDto>(req, "params");
  const statusReview = req.body?.statusReview ?? "sudah";
  const hasil = await jurnalService.updateStatusReview(id, statusReview);
  sukses(res, hasil, "Status review berhasil diperbarui");
});

export const hapusJurnal = asyncHandler(async (req: Request, res: Response) => {
  const { id } = ambilDto<IdParamDto>(req, "params");
  await jurnalService.hapusJurnal(id, req.user!.id, req.user!.role);
  res.status(204).send();
});

export const getJurnalSaya = asyncHandler(async (req: Request, res: Response) => {
  const hasil = await jurnalService.getJurnalSaya(req.user!.id);
  suksesDenganTotal(res, hasil, "Jurnal milik saya berhasil diambil");
});