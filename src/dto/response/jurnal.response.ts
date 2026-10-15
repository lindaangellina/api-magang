import { Expose, Type } from "class-transformer";

export class LampiranResponseDto {
  @Expose() url!: string;
  @Expose() keterangan?: string;
}

export class JurnalResponseDto {
  @Expose() id!: number;
  @Expose() pesertaId!: number;
  @Expose() kegiatan!: string;
  @Expose() hambatan?: string | null;
  @Expose() linkCommit?: string | null;
  @Expose() statusReview!: string;
  @Expose() reviewerId?: number | null;
  @Expose() catatanMentor?: string | null;

  // Objek bersarang: kelas anaknya juga harus punya @Expose
  @Expose()
  @Type(() => LampiranResponseDto)
  lampiran?: LampiranResponseDto[] | null;

  @Expose() createdAt!: Date;
}