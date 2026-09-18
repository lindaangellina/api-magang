# API Magang Batch 4

API sederhana untuk mengelola data peserta magang dan jurnal harian, dibangun dengan Express + TypeScript (data disimpan di memori, belum pakai database).

## Menjalankan Project

\`\`\`bash
npm install
npm run dev
\`\`\`

Server berjalan di `http://localhost:3000` (atau sesuai `PORT` di `.env`).

## Environment Variables

Salin `.env.example` menjadi `.env`, lalu isi:

\`\`\`
NODE_ENV=development
PORT=3000
APP_NAME=API Magang Batch 4
API_KEY=rahasia-magang-2026
\`\`\`

## Daftar Endpoint

### Peserta

| Method | Endpoint | Keterangan |
|---|---|---|
| GET | /api/peserta | Semua peserta, filter `?sekolah=&fase=&limit=` |
| GET | /api/peserta/:id | Detail satu peserta |
| POST | /api/peserta | Tambah peserta baru |
| PUT | /api/peserta/:id | Update peserta |
| DELETE | /api/peserta/:id | Hapus peserta (perlu header `x-api-key`) |
| GET | /api/peserta/:id/jurnal | Semua jurnal milik peserta tertentu |

### Jurnal

| Method | Endpoint | Keterangan |
|---|---|---|
| GET | /api/jurnal | Semua jurnal, filter `?peserta=&status=` |
| GET | /api/jurnal/:id | Detail satu jurnal |
| POST | /api/jurnal | Tambah jurnal baru |
| PUT | /api/jurnal/:id | Update jurnal |
| PATCH | /api/jurnal/:id/review | Ubah status review, body `{"direview": true}` |
| DELETE | /api/jurnal/:id | Hapus jurnal (perlu header `x-api-key`) |

### Statistik

| Method | Endpoint | Keterangan |
|---|---|---|
| GET | /api/stats | Total peserta, total jurnal, jurnal belum direview, rata-rata jurnal per peserta |

## Contoh Request

\`\`\`bash
curl -X POST http://localhost:3000/api/peserta \\
  -H "Content-Type: application/json" \\
  -d '{"nama":"Rani","sekolah":"SMK1","fase":1}'
\`\`\`

## Format Response

Sukses:
\`\`\`json
{ "sukses": true, "pesan": "...", "data": { } }
\`\`\`

Error:
\`\`\`json
{ "sukses": false, "error": "...", "detail": [ "..." ] }
\`\`\`