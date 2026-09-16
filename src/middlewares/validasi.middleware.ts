import { Request, Response, NextFunction } from "express";

export function validasiPeserta(req: Request, res: Response, next: NextFunction): void {
  const { nama, sekolah } = req.body;
  const errors: string[] = [];

  if (!nama || typeof nama !== "string" || nama.trim().length < 3) {
    errors.push("Nama wajib diisi, minimal 3 karakter");
  }
  if (!sekolah || typeof sekolah !== "string") {
    errors.push("Sekolah wajib diisi");
  }

  if (errors.length > 0) {
    res.status(400).json({ error: "Validasi gagal", detail: errors });
    return; // jangan panggil next(), hentikan di sini
  }

  next();
}

export function validasiJurnal(req: Request, res: Response, next: NextFunction): void {
  const { kegiatan, pesertaId } = req.body;
  const errors: string[] = [];

  if (!kegiatan || typeof kegiatan !== "string" || kegiatan.trim().length < 10) {
    errors.push("Kegiatan wajib diisi, minimal 10 karakter");
  }
  if (typeof pesertaId !== "number") {
    errors.push("pesertaId wajib diisi berupa angka");
  }

  if (errors.length > 0) {
    res.status(400).json({ error: "Validasi gagal", detail: errors });
    return;
  }

  next();
}