import {
  IsEmail,
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from "class-validator";
import { KeHurufKecil, Trim } from "./decorators/transform";
import { Sama } from "./decorators/sama";

export class RegisterDto {
  @Trim()
  @IsString({ message: "Nama harus berupa teks" })
  @MinLength(3, { message: "Nama minimal 3 karakter" })
  @MaxLength(100, { message: "Nama maksimal 100 karakter" })
  nama!: string;

  // Trim juga di sini: tanpa trim, "   " (3 spasi) lolos MinLength(3)
  @Trim()
  @IsString({ message: "Sekolah harus berupa teks" })
  @MinLength(3, { message: "Sekolah minimal 3 karakter" })
  @MaxLength(100, { message: "Sekolah maksimal 100 karakter" })
  sekolah!: string;

  // Email dinormalkan supaya "Budi@Mail.com" dan "budi@mail.com" tidak jadi dua akun
  @Trim()
  @KeHurufKecil()
  @IsEmail({}, { message: "Format email tidak valid" })
  email!: string;

  // Password TIDAK di-trim: spasi di awal atau akhir adalah bagian dari password.
  // MaxLength(72): bcrypt hanya memproses 72 byte pertama.
  @IsString({ message: "Password harus berupa teks" })
  @MinLength(8, { message: "Password minimal 8 karakter" })
  @MaxLength(72, { message: "Password maksimal 72 karakter" })
  @Matches(/^(?=.*[A-Za-z])(?=.*\d).+$/, {
    message: "Password harus mengandung huruf dan angka",
  })
  password!: string;

  // Hanya untuk validasi: TIDAK boleh ikut disimpan (dibuang di auth.service)
  @IsString({ message: "Konfirmasi password harus berupa teks" })
  @Sama("password", { message: "Konfirmasi password tidak cocok" })
  konfirmasiPassword!: string;
}

export class LoginDto {
  // Harus dinormalkan sama seperti saat register, kalau tidak login tidak cocok
  @Trim()
  @KeHurufKecil()
  @IsEmail({}, { message: "Format email tidak valid" })
  email!: string;

  // Login TIDAK memakai aturan kekuatan password: akun lama tidak boleh terkunci,
  // dan kita tidak ingin membocorkan aturan password ke penyerang.
  @IsString({ message: "Password harus berupa teks" })
  @IsNotEmpty({ message: "Password wajib diisi" })
  password!: string;
}