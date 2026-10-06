import { FindOptionsOrder, FindOptionsWhere, ILike } from "typeorm";
import { AppDataSource } from "../config/database.config";
import { Peserta } from "../entities/Peserta.entity";
import { PesertaBody } from "../types";
import { NotFoundError, ConflictError } from "../utils/AppError";
import { ListQuery, escapeLike } from "../utils/pagination";

const repo = AppDataSource.getRepository(Peserta);

// Daftar kolom yang BOLEH dipakai untuk sorting
export const SORT_PESERTA = ["nama", "fase", "createdAt"] as const;

interface FilterPeserta {
  sekolah?: string;
  fase?: number;
}

export async function daftarPeserta(lq: ListQuery, filter: FilterPeserta) {
  const dasar: FindOptionsWhere<Peserta> = {};
  if (filter.sekolah) dasar.sekolah = filter.sekolah;
  if (filter.fase) dasar.fase = filter.fase;

  const where: FindOptionsWhere<Peserta> | FindOptionsWhere<Peserta>[] = lq.q
    ? [
        { ...dasar, nama: ILike(`%${escapeLike(lq.q)}%`) },
        { ...dasar, email: ILike(`%${escapeLike(lq.q)}%`) },
      ]
    : dasar;

  const [data, total] = await repo.findAndCount({
    where,
    order: { [lq.sortBy]: lq.order } as FindOptionsOrder<Peserta>,
    skip: (lq.page - 1) * lq.limit,
    take: lq.limit,
  });

  return { data, total };
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