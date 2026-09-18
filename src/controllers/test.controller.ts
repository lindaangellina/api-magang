import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { NotFoundError, ValidationError, UnauthorizedError } from "../utils/AppError";

export const testNotFound = asyncHandler(async (req: Request, res: Response) => {
  throw new NotFoundError("Data contoh");
});

export const testValidation = asyncHandler(async (req: Request, res: Response) => {
  throw new ValidationError([
    "Field nama wajib diisi",
    "Field email tidak valid",
    "Field umur harus berupa angka",
  ]);
});

export const testUnauthorized = asyncHandler(async (req: Request, res: Response) => {
  throw new UnauthorizedError("Token tidak valid atau kadaluarsa");
});

export const testCrash = asyncHandler(async (req: Request, res: Response) => {
  // Sengaja bukan AppError, buat nyimulasi bug tak terduga
  throw new Error("Ini error tak terduga, simulasi bug di kode");
});