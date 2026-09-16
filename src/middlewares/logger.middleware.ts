import { Request, Response, NextFunction } from "express";

export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const mulai = Date.now();

  // Event "finish" terpanggil SETELAH response selesai dikirim,
  // jadi di sini kita sudah tau status code final-nya
  res.on("finish", () => {
    const durasi = Date.now() - mulai;
    const waktu = new Date().toISOString();
    console.log(`[${waktu}] ${req.method} ${req.originalUrl} ${res.statusCode} - ${durasi}ms`);
  });

  next();
}