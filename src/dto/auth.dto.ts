// src/dto/auth.dto.ts
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from "class-validator";

export class RegisterDto {
  @IsString({ message: "Nama harus berupa teks" })
  @MinLength(3, { message: "Nama minimal 3 karakter" })
  @MaxLength(100, { message: "Nama maksimal 100 karakter" })
  nama!: string;

  @IsString({ message: "Sekolah harus berupa teks" })
  @MinLength(3, { message: "Sekolah minimal 3 karakter" })
  @MaxLength(100, { message: "Sekolah maksimal 100 karakter" })
  sekolah!: string;

  @IsEmail({}, { message: "Format email tidak valid" })
  email!: string;

  // MaxLength(72): bcrypt hanya memproses 72 byte pertama. Password yang lebih
  // panjang dipotong diam-diam, jadi kita batasi supaya tidak membingungkan
  // dan menolak input raksasa.
  @IsString({ message: "Password harus berupa teks" })
  @MinLength(8, { message: "Password minimal 8 karakter" })
  @MaxLength(72, { message: "Password maksimal 72 karakter" })
  @Matches(/^(?=.*[A-Za-z])(?=.*\d).+$/, {
    message: "Password harus mengandung huruf dan angka",
  })
  password!: string;
}

export class LoginDto {
  @IsEmail({}, { message: "Format email tidak valid" })
  email!: string;

  // Login TIDAK memakai aturan kekuatan password: akun lama tidak boleh
  // terkunci, dan kita tidak ingin membocorkan aturan password ke penyerang.
  @IsString({ message: "Password harus berupa teks" })
  @IsNotEmpty({ message: "Password wajib diisi" })
  password!: string;
}