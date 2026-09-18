import { pesertaRepository } from "../repositories";
import { Peserta, PesertaBody } from "../types";
import { NotFoundError } from "../utils/AppError";

export function getSemuaPeserta(filter: { sekolah?: string; fase?: string; limit?: string }): Peserta[] {
  let hasil = pesertaRepository.findAll();

  if (filter.sekolah) hasil = hasil.filter((p) => p.sekolah === filter.sekolah);
  if (filter.fase) hasil = hasil.filter((p) => p.fase === Number(filter.fase));
  if (filter.limit) hasil = hasil.slice(0, Number(filter.limit));

  return hasil;
}

export function getPesertaById(id: number): Peserta {
  const peserta = pesertaRepository.findById(id);
  if (!peserta) throw new NotFoundError("Peserta");
  return peserta;
}

export function buatPeserta(body: PesertaBody): Peserta {
  const baru: Peserta = {
    id: pesertaRepository.nextId(),
    nama: body.nama,
    sekolah: body.sekolah,
    fase: body.fase ?? 1,
  };
  return pesertaRepository.create(baru);
}

export function updatePeserta(id: number, perubahan: Partial<PesertaBody>): Peserta {
  const hasil = pesertaRepository.update(id, perubahan);
  if (!hasil) throw new NotFoundError("Peserta");
  return hasil;
}

export function hapusPeserta(id: number): void {
  const berhasil = pesertaRepository.delete(id);
  if (!berhasil) throw new NotFoundError("Peserta");
}