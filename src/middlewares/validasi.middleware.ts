import { Request, Response, NextFunction } from "express";
import { ValidationError, FieldError } from "../utils/AppError";

export function validasiPeserta(req: Request, res: Response, next: NextFunction): void {
  const { nama, sekolah } = req.body;
  const errors: FieldError[] = [];

  if (!nama || typeof nama !== "string" || nama.trim().length < 3) {
    errors.push({ field: "nama", pesan: "Nama wajib diisi, minimal 3 karakter" });
  }
  if (!sekolah || typeof sekolah !== "string") {
    errors.push({ field: "sekolah", pesan: "Sekolah wajib diisi" });
  }

  if (errors.length > 0) {
    throw new ValidationError(errors);
  }

  next();
}

export function validasiJurnal(req: Request, res: Response, next: NextFunction): void {
  const { kegiatan, pesertaId } = req.body;
  const errors: FieldError[] = [];

  if (!kegiatan || typeof kegiatan !== "string" || kegiatan.trim().length < 10) {
    errors.push({ field: "kegiatan", pesan: "Kegiatan wajib diisi, minimal 10 karakter" });
  }
  if (typeof pesertaId !== "number") {
    errors.push({ field: "pesertaId", pesan: "pesertaId wajib diisi berupa angka" });
  }

  if (errors.length > 0) {
    throw new ValidationError(errors);
  }

  next();
}

export function validasiRegister(req: Request, res: Response, next: NextFunction): void {
  const { nama, sekolah, email, password } = req.body;
  const errors: FieldError[] = [];

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

  if (errors.length > 0) {
    throw new ValidationError(errors);
  }

  next();
}

export function validasiLogin(req: Request, res: Response, next: NextFunction): void {
  const { email, password } = req.body;
  const errors: FieldError[] = [];

  if (!email || typeof email !== "string") {
    errors.push({ field: "email", pesan: "Email wajib diisi" });
  }
  if (!password || typeof password !== "string") {
    errors.push({ field: "password", pesan: "Password wajib diisi" });
  }

  if (errors.length > 0) {
    throw new ValidationError(errors);
  }

  next();
}