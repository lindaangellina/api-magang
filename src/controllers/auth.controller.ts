import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { sukses, dibuat } from "../utils/response";
import * as authService from "../services/auth.service";
import { API_PREFIX } from "../config/constants";
import { ambilDto } from "../middlewares/validasi.middleware";
import { RegisterDto, LoginDto, RefreshTokenDto } from "../dto/auth.dto";
import { serialisasi } from "../utils/serialisasi";
import { PesertaResponseDto } from "../dto/response/peserta.response";

export const register = asyncHandler(async (req: Request, res: Response) => {
  const dto = ambilDto<RegisterDto>(req);
  // konfirmasiPassword hanya untuk validasi: sengaja TIDAK diteruskan ke service
  const hasil = await authService.register({
    nama: dto.nama,
    sekolah: dto.sekolah,
    email: dto.email,
    password: dto.password,
  });
  dibuat(
    res,
    serialisasi(PesertaResponseDto, hasil),
    "Registrasi berhasil",
    `${API_PREFIX}/peserta/${hasil.id}`
  );
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const data = ambilDto<LoginDto>(req);
  const hasil = await authService.login(data);
  sukses(
    res,
    { ...hasil, peserta: serialisasi(PesertaResponseDto, hasil.peserta) },
    "Login berhasil"
  );
});

export const refresh = asyncHandler(async (req: Request, res: Response) => {
  const { refreshToken } = ambilDto<RefreshTokenDto>(req);
  const hasil = await authService.refresh(refreshToken);
  sukses(res, hasil, "Access token berhasil diperbarui");
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  const { refreshToken } = ambilDto<RefreshTokenDto>(req);
  await authService.logout(refreshToken);
  sukses(res, null, "Logout berhasil");
});