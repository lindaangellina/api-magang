import { Request, Response, NextFunction } from "express";
import { ValidationError, FieldError } from "../utils/AppError";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const teleponRegex = /^[0-9+\-\s]{8,20}$/;

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

export function validasiRegister(req: Request, res: Response, next: NextFunction): void {
  const { nama, sekolah, email, password } = req.body ?? {};
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
  if (!password || typeof password !== "string" || password.length < 8) {
    errors.push({ field: "password", pesan: "Password wajib diisi, minimal 8 karakter" });
  }

  if (errors.length > 0) throw new ValidationError(errors);
  next();
}

export function validasiLogin(req: Request, res: Response, next: NextFunction): void {
  const { email, password } = req.body ?? {};
  const errors: FieldError[] = [];

  if (!email || typeof email !== "string") {
    errors.push({ field: "email", pesan: "Email wajib diisi" });
  }
  if (!password || typeof password !== "string") {
    errors.push({ field: "password", pesan: "Password wajib diisi" });
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