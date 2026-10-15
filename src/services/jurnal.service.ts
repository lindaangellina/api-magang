import { Between, FindOptionsOrder, FindOptionsWhere, LessThanOrEqual, MoreThanOrEqual } from "typeorm";
import { AppDataSource } from "../config/database.config";
import { JurnalHarian } from "../entities/Jurnal.entity";
import { Peserta } from "../entities/Peserta.entity";
import { StatusReview } from "../types";
import { NotFoundError, ForbiddenError, ValidationError } from "../utils/AppError";
import { ListQuery } from "../utils/pagination";
import { CreateJurnalDto, ReviewJurnalDto, UpdateJurnalDto } from "../dto/jurnal.dto";

const jurnalRepo = AppDataSource.getRepository(JurnalHarian);
const pesertaRepo = AppDataSource.getRepository(Peserta);

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
  return jurnalRepo.find({ where: { pesertaId } });
}

// pesertaId datang dari token (bukan dari body), statusReview selalu "belum"
export async function buatJurnal(pesertaId: number, data: CreateJurnalDto): Promise<JurnalHarian> {
  const baru = jurnalRepo.create({
    pesertaId,
    kegiatan: data.kegiatan,
    hambatan: data.hambatan,
    linkCommit: data.linkCommit,
    // dipetakan eksplisit: yang disimpan hanya url dan keterangan, bukan instance kelas DTO
    lampiran: data.lampiran?.map((l) => ({ url: l.url, keterangan: l.keterangan })),
    statusReview: "belum",
  });
  return jurnalRepo.save(baru);
}

export async function updateJurnal(
  id: number,
  userId: number,
  role: "peserta" | "mentor",
  data: UpdateJurnalDto
): Promise<JurnalHarian> {
  // Whitelist eksplisit: pesertaId dan statusReview tidak bisa diubah lewat endpoint ini
  const perubahan: Partial<Pick<JurnalHarian, "kegiatan" | "hambatan" | "linkCommit">> = {};
  if (data.kegiatan !== undefined) perubahan.kegiatan = data.kegiatan;
  if (data.hambatan !== undefined) perubahan.hambatan = data.hambatan;
  if (data.linkCommit !== undefined) perubahan.linkCommit = data.linkCommit;

  if (Object.keys(perubahan).length === 0) {
    throw new ValidationError([{ field: "body", pesan: "Minimal satu field harus diisi" }]);
  }

  const jurnal = await jurnalRepo.findOneBy({ id });
  if (!jurnal) throw new NotFoundError("Jurnal");

  // Aturan bisnis (lapis service): hanya pemilik atau mentor
  if (role !== "mentor" && jurnal.pesertaId !== userId) {
    throw new ForbiddenError("Kamu tidak berhak mengubah jurnal ini");
  }

  jurnalRepo.merge(jurnal, perubahan);
  return jurnalRepo.save(jurnal);
}

export async function updateStatusReview(id: number, data: ReviewJurnalDto): Promise<JurnalHarian> {
  const jurnal = await jurnalRepo.findOneBy({ id });
  if (!jurnal) throw new NotFoundError("Jurnal");

  jurnal.statusReview = data.statusReview;
  // Catatan hanya berlaku untuk review "sudah". Saat dikembalikan ke "belum" catatan dikosongkan,
  // sekaligus memastikan nilai yang lolos ValidateIf (tidak divalidasi) tidak pernah tersimpan.
  jurnal.catatanMentor = data.statusReview === "sudah" ? (data.catatan ?? null) : null;
  return jurnalRepo.save(jurnal);
}

export async function hapusJurnal(
  id: number,
  userId: number,
  role: "peserta" | "mentor"
): Promise<void> {
  const jurnal = await jurnalRepo.findOneBy({ id });
  if (!jurnal) throw new NotFoundError("Jurnal");

  if (role !== "mentor" && jurnal.pesertaId !== userId) {
    throw new ForbiddenError("Kamu tidak berhak menghapus jurnal ini");
  }

  await jurnalRepo.delete({ id });
}