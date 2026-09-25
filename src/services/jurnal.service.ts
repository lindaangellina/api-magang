import { AppDataSource } from "../config/database.config";
import { JurnalHarian } from "../entities/Jurnal.entity";
import { Peserta } from "../entities/Peserta.entity";
import { JurnalBody, StatusReview } from "../types";
import { NotFoundError } from "../utils/AppError";

const jurnalRepo = AppDataSource.getRepository(JurnalHarian);
const pesertaRepo = AppDataSource.getRepository(Peserta);

export async function getSemuaJurnal(filter: {
  peserta?: string;
  status?: string;
}): Promise<JurnalHarian[]> {
  return jurnalRepo.find({
    where: {
      ...(filter.peserta && { pesertaId: Number(filter.peserta) }),
      ...(filter.status && { statusReview: filter.status as StatusReview }),
    },
  });
}

export async function getJurnalById(id: number): Promise<JurnalHarian> {
  const jurnal = await jurnalRepo.findOneBy({ id });
  if (!jurnal) throw new NotFoundError("Jurnal");
  return jurnal;
}

// pakai relasi One-to-Many, bukan filter manual
export async function getJurnalByPeserta(pesertaId: number): Promise<{ peserta: string; jurnal: JurnalHarian[] }> {
  const peserta = await pesertaRepo.findOne({
    where: { id: pesertaId },
    relations: { jurnalList: true },
  });

  if (!peserta) throw new NotFoundError("Peserta");

  return { peserta: peserta.nama, jurnal: peserta.jurnalList };
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

export async function updateJurnal(id: number, perubahan: Partial<JurnalBody>): Promise<JurnalHarian> {
  const jurnal = await jurnalRepo.findOneBy({ id });
  if (!jurnal) throw new NotFoundError("Jurnal");

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