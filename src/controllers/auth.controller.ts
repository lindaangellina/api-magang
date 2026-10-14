import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { sukses, dibuat } from "../utils/response";
import * as authService from "../services/auth.service";
import { API_PREFIX } from "../config/constants";
import { ambilDto } from "../middlewares/validasi.middleware";
import { RegisterDto, LoginDto } from "../dto/auth.dto";

export const register = asyncHandler(async (req: Request, res: Response) => {
     const data = ambilDto<RegisterDto>(req);
     const hasil = await authService.register(data);
     dibuat(res, hasil, "Registrasi berhasil", `${API_PREFIX}/peserta/${hasil.id}`);
   });

export const login = asyncHandler(async (req: Request, res: Response) => {
     const data = ambilDto<LoginDto>(req);
     const hasil = await authService.login(data);
     sukses(res, hasil, "Login berhasil");
   });

export const refresh = asyncHandler(async (req: Request, res: Response) => {
  const { refreshToken } = req.body;
  const hasil = await authService.refresh(refreshToken);
  sukses(res, hasil, "Access token berhasil diperbarui");
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  const { refreshToken } = req.body;
  await authService.logout(refreshToken);
  sukses(res, null, "Logout berhasil");
});