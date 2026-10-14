import { Request, Response, NextFunction, RequestHandler } from "express";
import { ClassConstructor, plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { ValidationError, FieldError } from "../utils/AppError";
import { ratakan } from "../utils/validasi.util";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const teleponRegex = /^[0-9+\-\s]{8,20}$/;

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

// ======================================================================
// Validasi manual LAMA. Masih dipakai oleh route yang belum dipindah ke DTO.
// validasiRegister dan validasiLogin sudah dihapus (diganti RegisterDto/LoginDto).
// validasiUbahProfil boleh dihapus setelah PATCH /me dan PATCH /peserta/:id
// memakai UpdateProfilDto.
// ======================================================================

// Untuk POST /peserta
export function validasiPeserta(req: Request, res: Response, next: NextFunction): void {
  const { nama, sekolah, email, telepon } = req.body ?? {};
  const errors: FieldError[] = [];

  if (!nama || typeof nama !== "string" || nama.trim().length < 3) {
    errors.push({ field: "nama", pesan: "Nama wajib diisi, minimal 3 karakter" });
  }
  if (!sekolah || typeof sekolah !== "string") {
    errors.push({ field: "sekolah", pesan: "Sekolah wajib diisi" });
  }
  if (!email || typeof email !== "string" || !emailRegex.test(email)) {
    errors.push({ field: "email", pesan: "Email wajib diisi dengan format yang valid" });
  }
  if (telepon !== undefined && (typeof telepon !== "string" || !teleponRegex.test(telepon))) {
    errors.push({ field: "telepon", pesan: "Format telepon tidak valid" });
  }

  if (errors.length > 0) throw new ValidationError(errors);
  next();
}

// Untuk PATCH /peserta/:id dan PATCH /me: semua field opsional, tapi kalau ada harus valid
export function validasiUbahProfil(req: Request, res: Response, next: NextFunction): void {
  const { nama, sekolah, telepon } = req.body ?? {};
  const errors: FieldError[] = [];

  if (nama !== undefined && (typeof nama !== "string" || nama.trim().length < 3)) {
    errors.push({ field: "nama", pesan: "Nama minimal 3 karakter" });
  }
  if (sekolah !== undefined && (typeof sekolah !== "string" || sekolah.trim() === "")) {
    errors.push({ field: "sekolah", pesan: "Sekolah tidak boleh kosong" });
  }
  if (telepon !== undefined && (typeof telepon !== "string" || !teleponRegex.test(telepon))) {
    errors.push({ field: "telepon", pesan: "Format telepon tidak valid" });
  }

  if (errors.length > 0) throw new ValidationError(errors);
  next();
}

// Untuk POST dan PUT /jurnal. pesertaId tidak lagi dibaca dari body.
export function validasiJurnal(req: Request, res: Response, next: NextFunction): void {
  const { kegiatan, hambatan, linkCommit } = req.body ?? {};
  const errors: FieldError[] = [];

  if (!kegiatan || typeof kegiatan !== "string" || kegiatan.trim().length < 10) {
    errors.push({ field: "kegiatan", pesan: "Kegiatan wajib diisi, minimal 10 karakter" });
  }
  if (hambatan !== undefined && typeof hambatan !== "string") {
    errors.push({ field: "hambatan", pesan: "Hambatan harus berupa teks" });
  }
  if (linkCommit !== undefined && typeof linkCommit !== "string") {
    errors.push({ field: "linkCommit", pesan: "Link commit harus berupa teks" });
  }

  if (errors.length > 0) throw new ValidationError(errors);
  next();
}

export function validasiRefreshToken(req: Request, res: Response, next: NextFunction): void {
  const { refreshToken } = req.body ?? {};

  if (!refreshToken || typeof refreshToken !== "string") {
    throw new ValidationError([{ field: "refreshToken", pesan: "refreshToken wajib diisi" }]);
  }

  next();
}