# Uji Skenario (Minggu 13, Jumat)

Semua skenario diuji lewat curl di Windows CMD terhadap `http://localhost:3000/api/v1`, dengan `NODE_ENV=development`. Hasil: **14 dari 14 lolos**.

## Ringkasan

| # | Skenario | Diharapkan | Hasil |
|---|---|---|---|
| 1 | Register berhasil | 201 + Location | 201, `Location: /api/v1/peserta/59`, tanpa field `password` |
| 2 | Register email duplikat | 409 CONFLICT | 409, `CONFLICT` |
| 3 | Register email format salah | 422 VALIDATION_ERROR | 422, `detail` menunjuk field `email` saja |
| 4 | Login password salah 11 kali | Percobaan ke-11: 429 RATE_LIMITED | Percobaan 1-10 `401`, 11-12 `429`, percobaan ke-13 `429` dengan `Retry-After: 891` |
| 5 | `/me` tanpa token | 401 UNAUTHORIZED | 401, `UNAUTHORIZED` ("Token tidak ditemukan") |
| 6 | `/me` dengan token expired | 401 TOKEN_EXPIRED | Sebelum 30 detik `200`, sesudahnya 401 `TOKEN_EXPIRED` |
| 7 | Peserta akses `GET /jurnal` | 403 FORBIDDEN | 403, `FORBIDDEN` ("Aksi ini hanya untuk: mentor") |
| 8 | Peserta edit jurnal milik peserta lain | 403 FORBIDDEN | 403, `FORBIDDEN` ("Kamu tidak berhak mengubah jurnal ini") |
| 9 | `GET /peserta/9999` | 404 NOT_FOUND | 404, `NOT_FOUND` |
| 10 | Body JSON rusak | 400 INVALID_JSON | 400, `INVALID_JSON` |
| 11 | `GET /peserta?page=0&limit=1000&sortBy=password` | 200, dikoreksi, tidak bocor | 200, `page: 1`, `limit: 100`, 59 data, tidak ada kata "password" di response |
| 12 | `PATCH /me` dengan `{"role":"mentor"}` | role tidak berubah | 200, `telepon` berubah, `role` tetap `"peserta"` |
| 13 | PostgreSQL mati, panggil `/health/ready` | 503 | 503 `not_ready`; `/health` tetap 200; setelah database hidup `/ready` kembali 200 |
| 14 | `Ctrl+C` saat server berjalan | Log shutdown rapi | `Menerima SIGINT...` lalu `Server dan koneksi database ditutup dengan rapi` |

## Tes Tambahan (di luar 14 skenario)

| Tes | Hasil |
|---|---|
| `DELETE /jurnal/:id` oleh peserta yang bukan pemilik | 403 `FORBIDDEN`. Sebelum perbaikan, request ini menghapus jurnal milik orang lain |
| `GET /api/health` (path lama tanpa versi) | 404 `NOT_FOUND` |
| `PATCH /me` mengubah `telepon` | Tersimpan, `updatedAt` ikut berubah |
| `POST /jurnal` | `pesertaId` di response berasal dari token (59), `statusReview` otomatis `belum` |

## Perintah yang Dipakai

Untuk skenario berbasis token, `TOKEN` diisi `accessToken` dari login. Pada CMD, supaya output pendek: `| findstr /B /C:"HTTP" /C:"Location" /C:"{"`.

```bash
# 1 dan 2 (dijalankan dua kali dengan body yang sama)
curl -i -X POST http://localhost:3000/api/v1/auth/register -H "Content-Type: application/json" -d '{"nama":"Peserta Bravo","sekolah":"SMK Uji","email":"bravo@mail.com","password":"password123"}'

# 3
curl -i -X POST http://localhost:3000/api/v1/auth/register -H "Content-Type: application/json" -d '{"nama":"Charlie Uji","sekolah":"SMK Uji","email":"bukan-email","password":"password123"}'

# 4 (CMD): 12 kali login dengan password salah
for /L %i in (1,1,12) do @curl.exe -s -o nul -w "percobaan %i: %{http_code}\n" -X POST http://localhost:3000/api/v1/auth/login -H "Content-Type: application/json" -d "{\"email\":\"bravo@mail.com\",\"password\":\"salahsalah\"}"

# 5
curl -i http://localhost:3000/api/v1/me

# 6: .env diubah sementara JWT_EXPIRES_IN=30s, login, tunggu 35 detik
curl -i http://localhost:3000/api/v1/me -H "Authorization: Bearer TOKEN"

# 7
curl -i http://localhost:3000/api/v1/jurnal -H "Authorization: Bearer TOKEN_PESERTA"

# 8: Bravo membuat jurnal, peserta lain mencoba mengeditnya
curl -i -X POST http://localhost:3000/api/v1/jurnal -H "Content-Type: application/json" -H "Authorization: Bearer TOKEN_BRAVO" -d '{"kegiatan":"Menguji skenario peer review milik Bravo"}'
curl -i -X PUT http://localhost:3000/api/v1/jurnal/3 -H "Content-Type: application/json" -H "Authorization: Bearer TOKEN_PESERTA_LAIN" -d '{"kegiatan":"Jurnal Bravo diubah paksa oleh peserta lain"}'

# 9
curl -i http://localhost:3000/api/v1/peserta/9999

# 10
curl -i -X POST http://localhost:3000/api/v1/peserta -H "Content-Type: application/json" -d '{email rusak'

# 11
curl "http://localhost:3000/api/v1/peserta?page=0&limit=1000&sortBy=password"

# 12
curl -i -X PATCH http://localhost:3000/api/v1/me -H "Content-Type: application/json" -H "Authorization: Bearer TOKEN" -d '{"role":"mentor","telepon":"081200000000"}'

# 13: Services > postgresql-x64-18 > Stop
curl -i http://localhost:3000/api/v1/health/ready
curl -i http://localhost:3000/api/v1/health

# 14: npx ts-node src/index.ts, lalu tekan Ctrl+C
```

## Catatan Pelaksanaan

- Skenario 6 membutuhkan `JWT_EXPIRES_IN` sementara 30 detik. Nilainya sudah dikembalikan ke `15m` setelah tes.
- Skenario 4 dijalankan setelah server di-restart agar hitungan rate limit mulai dari nol. Setelah terkena 429, login dari IP yang sama terkunci sampai 15 menit atau sampai server di-restart.
- Skenario 13 hanya membuktikan `/health/ready`. Perilaku endpoint biasa saat database mati belum diuji (lihat "Masalah Desain yang Diketahui" di `endpoint-audit.md`).
- Skenario 14 dijalankan lewat `npx ts-node src/index.ts`, karena `nodemon` menangani `Ctrl+C` sendiri.