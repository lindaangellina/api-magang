import express, { Application, Request, Response } from "express";
import dotenv from "dotenv";

dotenv.config();

const app: Application = express();
const PORT = Number(process.env.PORT) || 3000;

// Middleware bawaan Express — otomatis parse JSON body dari request
app.use(express.json());

// SOAL 2 — Route dasar
app.get("/", (req: Request, res: Response) => {
  res.json({ pesan: "API Magang Batch 4" });
});

app.get("/health", (req: Request, res: Response) => {
  res.json({
    status: "ok",
    uptime: process.uptime(),
    waktu: new Date().toISOString(),
  });
});

app.get("/info", (req: Request, res: Response) => {
  res.json({
    nama: process.env.APP_NAME ?? "API Magang",
    versi: "1.0.0",
    environment: process.env.NODE_ENV ?? "development",
  });
});

// SOAL 3 — Route dengan data statis
interface Peserta {
  id: number;
  nama: string;
  sekolah: string;
}

const dataPeserta: Peserta[] = [
  { id: 1, nama: "Linda", sekolah: "SMK5" },
  { id: 2, nama: "Zidan", sekolah: "SMK5" },
  { id: 3, nama: "Ajeng", sekolah: "SMK6" },
  { id: 4, nama: "Saida", sekolah: "SMK6" },
];

app.get("/peserta", (req: Request, res: Response) => {
  res.json(dataPeserta);
});

interface PesertaParams {
  id: string; // route params selalu string, meski isinya angka
}

app.get("/peserta/:id", (req: Request<PesertaParams>, res: Response) => {
  const id = Number(req.params.id);
  const peserta = dataPeserta.find((p) => p.id === id);

  if (!peserta) {
    res.status(404).json({ error: "Peserta tidak ditemukan" });
    return;
  }

  res.json(peserta);
});

// SOAL 4 — Typed request (POST)
interface PesertaBody {
  nama: string;
  sekolah: string;
}

app.post("/peserta", (req: Request<{}, {}, PesertaBody>, res: Response) => {
  const { nama, sekolah } = req.body; // sudah otomatis tertyped

  res.status(201).json({
    sukses: true,
    data: { nama, sekolah },
  });
});

// SOAL 5 — Perbandingan dengan server-manual.ts (Minggu 9)
// ============================================
// Di server-manual.ts (project backend-belajar), route setara untuk
// GET/POST /peserta dan GET /peserta/:id menghabiskan sekitar 35-40 baris,
// karena harus manual:
// - parsing URL pakai `new URL()`
// - cek method & path satu-satu pakai if/else berantai
// - baca body lewat req.on("data")/("end") lalu JSON.parse manual
// - bikin fungsi kirimJSON() sendiri buat res.writeHead + res.end
//
// Dengan Express, route yang sama persis (Soal 3 & 4 di atas) cuma
// sekitar 15-18 baris, karena express sudah menangani:
// - routing otomatis lewat app.get()/app.post()
// - parsing body JSON otomatis lewat express.json()
// - res.json() menggantikan res.writeHead() + JSON.stringify() manual
//
// Penghematan kira-kira 20 baris (~50%) untuk fungsi yang sama.

app.listen(PORT, () => {
  console.log(`Server berjalan di http://localhost:${PORT}`);
});