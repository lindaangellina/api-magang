import { Request, RequestHandler } from "express";
import { ClassConstructor, plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { ValidationError } from "../utils/AppError";
import { ratakan } from "../utils/validasi.util";

// ======================================================================
// MINGGU 14: middleware validasi berbasis DTO (dipakai ulang di route mana pun)
// ======================================================================
type Sumber = "body" | "query" | "params";

export function validasi<T extends object>(
  dto: ClassConstructor<T>,
  sumber: Sumber = "body"
): RequestHandler {
  return async (req, _res, next) => {
    try {
      // Express 5: req.body bisa undefined kalau tidak ada body
      const mentah: unknown = req[sumber] ?? {};

      // Tolak body yang bukan objek JSON (misal array atau teks)
      if (typeof mentah !== "object" || mentah === null || Array.isArray(mentah)) {
        throw new ValidationError([
          { field: sumber, pesan: `${sumber} harus berupa objek` },
        ]);
      }

      const instance = plainToInstance(dto, mentah as Record<string, unknown>, {
        exposeDefaultValues: true,
      });

      const errors = await validate(instance, {
        whitelist: true, // buang properti tanpa decorator
        forbidNonWhitelisted: sumber === "body", // body dengan properti asing ditolak
        validationError: { target: false, value: false }, // JANGAN ikutkan nilai (mis. password)
      });

      if (errors.length > 0) {
        throw new ValidationError(ratakan(errors));
      }

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