import { AppDataSource } from "../config/database.config";
import { Peserta } from "../entities/Peserta.entity";
import { RefreshToken } from "../entities/RefreshToken.entity";
import { hashPassword, cekPassword, tanpaPassword } from "../utils/password";
import { buatAccessToken, buatRefreshToken, verifikasiRefreshToken } from "../utils/jwt";
import { ConflictError, UnauthorizedError } from "../utils/AppError";
import { config } from "../config/env.config";

const repo = AppDataSource.getRepository(Peserta);
const refreshTokenRepo = AppDataSource.getRepository(RefreshToken);

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

function hitungExpiresAt(): Date {
  // parse "7d" sederhana — asumsi format angka + "d" (hari)
  const match = config.jwt.refreshExpiresIn.match(/^(\d+)d$/);
  const hari = match ? Number(match[1]) : 7;
  return new Date(Date.now() + hari * 24 * 60 * 60 * 1000);
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

  const payload = { id: peserta.id, email: peserta.email, role: peserta.role };
  const accessToken = buatAccessToken(payload);
  const refreshToken = buatRefreshToken(payload);

  const entriRefreshToken = refreshTokenRepo.create({
    token: refreshToken,
    peserta,
    expiresAt: hitungExpiresAt(),
  });
  await refreshTokenRepo.save(entriRefreshToken);

  return { accessToken, refreshToken, peserta: tanpaPassword(peserta) };
}

export async function refresh(refreshTokenInput: string) {
  const payload = verifikasiRefreshToken(refreshTokenInput); // lempar error jika invalid/expired

  const tersimpan = await refreshTokenRepo.findOneBy({ token: refreshTokenInput });
  if (!tersimpan) {
    throw new UnauthorizedError("Refresh token tidak dikenali atau sudah dicabut");
  }

  const accessTokenBaru = buatAccessToken({
    id: payload.id,
    email: payload.email,
    role: payload.role,
  });

  return { accessToken: accessTokenBaru };
}

export async function logout(refreshTokenInput: string) {
  await refreshTokenRepo.delete({ token: refreshTokenInput });
}