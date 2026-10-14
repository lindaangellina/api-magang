// src/dto/peserta.dto.ts
import { IsOptional, IsString, Matches, MaxLength, MinLength } from "class-validator";

export class UpdateProfilDto {
  @IsOptional()
  @IsString({ message: "Nama harus berupa teks" })
  @MinLength(3, { message: "Nama minimal 3 karakter" })
  @MaxLength(100, { message: "Nama maksimal 100 karakter" })
  nama?: string;

  @IsOptional()
  @IsString({ message: "Sekolah harus berupa teks" })
  @MinLength(3, { message: "Sekolah minimal 3 karakter" })
  @MaxLength(100, { message: "Sekolah maksimal 100 karakter" })
  sekolah?: string;

   @IsOptional()
  @Matches(/^(\+62|62|0)8[1-9][0-9]{6,10}$/, {
    message: "Format nomor telepon Indonesia tidak valid",
  })
  telepon?: string;

  // role, password, email, id sengaja TIDAK ada di sini.
  // Dengan whitelist + forbidNonWhitelisted, field-field itu ditolak.
}