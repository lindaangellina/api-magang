import { Request, Response } from "express";
import { dataJurnal, dataPeserta } from "../data/dummy";
import { Jurnal, JurnalParams, JurnalQuery, JurnalBody, PesertaParams } from "../types";

// GET /api/jurnal  (+ filter: peserta, status)
export const getSemuaJurnal = (
  req: Request<{}, {}, {}, JurnalQuery>,
  res: Response
): void => {
  const { peserta, status } = req.query;
  let hasil: Jurnal[] = dataJurnal;

  if (peserta) {
    hasil = hasil.filter((j) => j.pesertaId === Number(peserta));
  }
  if (status) {
    hasil = hasil.filter((j) => j.status === status);
  }

  res.json({ total: hasil.length, data: hasil });
};

// GET /api/jurnal/:id
export const getJurnalById = (req: Request<JurnalParams>, res: Response): void => {
  const id = Number(req.params.id);
  const jurnal = dataJurnal.find((j) => j.id === id);

  if (!jurnal) {
    res.status(404).json({ error: `Jurnal dengan id ${id} tidak ditemukan` });
    return;
  }

  res.json(jurnal);
};

// GET /api/peserta/:id/jurnal  — nested route
export const getJurnalByPeserta = (req: Request<PesertaParams>, res: Response): void => {
  const pesertaId = Number(req.params.id);
  const peserta = dataPeserta.find((p) => p.id === pesertaId);

  if (!peserta) {
    res.status(404).json({ error: `Peserta dengan id ${pesertaId} tidak ditemukan` });
    return;
  }

  const jurnalMilikPeserta = dataJurnal.filter((j) => j.pesertaId === pesertaId);
  res.json({
    peserta: peserta.nama,
    total: jurnalMilikPeserta.length,
    data: jurnalMilikPeserta,
  });
};

// POST /api/jurnal
export const buatJurnal = (req: Request<{}, {}, JurnalBody>, res: Response): void => {
  const { pesertaId, kegiatan, status } = req.body;

  if (!kegiatan || kegiatan.trim().length < 10) {
    res.status(400).json({ error: "kegiatan wajib diisi, minimal 10 karakter" });
    return;
  }
  if (typeof pesertaId !== "number") {
    res.status(400).json({ error: "pesertaId wajib diisi berupa angka" });
    return;
  }

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
};

// PUT /api/jurnal/:id
export const updateJurnal = (
  req: Request<JurnalParams, {}, Partial<JurnalBody>>,
  res: Response
): void => {
  const id = Number(req.params.id);
  const index = dataJurnal.findIndex((j) => j.id === id);

  if (index === -1) {
    res.status(404).json({ error: `Jurnal dengan id ${id} tidak ditemukan` });
    return;
  }

  dataJurnal[index] = { ...dataJurnal[index], ...req.body };
  res.json({ sukses: true, data: dataJurnal[index] });
};

// DELETE /api/jurnal/:id
export const hapusJurnal = (req: Request<JurnalParams>, res: Response): void => {
  const id = Number(req.params.id);
  const index = dataJurnal.findIndex((j) => j.id === id);

  if (index === -1) {
    res.status(404).json({ error: `Jurnal dengan id ${id} tidak ditemukan` });
    return;
  }

  dataJurnal.splice(index, 1);
  res.status(204).send();
};