import { Repository } from "typeorm";
import { RefreshToken } from "../entities/RefreshToken.entity";
import { PesertaAuthRepository } from "../repositories/peserta-auth.repository";
import { hashPassword, cekPassword, tanpaPassword } from "../utils/password";
import { buatAccessToken, buatRefreshToken, verifikasiRefreshToken } from "../utils/jwt";
import { ConflictError, UnauthorizedError } from "../utils/AppError";
import { config } from "../config/env.config";

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
  // parse "7d" sederhana: asumsi format angka + "d" (hari)
  const match = config.jwt.refreshExpiresIn.match(/^(\d+)d$/);
  const hari = match ? Number(match[1]) : 7;
  return new Date(Date.now() + hari * 24 * 60 * 60 * 1000);
}

// MINGGU 15 RABU: Dependency Injection. Kedua repository disuntikkan lewat constructor.
// Query login dipindah ke PesertaAuthRepository.cariDenganPassword.
export class AuthService {
  constructor(
    private readonly pesertaRepo: PesertaAuthRepository,
    private readonly refreshTokenRepo: Repository<RefreshToken>
  ) {}

  async register(data: RegisterInput) {
    const sudahAda = await this.pesertaRepo.cariByEmail(data.email);
    if (sudahAda) {
      throw new ConflictError("Email sudah terdaftar");
    }

    const passwordHash = await hashPassword(data.password);

    const peserta = this.pesertaRepo.buat({
      nama: data.nama,
      sekolah: data.sekolah,
      email: data.email,
      password: passwordHash,
      role: "peserta",
    });

    const tersimpan = await this.pesertaRepo.simpan(peserta);
    return tanpaPassword(tersimpan);
  }

  async login(data: LoginInput) {
    const peserta = await this.pesertaRepo.cariDenganPassword(data.email);

    // Pesan SAMA untuk email tidak ada dan password salah: penyerang tidak bisa menebak email valid
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

    const entriRefreshToken = this.refreshTokenRepo.create({
      token: refreshToken,
      peserta,
      expiresAt: hitungExpiresAt(),
    });
    await this.refreshTokenRepo.save(entriRefreshToken);

    return { accessToken, refreshToken, peserta: tanpaPassword(peserta) };
  }

  async refresh(refreshTokenInput: string) {
    const payload = verifikasiRefreshToken(refreshTokenInput); // lempar error jika invalid/expired

    const tersimpan = await this.refreshTokenRepo.findOneBy({ token: refreshTokenInput });
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

  async logout(refreshTokenInput: string) {
    await this.refreshTokenRepo.delete({ token: refreshTokenInput });
  }
}