import { AppDataSource } from "../config/database.config";
import { Peserta } from "../entities/Peserta.entity";
import { PesertaBody } from "../types";
import { NotFoundError, ConflictError } from "../utils/AppError";

const repo = AppDataSource.getRepository(Peserta);

export async function getSemuaPeserta(filter: {
  sekolah?: string;
  fase?: string;
  limit?: string;
}): Promise<Peserta[]> {
  return repo.find({
    where: {
      ...(filter.sekolah && { sekolah: filter.sekolah }),
      ...(filter.fase && { fase: Number(filter.fase) }),
    },
    ...(filter.limit && { take: Number(filter.limit) }),
  });
}

export async function getPesertaById(id: number): Promise<Peserta> {
  const peserta = await repo.findOneBy({ id });
  if (!peserta) throw new NotFoundError("Peserta");
  return peserta;
}

export async function buatPeserta(body: PesertaBody): Promise<Peserta> {
  const emailSudahAda = await repo.findOneBy({ email: body.email });
  if (emailSudahAda) throw new ConflictError("Email sudah terdaftar");

  const baru = repo.create(body);
  return repo.save(baru);
}

export async function updatePeserta(id: number, perubahan: Partial<PesertaBody>): Promise<Peserta> {
  const peserta = await repo.findOneBy({ id });
  if (!peserta) throw new NotFoundError("Peserta");

  repo.merge(peserta, perubahan);
  return repo.save(peserta);
}

export async function hapusPeserta(id: number): Promise<void> {
  const hasil = await repo.delete({ id });
  if (hasil.affected === 0) throw new NotFoundError("Peserta");
}