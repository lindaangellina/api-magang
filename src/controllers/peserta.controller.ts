import { Request, Response } from "express";
import { dataPeserta } from "../data/dummy";
import { Peserta, PesertaParams, PesertaQuery, PesertaBody } from "../types";

// GET /api/peserta  (+ filter: sekolah, fase, limit)
export const getSemuaPeserta = (
  req: Request<{}, {}, {}, PesertaQuery>,
  res: Response
): void => {
  const { sekolah, fase, limit } = req.query;
  let hasil: Peserta[] = dataPeserta;

  if (sekolah) {
    hasil = hasil.filter((p) => p.sekolah === sekolah);
  }
  if (fase) {
    hasil = hasil.filter((p) => p.fase === Number(fase));
  }
  if (limit) {
    hasil = hasil.slice(0, Number(limit));
  }

  res.json({ total: hasil.length, data: hasil });
};

// GET /api/peserta/:id
export const getPesertaById = (req: Request<PesertaParams>, res: Response): void => {
  const id = Number(req.params.id);
  const peserta = dataPeserta.find((p) => p.id === id);

  if (!peserta) {
    res.status(404).json({ error: `Peserta dengan id ${id} tidak ditemukan` });
    return;
  }

  res.json(peserta);
};

// POST /api/peserta
export const buatPeserta = (req: Request<{}, {}, PesertaBody>, res: Response): void => {
  const { nama, sekolah, fase } = req.body;

  if (!nama || !sekolah) {
    res.status(400).json({ error: "nama dan sekolah wajib diisi" });
    return;
  }

  const idBaru = dataPeserta.length > 0 ? Math.max(...dataPeserta.map((p) => p.id)) + 1 : 1;
  const baru: Peserta = { id: idBaru, nama, sekolah, fase: fase ?? 1 };

  dataPeserta.push(baru);
  res.status(201).json({ sukses: true, data: baru });
};

// PUT /api/peserta/:id
export const updatePeserta = (
  req: Request<PesertaParams, {}, Partial<PesertaBody>>,
  res: Response
): void => {
  const id = Number(req.params.id);
  const index = dataPeserta.findIndex((p) => p.id === id);

  if (index === -1) {
    res.status(404).json({ error: `Peserta dengan id ${id} tidak ditemukan` });
    return;
  }

  dataPeserta[index] = { ...dataPeserta[index], ...req.body };
  res.json({ sukses: true, data: dataPeserta[index] });
};

// DELETE /api/peserta/:id
export const hapusPeserta = (req: Request<PesertaParams>, res: Response): void => {
  const id = Number(req.params.id);
  const index = dataPeserta.findIndex((p) => p.id === id);

  if (index === -1) {
    res.status(404).json({ error: `Peserta dengan id ${id} tidak ditemukan` });
    return;
  }

  dataPeserta.splice(index, 1);
  res.status(204).send();
};