import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { sukses, dibuat } from "../utils/response";
import * as authService from "../services/auth.service";

export const register = asyncHandler(async (req: Request, res: Response) => {
  const hasil = await authService.register(req.body);
  dibuat(res, hasil, "Registrasi berhasil");
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const hasil = await authService.login(req.body);
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