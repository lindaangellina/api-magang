import { Type } from "class-transformer";
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  MaxLength,
  Min,
  MinLength,
  ValidateIf,
  ValidateNested,
} from "class-validator";
import { KeBoolean, Trim } from "./decorators/transform";
import { ListQueryDto } from "./common.dto";

// Kolom yang boleh dipakai untuk pengurutan daftar jurnal
export const SORT_JURNAL = ["createdAt", "statusReview"] as const;

// ======================================================================
// Minggu 14 Kamis: body jurnal (objek bersarang, array, validasi bersyarat)
// ======================================================================
export class LampiranDto {
  @IsUrl({}, { message: "URL lampiran tidak valid" })
  url!: string;

  @IsOptional()
  @IsString({ message: "keterangan harus berupa teks" })
  @MaxLength(200, { message: "keterangan maksimal 200 karakter" })
  keterangan?: string;
}

export class CreateJurnalDto {
  @Trim()
  @IsString({ message: "Kegiatan harus berupa teks" })
  @MinLength(10, { message: "Kegiatan minimal 10 karakter" })
  @MaxLength(2000, { message: "Kegiatan maksimal 2000 karakter" })
  kegiatan!: string;

  @IsOptional()
  @Trim()
  @IsString({ message: "Hambatan harus berupa teks" })
  @MaxLength(2000, { message: "Hambatan maksimal 2000 karakter" })
  hambatan?: string;

  @IsOptional()
  @IsUrl({}, { message: "Link commit harus berupa URL yang valid" })
  linkCommit?: string;

  @IsOptional()
  @IsArray({ message: "lampiran harus berupa array" })
  @ArrayMaxSize(5, { message: "Lampiran maksimal 5 item" })
  @ValidateNested({ each: true, message: "Setiap item lampiran harus berupa objek" }) // validasi SETIAP elemen array
  @Type(() => LampiranDto) // wajib: tanpa ini elemen tidak pernah divalidasi
  lampiran?: LampiranDto[];
  // pesertaId SENGAJA tidak ada: diambil dari token (req.user.id), bukan dari body.
  // Karena forbidNonWhitelisted aktif untuk body, mengirim pesertaId menghasilkan 422.
}

// Update ditulis eksplisit: decorator tidak ikut tersalin otomatis oleh Partial<>
export class UpdateJurnalDto {
  @IsOptional()
  @Trim()
  @IsString({ message: "Kegiatan harus berupa teks" })
  @MinLength(10, { message: "Kegiatan minimal 10 karakter" })
  @MaxLength(2000, { message: "Kegiatan maksimal 2000 karakter" })
  kegiatan?: string;

  @IsOptional()
  @Trim()
  @IsString({ message: "Hambatan harus berupa teks" })
  @MaxLength(2000, { message: "Hambatan maksimal 2000 karakter" })
  hambatan?: string;

  @IsOptional()
  @IsUrl({}, { message: "Link commit harus berupa URL yang valid" })
  linkCommit?: string;
}

export class ReviewJurnalDto {
  @IsIn(["belum", "sudah"], { message: "statusReview harus belum atau sudah" })
  statusReview!: "belum" | "sudah";

  // Catatan WAJIB hanya kalau jurnal ditandai "sudah" direview.
  // ValidateIf false => semua validator lain pada properti ini dilewati.
  @ValidateIf((o: ReviewJurnalDto) => o.statusReview === "sudah")
  @Trim()
  @IsString({ message: "Catatan wajib diisi saat jurnal ditandai sudah direview" })
  @MinLength(5, { message: "Catatan minimal 5 karakter" })
  @MaxLength(2000, { message: "Catatan maksimal 2000 karakter" })
  catatan?: string;
}

// ======================================================================
// Query daftar jurnal (Rabu)
// ======================================================================
export class ListJurnalQueryDto extends ListQueryDto {
  @IsOptional()
  @IsIn(SORT_JURNAL, {
    message: `sortBy harus salah satu dari: ${SORT_JURNAL.join(", ")}`,
  })
  sortBy: (typeof SORT_JURNAL)[number] = "createdAt";

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: "pesertaId harus berupa bilangan bulat" })
  @Min(1, { message: "pesertaId minimal 1" })
  pesertaId?: number;

  @IsOptional()
  @IsIn(["belum", "sudah"], { message: "statusReview harus belum atau sudah" })
  statusReview?: "belum" | "sudah";

  // from dan to: service memakai `${from}T00:00:00`, jadi hanya tanggal murni
  // YYYY-MM-DD yang boleh. strict: true menolak tanggal yang tidak ada (2026-02-31).
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: "from harus berformat YYYY-MM-DD, contoh 2026-09-01",
  })
  @IsDateString({ strict: true }, { message: "from bukan tanggal yang valid" })
  from?: string;

  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: "to harus berformat YYYY-MM-DD, contoh 2026-09-30",
  })
  @IsDateString({ strict: true }, { message: "to bukan tanggal yang valid" })
  to?: string;

  @IsOptional()
  @KeBoolean()
  @IsBoolean({ message: "belumDireview harus true atau false" })
  belumDireview?: boolean;
}