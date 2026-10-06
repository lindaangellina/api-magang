import { Between, FindOptionsOrder, FindOptionsWhere, LessThanOrEqual, MoreThanOrEqual } from "typeorm";
import { AppDataSource } from "../config/database.config";
import { JurnalHarian } from "../entities/Jurnal.entity";
import { Peserta } from "../entities/Peserta.entity";
import { JurnalBody, StatusReview } from "../types";
import { NotFoundError, ForbiddenError } from "../utils/AppError";
import { ListQuery } from "../utils/pagination";

const jurnalRepo = AppDataSource.getRepository(JurnalHarian);
const pesertaRepo = AppDataSource.getRepository(Peserta);

// Daftar kolom yang BOLEH dipakai untuk sorting
export const SORT_JURNAL = ["createdAt", "statusReview"] as const;

interface FilterJurnal {
  pesertaId?: number;
  statusReview?: StatusReview;
  from?: string;
  to?: string;
}

export async function daftarJurnal(lq: ListQuery, filter: FilterJurnal) {
  const where: FindOptionsWhere<JurnalHarian> = {};

  if (filter.pesertaId) where.pesertaId = filter.pesertaId;
  if (filter.statusReview) where.statusReview = filter.statusReview;

  if (filter.from && filter.to) {
    where.createdAt = Between(new Date(`${filter.from}T00:00:00`), new Date(`${filter.to}T23:59:59`));
  } else if (filter.from) {
    where.createdAt = MoreThanOrEqual(new Date(`${filter.from}T00:00:00`));
  } else if (filter.to) {
    where.createdAt = LessThanOrEqual(new Date(`${filter.to}T23:59:59`));
  }

  const [data, total] = await jurnalRepo.findAndCount({
    where,
    order: { [lq.sortBy]: lq.order } as FindOptionsOrder<JurnalHarian>,
    skip: (lq.page - 1) * lq.limit,
    take: lq.limit,
  });

  return { data, total };
}

export async function getJurnalById(id: number): Promise<JurnalHarian> {
  const jurnal = await jurnalRepo.findOneBy({ id });
  if (!jurnal) throw new NotFoundError("Jurnal");
  return jurnal;
}

export async function getJurnalByPeserta(pesertaId: number): Promise<{ peserta: string; jurnal: JurnalHarian[] }> {
  const peserta = await pesertaRepo.findOne({
    where: { id: pesertaId },
    relations: { jurnalList: true },
  });

  if (!peserta) throw new NotFoundError("Peserta");

  return { peserta: peserta.nama, jurnal: peserta.jurnalList };
}

export async function getJurnalSaya(pesertaId: number): Promise<JurnalHarian[]> {
  return jurnalRepo.find({
    where: { pesertaId },
  });
}

export async function buatJurnal(body: JurnalBody): Promise<JurnalHarian> {
  const baru = jurnalRepo.create({
    pesertaId: body.pesertaId,
    kegiatan: body.kegiatan,
    hambatan: body.hambatan,
    linkCommit: body.linkCommit,
    statusReview: body.statusReview ?? "belum",
  });
  return jurnalRepo.save(baru);
}

export async function updateJurnal(
  id: number,
  userId: number,
  role: "peserta" | "mentor",
  perubahan: Partial<JurnalBody>
): Promise<JurnalHarian> {
  const jurnal = await jurnalRepo.findOneBy({ id });
  if (!jurnal) throw new NotFoundError("Jurnal");

  if (role !== "mentor" && jurnal.pesertaId !== userId) {
    throw new ForbiddenError("Kamu tidak berhak mengubah jurnal ini");
  }

  jurnalRepo.merge(jurnal, perubahan);
  return jurnalRepo.save(jurnal);
}

export async function updateStatusReview(id: number, statusReview: StatusReview): Promise<JurnalHarian> {
  const jurnal = await jurnalRepo.findOneBy({ id });
  if (!jurnal) throw new NotFoundError("Jurnal");

  jurnal.statusReview = statusReview;
  return jurnalRepo.save(jurnal);
}

export async function hapusJurnal(id: number): Promise<void> {
  const hasil = await jurnalRepo.delete({ id });
  if (hasil.affected === 0) throw new NotFoundError("Jurnal");
}