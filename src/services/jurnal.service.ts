import { jurnalRepository, pesertaRepository } from "../repositories";
import { Jurnal, JurnalBody } from "../types";
import { NotFoundError } from "../utils/AppError";

export function getSemuaJurnal(filter: { peserta?: string; status?: string }): Jurnal[] {
  let hasil = jurnalRepository.findAll();

  if (filter.peserta) hasil = hasil.filter((j) => j.pesertaId === Number(filter.peserta));
  if (filter.status) hasil = hasil.filter((j) => j.status === filter.status);

  return hasil;
}

export function getJurnalById(id: number): Jurnal {
  const jurnal = jurnalRepository.findById(id);
  if (!jurnal) throw new NotFoundError("Jurnal");
  return jurnal;
}

export function getJurnalByPeserta(pesertaId: number): { peserta: string; jurnal: Jurnal[] } {
  const peserta = pesertaRepository.findById(pesertaId);
  if (!peserta) throw new NotFoundError("Peserta");
  return { peserta: peserta.nama, jurnal: jurnalRepository.findByPesertaId(pesertaId) };
}

export function buatJurnal(body: JurnalBody): Jurnal {
  const baru: Jurnal = {
    id: jurnalRepository.nextId(),
    pesertaId: body.pesertaId,
    kegiatan: body.kegiatan,
    status: body.status ?? "belum",
    direview: false,
    tanggal: new Date().toISOString().split("T")[0],
  };
  return jurnalRepository.create(baru);
}

export function updateJurnal(id: number, perubahan: Partial<JurnalBody>): Jurnal {
  const hasil = jurnalRepository.update(id, perubahan);
  if (!hasil) throw new NotFoundError("Jurnal");
  return hasil;
}

export function updateStatusReview(id: number, direview: boolean): Jurnal {
  const hasil = jurnalRepository.update(id, { direview });
  if (!hasil) throw new NotFoundError("Jurnal");
  return hasil;
}

export function hapusJurnal(id: number): void {
  const berhasil = jurnalRepository.delete(id);
  if (!berhasil) throw new NotFoundError("Jurnal");
}