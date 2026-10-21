import { FindOptionsOrder, FindOptionsWhere, ILike, Repository } from "typeorm";
import { Peserta } from "../entities/Peserta.entity";
import { NotFoundError, ConflictError, ValidationError } from "../utils/AppError";
import { ListQuery, escapeLike } from "../utils/pagination";
import { hanyaYangDiisi } from "../utils/objek";
import { CreatePesertaDto, UpdateProfilDto } from "../dto/peserta.dto";

export const SORT_PESERTA = ["nama", "fase", "createdAt"] as const;

interface FilterPeserta {
  sekolah?: string;
  fase?: number;
}

// MINGGU 15 RABU: Dependency Injection.
// Repository DISUNTIKKAN lewat constructor, bukan diambil sendiri dari AppDataSource.
// Di aplikasi: repository asli (dirakit di services/index.ts). Di test: repository tiruan.
export class PesertaService {
  constructor(private readonly repo: Repository<Peserta>) {}

  async daftarPeserta(lq: ListQuery, filter: FilterPeserta) {
    const dasar: FindOptionsWhere<Peserta> = {};
    if (filter.sekolah) dasar.sekolah = filter.sekolah;
    if (filter.fase) dasar.fase = filter.fase;

    const where: FindOptionsWhere<Peserta> | FindOptionsWhere<Peserta>[] = lq.q
      ? [
          { ...dasar, nama: ILike(`%${escapeLike(lq.q)}%`) },
          { ...dasar, email: ILike(`%${escapeLike(lq.q)}%`) },
        ]
      : dasar;

    const [data, total] = await this.repo.findAndCount({
      where,
      order: { [lq.sortBy]: lq.order } as FindOptionsOrder<Peserta>,
      skip: (lq.page - 1) * lq.limit,
      take: lq.limit,
    });

    return { data, total };
  }

  async getPesertaById(id: number): Promise<Peserta> {
    const peserta = await this.repo.findOneBy({ id });
    if (!peserta) throw new NotFoundError("Peserta");
    return peserta;
  }

  async buatPeserta(body: CreatePesertaDto): Promise<Peserta> {
    const emailSudahAda = await this.repo.findOneBy({ email: body.email });
    if (emailSudahAda) throw new ConflictError("Email sudah terdaftar");

    // Whitelist: role, password, dan status sengaja tidak diambil dari body
    const baru = this.repo.create({
      nama: body.nama,
      sekolah: body.sekolah,
      email: body.email,
      telepon: body.telepon,
    });
    return this.repo.save(baru);
  }

  async ubahProfil(id: number, data: UpdateProfilDto): Promise<Peserta> {
    const peserta = await this.repo.findOneBy({ id });
    if (!peserta) throw new NotFoundError("Peserta");

    // Whitelist sudah dijaga UpdateProfilDto: hanya nama, sekolah, telepon yang bisa sampai sini
    const perubahan = hanyaYangDiisi(data);
    if (Object.keys(perubahan).length === 0) {
      throw new ValidationError([{ field: "body", pesan: "Minimal satu field harus diisi" }]);
    }

    this.repo.merge(peserta, perubahan);
    return this.repo.save(peserta);
  }

  async hapusPeserta(id: number): Promise<void> {
    const hasil = await this.repo.delete({ id });
    if (hasil.affected === 0) throw new NotFoundError("Peserta");
  }
}