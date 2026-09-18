import { Request, Response } from "express";
import { dataJurnal, dataPeserta } from "../data/dummy";
import { Jurnal } from "../types";
import { asyncHandler } from "../utils/asyncHandler";
import { NotFoundError } from "../utils/AppError";

export const getSemuaJurnal = asyncHandler(async (req: Request, res: Response) => {
  const peserta = req.query.peserta as string | undefined;
  const status = req.query.status as string | undefined;

  let hasil: Jurnal[] = dataJurnal;

  if (peserta) hasil = hasil.filter((j) => j.pesertaId === Number(peserta));
  if (status) hasil = hasil.filter((j) => j.status === status);

  res.json({ total: hasil.length, data: hasil });
});

export const getJurnalById = asyncHandler(async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const jurnal = dataJurnal.find((j) => j.id === id);

  if (!jurnal) {
    throw new NotFoundError("Jurnal");
  }

  res.json(jurnal);
});

export const getJurnalByPeserta = asyncHandler(async (req: Request, res: Response) => {
  const pesertaId = Number(req.params.id);
  const peserta = dataPeserta.find((p) => p.id === pesertaId);

  if (!peserta) {
    throw new NotFoundError("Peserta");
  }

  const jurnalMilikPeserta = dataJurnal.filter((j) => j.pesertaId === pesertaId);
  res.json({
    peserta: peserta.nama,
    total: jurnalMilikPeserta.length,
    data: jurnalMilikPeserta,
  });
});

export const buatJurnal = asyncHandler(async (req: Request, res: Response) => {
  const { pesertaId, kegiatan, status } = req.body;

  const idBaru = dataJurnal.length > 0 ? Math.max(...dataJurnal.map((j) => j.id)) + 1 : 1;
  const baru: Jurnal = {
    id: idBaru,
    pesertaId,
    kegiatan,
    status: status ?? "belum",
    tanggal: new Date().toISOString().split("T")[0],
  };

  dataJurnal.push(baru);
  res.status(201).json({ sukses: true, data: baru });
});

export const updateJurnal = asyncHandler(async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const index = dataJurnal.findIndex((j) => j.id === id);

  if (index === -1) {
    throw new NotFoundError("Jurnal");
  }

  dataJurnal[index] = { ...dataJurnal[index], ...req.body };
  res.json({ sukses: true, data: dataJurnal[index] });
});

export const hapusJurnal = asyncHandler(async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const index = dataJurnal.findIndex((j) => j.id === id);

  if (index === -1) {
    throw new NotFoundError("Jurnal");
  }

  dataJurnal.splice(index, 1);
  res.status(204).send();
});