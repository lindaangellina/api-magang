import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { sukses, suksesDenganMeta, dibuat } from "../utils/response";
import { pesertaService, jurnalService } from "../services";
import { serialisasi } from "../utils/serialisasi";
import { PesertaResponseDto } from "../dto/response/peserta.response";
import { JurnalResponseDto } from "../dto/response/jurnal.response";
import { buatMeta } from "../utils/pagination";
import { ForbiddenError } from "../utils/AppError";
import { API_PREFIX } from "../config/constants";
import { ambilDto } from "../middlewares/validasi.middleware";
import { IdParamDto } from "../dto/common.dto";
import { CreatePesertaDto, ListPesertaQueryDto, UpdateProfilDto } from "../dto/peserta.dto";

export const getSemuaPeserta = asyncHandler(async (req: Request, res: Response) => {
  const query = ambilDto<ListPesertaQueryDto>(req, "query");

  const { data, total } = await pesertaService.daftarPeserta(query, {
    sekolah: query.sekolah,
    fase: query.fase,
  });
  suksesDenganMeta(res, serialisasi(PesertaResponseDto, data), buatMeta(query.page, query.limit, total), "Daftar peserta berhasil diambil");
});

export const getPesertaById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = ambilDto<IdParamDto>(req, "params");
  const peserta = await pesertaService.getPesertaById(id);
  sukses(res, serialisasi(PesertaResponseDto, peserta), "Detail peserta berhasil diambil");
});

export const buatPeserta = asyncHandler(async (req: Request, res: Response) => {
  const data = ambilDto<CreatePesertaDto>(req);
  const baru = await pesertaService.buatPeserta(data);
  dibuat(res, serialisasi(PesertaResponseDto, baru), "Peserta berhasil ditambahkan", `${API_PREFIX}/peserta/${baru.id}`);
});

// PATCH /peserta/:id: peserta hanya boleh mengubah dirinya sendiri, mentor boleh semua
export const ubahPeserta = asyncHandler(async (req: Request, res: Response) => {
  const { id: targetId } = ambilDto<IdParamDto>(req, "params");

  if (req.user!.role !== "mentor" && req.user!.id !== targetId) {
    throw new ForbiddenError("Kamu tidak berhak mengubah data peserta lain");
  }

  const data = ambilDto<UpdateProfilDto>(req); // sudah divalidasi dan bersih
  const hasil = await pesertaService.ubahProfil(targetId, data);
  sukses(res, serialisasi(PesertaResponseDto, hasil), "Peserta berhasil diubah");
});

// PATCH /me
export const ubahProfilSaya = asyncHandler(async (req: Request, res: Response) => {
  const data = ambilDto<UpdateProfilDto>(req); // sudah divalidasi dan bersih
  const hasil = await pesertaService.ubahProfil(req.user!.id, data);
  sukses(res, serialisasi(PesertaResponseDto, hasil), "Profil berhasil diubah");
});

export const hapusPeserta = asyncHandler(async (req: Request, res: Response) => {
  const { id } = ambilDto<IdParamDto>(req, "params");
  await pesertaService.hapusPeserta(id);
  res.status(204).send();
});

export const getJurnalByPeserta = asyncHandler(async (req: Request, res: Response) => {
  const { id } = ambilDto<IdParamDto>(req, "params");
  const hasil = await jurnalService.getJurnalByPeserta(id);
  sukses(
    res,
    { peserta: hasil.peserta, jurnal: serialisasi(JurnalResponseDto, hasil.jurnal) },
    "Jurnal milik peserta berhasil diambil"
  );
});

export const getProfilSaya = asyncHandler(async (req: Request, res: Response) => {
  const peserta = await pesertaService.getPesertaById(req.user!.id);
  sukses(res, serialisasi(PesertaResponseDto, peserta), "Profil berhasil diambil");
});