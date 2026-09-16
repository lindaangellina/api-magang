import { Request, Response, NextFunction } from "express";

interface CatatanIp {
  jumlah: number;
  waktuReset: number;
}

const catatanPerIp = new Map<string, CatatanIp>();
const BATAS_REQUEST = 10;
const JENDELA_WAKTU_MS = 60 * 1000; // 1 menit

export function rateLimiter(req: Request, res: Response, next: NextFunction): void {
  const ip = req.ip ?? "unknown";
  const sekarang = Date.now();
  const catatan = catatanPerIp.get(ip);

  // Belum pernah request, atau jendela waktu 1 menit sudah lewat -> reset
  if (!catatan || sekarang > catatan.waktuReset) {
    catatanPerIp.set(ip, { jumlah: 1, waktuReset: sekarang + JENDELA_WAKTU_MS });
    next();
    return;
  }

  if (catatan.jumlah >= BATAS_REQUEST) {
    const sisaDetik = Math.ceil((catatan.waktuReset - sekarang) / 1000);
    res.status(429).json({
      error: "Terlalu banyak request, coba lagi nanti",
      cobaLagiDalam: `${sisaDetik} detik`,
    });
    return;
  }

  catatan.jumlah += 1;
  next();
}