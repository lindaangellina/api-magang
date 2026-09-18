import { Request, Response } from "express";
import { dataPeserta } from "../data/dummy";
import { Peserta } from "../types";
import { asyncHandler } from "../utils/asyncHandler";
import { NotFoundError } from "../utils/AppError";

export const getSemuaPeserta = asyncHandler(async (req: Request, res: Response) => {
  const sekolah = req.query.sekolah as string | undefined;
  const fase = req.query.fase as string | undefined;
  const limit = req.query.limit as string | undefined;

  let hasil: Peserta[] = dataPeserta;

  if (sekolah) hasil = hasil.filter((p) => p.sekolah === sekolah);
  if (fase) hasil = hasil.filter((p) => p.fase === Number(fase));
  if (limit) hasil = hasil.slice(0, Number(limit));

  res.json({ total: hasil.length, data: hasil });
});

export const getPesertaById = asyncHandler(async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const peserta = dataPeserta.find((p) => p.id === id);

  if (!peserta) {
    throw new NotFoundError("Peserta");
  }

  res.json(peserta);
});

export const buatPeserta = asyncHandler(async (req: Request, res: Response) => {
  const { nama, sekolah, fase } = req.body;

  const idBaru = dataPeserta.length > 0 ? Math.max(...dataPeserta.map((p) => p.id)) + 1 : 1;
  const baru: Peserta = { id: idBaru, nama, sekolah, fase: fase ?? 1 };

  dataPeserta.push(baru);
  res.status(201).json({ sukses: true, data: baru });
});

export const updatePeserta = asyncHandler(async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const index = dataPeserta.findIndex((p) => p.id === id);

  if (index === -1) {
    throw new NotFoundError("Peserta");
  }

  dataPeserta[index] = { ...dataPeserta[index], ...req.body };
  res.json({ sukses: true, data: dataPeserta[index] });
});

export const hapusPeserta = asyncHandler(async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const index = dataPeserta.findIndex((p) => p.id === id);

  if (index === -1) {
    throw new NotFoundError("Peserta");
  }

  dataPeserta.splice(index, 1);
  res.status(204).send();
});