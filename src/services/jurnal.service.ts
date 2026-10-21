import { Between, FindOptionsOrder, FindOptionsWhere, LessThanOrEqual, MoreThanOrEqual, Repository } from "typeorm";
import { JurnalHarian } from "../entities/Jurnal.entity";
import { Peserta } from "../entities/Peserta.entity";
import { StatusReview } from "../types";
import { NotFoundError, ForbiddenError, ValidationError } from "../utils/AppError";
import { ListQuery } from "../utils/pagination";
import { CreateJurnalDto, ReviewJurnalDto, UpdateJurnalDto } from "../dto/jurnal.dto";

interface FilterJurnal {
  pesertaId?: number;
  statusReview?: StatusReview;
  from?: string;
  to?: string;
}

// MINGGU 15 RABU: Dependency Injection. Kedua repository disuntikkan lewat constructor.
export class JurnalService {
  constructor(
    private readonly jurnalRepo: Repository<JurnalHarian>,
    private readonly pesertaRepo: Repository<Peserta>
  ) {}

  async daftarJurnal(lq: ListQuery, filter: FilterJurnal) {
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

    const [data, total] = await this.jurnalRepo.findAndCount({
      where,
      order: { [lq.sortBy]: lq.order } as FindOptionsOrder<JurnalHarian>,
      skip: (lq.page - 1) * lq.limit,
      take: lq.limit,
    });

    return { data, total };
  }

  async getJurnalById(id: number): Promise<JurnalHarian> {
    const jurnal = await this.jurnalRepo.findOneBy({ id });
    if (!jurnal) throw new NotFoundError("Jurnal");
    return jurnal;
  }

  async getJurnalByPeserta(pesertaId: number): Promise<{ peserta: string; jurnal: JurnalHarian[] }> {
    const peserta = await this.pesertaRepo.findOne({
      where: { id: pesertaId },
      relations: { jurnalList: true },
    });

    if (!peserta) throw new NotFoundError("Peserta");

    return { peserta: peserta.nama, jurnal: peserta.jurnalList };
  }

  async getJurnalSaya(pesertaId: number): Promise<JurnalHarian[]> {
    return this.jurnalRepo.find({ where: { pesertaId } });
  }

  // pesertaId datang dari token (bukan dari body), statusReview selalu "belum"
  async buatJurnal(pesertaId: number, data: CreateJurnalDto): Promise<JurnalHarian> {
    const baru = this.jurnalRepo.create({
      pesertaId,
      kegiatan: data.kegiatan,
      hambatan: data.hambatan,
      linkCommit: data.linkCommit,
      // dipetakan eksplisit: yang disimpan hanya url dan keterangan, bukan instance kelas DTO
      lampiran: data.lampiran?.map((l) => ({ url: l.url, keterangan: l.keterangan })),
      statusReview: "belum",
    });
    return this.jurnalRepo.save(baru);
  }

  async updateJurnal(
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

    const jurnal = await this.jurnalRepo.findOneBy({ id });
    if (!jurnal) throw new NotFoundError("Jurnal");

    // Aturan bisnis (lapis service): hanya pemilik atau mentor
    if (role !== "mentor" && jurnal.pesertaId !== userId) {
      throw new ForbiddenError("Kamu tidak berhak mengubah jurnal ini");
    }

    this.jurnalRepo.merge(jurnal, perubahan);
    return this.jurnalRepo.save(jurnal);
  }

  // Siapa yang boleh me-review (hanya mentor) dijaga oleh middleware role di route,
  // jadi service ini boleh me-review jurnal milik siapa pun.
  async updateStatusReview(id: number, data: ReviewJurnalDto): Promise<JurnalHarian> {
    const jurnal = await this.jurnalRepo.findOneBy({ id });
    if (!jurnal) throw new NotFoundError("Jurnal");

    jurnal.statusReview = data.statusReview;
    // Catatan hanya berlaku untuk review "sudah". Saat dikembalikan ke "belum" catatan dikosongkan,
    // sekaligus memastikan nilai yang lolos ValidateIf (tidak divalidasi) tidak pernah tersimpan.
    jurnal.catatanMentor = data.statusReview === "sudah" ? (data.catatan ?? null) : null;
    return this.jurnalRepo.save(jurnal);
  }

  async hapusJurnal(id: number, userId: number, role: "peserta" | "mentor"): Promise<void> {
    const jurnal = await this.jurnalRepo.findOneBy({ id });
    if (!jurnal) throw new NotFoundError("Jurnal");

    if (role !== "mentor" && jurnal.pesertaId !== userId) {
      throw new ForbiddenError("Kamu tidak berhak menghapus jurnal ini");
    }

    await this.jurnalRepo.delete({ id });
  }
}