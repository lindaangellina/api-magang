import { Type } from "class-transformer";
import {
  IsEmail,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
} from "class-validator";
import { KeHurufKecil, Trim } from "./decorators/transform";
import { ListQueryDto } from "./common.dto";

// Untuk POST /peserta (menggantikan validasiPeserta manual).
// role, password, status, fase, dan id sengaja TIDAK ada: tidak bisa diisi lewat body.
export class CreatePesertaDto {
  @Trim()
  @IsString({ message: "Nama harus berupa teks" })
  @MinLength(3, { message: "Nama minimal 3 karakter" })
  @MaxLength(100, { message: "Nama maksimal 100 karakter" })
  nama!: string;

  @Trim()
  @IsString({ message: "Sekolah harus berupa teks" })
  @MinLength(3, { message: "Sekolah minimal 3 karakter" })
  @MaxLength(100, { message: "Sekolah maksimal 100 karakter" })
  sekolah!: string;

  @Trim()
  @KeHurufKecil()
  @MaxLength(254, { message: "Email maksimal 254 karakter" })
  @IsEmail({}, { message: "Format email tidak valid" })
  email!: string;

  @IsOptional()
  @Trim()
  @Matches(/^(\+62|62|0)8[1-9][0-9]{6,10}$/, {
    message: "Format nomor telepon Indonesia tidak valid",
  })
  telepon?: string;
}

export class UpdateProfilDto {
  @IsOptional()
  @Trim()
  @IsString({ message: "Nama harus berupa teks" })
  @MinLength(3, { message: "Nama minimal 3 karakter" })
  @MaxLength(100, { message: "Nama maksimal 100 karakter" })
  nama?: string;

  @IsOptional()
  @Trim()
  @IsString({ message: "Sekolah harus berupa teks" })
  @MinLength(3, { message: "Sekolah minimal 3 karakter" })
  @MaxLength(100, { message: "Sekolah maksimal 100 karakter" })
  sekolah?: string;

  @IsOptional()
  @Trim()
  @Matches(/^(\+62|62|0)8[1-9][0-9]{6,10}$/, {
    message: "Format nomor telepon Indonesia tidak valid",
  })
  telepon?: string;

  // role, password, email, id sengaja TIDAK ada di sini.
  // Dengan whitelist + forbidNonWhitelisted, field-field itu ditolak.
}

// Kolom yang boleh dipakai untuk pengurutan daftar peserta
export const SORT_PESERTA = ["nama", "fase", "createdAt"] as const;

export class ListPesertaQueryDto extends ListQueryDto {
  @IsOptional()
  @IsIn(SORT_PESERTA, {
    message: `sortBy harus salah satu dari: ${SORT_PESERTA.join(", ")}`,
  })
  sortBy: (typeof SORT_PESERTA)[number] = "createdAt";

  @IsOptional()
  @Trim()
  @IsString({ message: "sekolah harus berupa teks" })
  @MaxLength(100, { message: "sekolah maksimal 100 karakter" })
  sekolah?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: "fase harus berupa bilangan bulat" })
  @Min(1, { message: "fase minimal 1" })
  @Max(5, { message: "fase maksimal 5" })
  fase?: number;
}