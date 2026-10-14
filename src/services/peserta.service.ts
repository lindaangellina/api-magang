import { FindOptionsOrder, FindOptionsWhere, ILike } from "typeorm";
import { AppDataSource } from "../config/database.config";
import { Peserta } from "../entities/Peserta.entity";
import { PesertaBody } from "../types";
import { NotFoundError, ConflictError, ValidationError } from "../utils/AppError";
import { ListQuery, escapeLike } from "../utils/pagination";
import { UpdateProfilDto } from "../dto/peserta.dto";

const repo = AppDataSource.getRepository(Peserta);

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

  // Whitelist: role, password, dan status sengaja tidak diambil dari body
  const baru = repo.create({
    nama: body.nama,
    sekolah: body.sekolah,
    email: body.email,
    telepon: body.telepon,
  });
  return repo.save(baru);
}

// Ambil hanya field yang benar-benar diisi.
// Dengan target ES2022, properti class yang belum diisi bisa muncul sebagai undefined,
// jadi nilai undefined harus disaring.
function hanyaYangDiisi<T extends object>(data: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(data).filter(([, nilai]) => nilai !== undefined)
  ) as Partial<T>;
}

export async function ubahProfil(id: number, data: UpdateProfilDto): Promise<Peserta> {
  const peserta = await repo.findOneBy({ id });
  if (!peserta) throw new NotFoundError("Peserta");

  // Whitelist sudah dijaga UpdateProfilDto: hanya nama, sekolah, telepon yang bisa sampai sini
  const perubahan = hanyaYangDiisi(data);
  if (Object.keys(perubahan).length === 0) {
    throw new ValidationError([{ field: "body", pesan: "Minimal satu field harus diisi" }]);
  }

  repo.merge(peserta, perubahan);
  return repo.save(peserta);
}

export async function hapusPeserta(id: number): Promise<void> {
  const hasil = await repo.delete({ id });
  if (hasil.affected === 0) throw new NotFoundError("Peserta");
}