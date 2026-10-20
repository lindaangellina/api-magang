import { Request, RequestHandler } from "express";
import { ClassConstructor } from "class-transformer";
import { Sumber, validasiDto } from "../utils/validasi.util";

// ======================================================================
// Middleware validasi berbasis DTO (dipakai ulang di route mana pun).
// Sejak Minggu 15 Selasa, logikanya ada di validasiDto (src/utils/validasi.util.ts)
// dan middleware ini hanya urusan Express: ambil input, simpan hasil, panggil next.
// ======================================================================
export function validasi<T extends object>(
  dto: ClassConstructor<T>,
  sumber: Sumber = "body"
): RequestHandler {
  return async (req, _res, next) => {
    try {
      const instance = await validasiDto(dto, req[sumber], sumber);
      // Simpan di req.validated, bukan menimpa req.query (read-only di Express 5)
      req.validated = { ...req.validated, [sumber]: instance };
      next();
    } catch (err) {
      next(err); // diteruskan ke errorHandler Minggu 13
    }
  };
}

// Helper untuk membaca data tervalidasi di controller
export function ambilDto<T>(req: Request, sumber: Sumber = "body"): T {
  return req.validated?.[sumber] as T;
}