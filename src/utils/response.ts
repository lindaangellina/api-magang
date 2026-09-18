import { Response } from "express";

export function sukses<T>(
  res: Response,
  data: T,
  pesan: string = "Berhasil",
  statusCode: number = 200
): void {
  res.status(statusCode).json({ sukses: true, pesan, data });
}

export function suksesDenganTotal<T>(res: Response, data: T[], pesan: string = "Berhasil"): void {
  res.status(200).json({ sukses: true, pesan, total: data.length, data });
}

export function dibuat<T>(res: Response, data: T, pesan: string = "Data berhasil dibuat"): void {
  res.status(201).json({ sukses: true, pesan, data });
}