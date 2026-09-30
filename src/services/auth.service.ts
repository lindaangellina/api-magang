import { AppDataSource } from "../config/database.config";
import { Peserta } from "../entities/Peserta.entity";
import { hashPassword, cekPassword, tanpaPassword } from "../utils/password";
import { buatToken } from "../utils/jwt";
import { ConflictError, UnauthorizedError } from "../utils/AppError";

const repo = AppDataSource.getRepository(Peserta);

interface RegisterInput {
  nama: string;
  sekolah: string;
  email: string;
  password: string;
}

interface LoginInput {
  email: string;
  password: string;
}

export async function register(data: RegisterInput) {
  const sudahAda = await repo.findOneBy({ email: data.email });
  if (sudahAda) {
    throw new ConflictError("Email sudah terdaftar");
  }

  const passwordHash = await hashPassword(data.password);

  const peserta = repo.create({
    nama: data.nama,
    sekolah: data.sekolah,
    email: data.email,
    password: passwordHash,
    role: "peserta",
  });

  const tersimpan = await repo.save(peserta);
  return tanpaPassword(tersimpan);
}

export async function login(data: LoginInput) {
  const peserta = await repo.findOneBy({ email: data.email });

  if (!peserta) {
    throw new UnauthorizedError("Email atau password salah");
  }

  const passwordCocok = await cekPassword(data.password, peserta.password);
  if (!passwordCocok) {
    throw new UnauthorizedError("Email atau password salah");
  }

  const token = buatToken({
    id: peserta.id,
    email: peserta.email,
    role: peserta.role,
  });

  return { token, peserta: tanpaPassword(peserta) };
}