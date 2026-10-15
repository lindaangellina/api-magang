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
| 11 | `GET /peserta?page=0&limit=1000&sortBy=password` | Minggu 13: 200, dikoreksi, tidak bocor. Sejak Minggu 14: 422 | Minggu 13: 200, `page: 1`, `limit: 100`, 59 data, tidak ada kata "password" di response. Sejak Minggu 14: 422 `VALIDATION_ERROR`, tiap parameter diuji terpisah dan masing-masing ditolak (lihat tabel Minggu 14, Rabu) |
| 12 | `PATCH /me` dengan `{"role":"mentor"}` | role tidak berubah | Minggu 13: 200, `telepon` berubah, `role` tetap `"peserta"`. Sejak Minggu 14: 422 `VALIDATION_ERROR`, `role` ditolak dengan pesan "Properti ini tidak diizinkan" dan request tidak diproses |
| 13 | PostgreSQL mati, panggil `/health/ready` | 503 | 503 `not_ready`; `/health` tetap 200; setelah database hidup `/ready` kembali 200 |
| 14 | `Ctrl+C` saat server berjalan | Log shutdown rapi | `Menerima SIGINT...` lalu `Server dan koneksi database ditutup dengan rapi` |

## Tes Tambahan (di luar 14 skenario)

| Tes | Hasil |
|---|---|
| `DELETE /jurnal/:id` oleh peserta yang bukan pemilik | 403 `FORBIDDEN`. Sebelum perbaikan, request ini menghapus jurnal milik orang lain |
| `GET /api/health` (path lama tanpa versi) | 404 `NOT_FOUND` |
| `PATCH /me` mengubah `telepon` | Tersimpan, `updatedAt` ikut berubah |
| `POST /jurnal` | `pesertaId` di response berasal dari token (59), `statusReview` otomatis `belum` |

## Tes Tambahan Minggu 14 (Validasi DTO dan Whitelist)

Diuji setelah `validasi(RegisterDto)`, `validasi(LoginDto)`, dan `validasi(UpdateProfilDto)` dipasang di route. Akun uji: peserta dengan id 60.

| Tes | Hasil |
|---|---|
| `POST /auth/register` dengan body `{}` | 422, `detail` memuat semua field wajib (nama, sekolah, email, password) |
| `POST /auth/register` dengan body `[]` | 422, "body harus berupa objek" |
| `POST /auth/register` dengan `Content-Type: text/plain` | 422, body tidak terbaca sebagai JSON sehingga dianggap kosong |
| `POST /auth/register` dengan JSON rusak | 400 `INVALID_JSON` |
| `POST /auth/register` dengan password `"123"` | 422, hanya field `password` (huruf dan angka, minimal 8 karakter). Nilai `123` tidak muncul di response maupun log |
| `PATCH /me` dengan `{"role":"mentor"}` | 422, `role` "Properti ini tidak diizinkan" |
| `PATCH /me` dengan `{"nama":"Budi","role":"mentor"}` | 422, seluruh request ditolak walaupun `nama` valid |
| `PATCH /me` dengan `{"nama":"Budi"}` | 200. `GET /me` menunjukkan `role` tetap `"peserta"` |
| `PATCH /me` dengan `{"telepon":"081234567890"}` | 200, tersimpan |
| `PATCH /me` dengan `{"telepon":"abc"}` | 422, "Format nomor telepon Indonesia tidak valid" |
| Eksperimen: decorator `telepon` di `UpdateProfilDto` dihapus sementara, lalu `PATCH /me` dengan `{"telepon":"081234567890"}` | 422, "Properti ini tidak diizinkan". Properti DTO tanpa decorator dianggap tidak dikenal. Decorator sudah dikembalikan |
| `PATCH /peserta/60` (milik sendiri) dengan `{"role":"mentor"}` | 422, `role` ditolak |
| `PATCH /peserta/60` (milik sendiri) dengan `{"nama":"Budi Dua"}` | 200 |
| `PATCH /peserta/1` (milik peserta lain) | 403 `FORBIDDEN` |

## Tes Tambahan Minggu 14 (DTO Query, Params, dan Transformasi)

Diuji setelah `IdParamDto`, `ListPesertaQueryDto`, dan `ListJurnalQueryDto` dipasang di route, dan `parseListQuery` dihapus. Tes jurnal khusus mentor memakai akun uji (id 60) yang role-nya diubah sementara menjadi `mentor` lewat database, lalu dikembalikan menjadi `peserta`.

| Tes | Hasil |
|---|---|
| `GET /peserta?page=0` | 422, "page minimal 1" |
| `GET /peserta?page=abc` | 422, "page minimal 1" dan "page harus berupa bilangan bulat" |
| `GET /peserta?limit=1000` | 422, "limit maksimal 100" |
| `GET /peserta?limit=0` | 422, "limit minimal 1" |
| `GET /peserta?sortBy=password` | 422, "sortBy harus salah satu dari: nama, fase, createdAt" |
| `GET /peserta?order=sembarang` | 422, "order harus ASC atau DESC" |
| `GET /peserta?sekolah=a&sekolah=b` | 422, "sekolah maksimal 100 karakter" dan "sekolah harus berupa teks" |
| `GET /peserta?q=%20%20%20` (spasi saja) | 200, `q` dipangkas menjadi kosong dan tidak dipakai |
| `GET /peserta/abc` | 422, "id minimal 1" dan "id harus berupa bilangan bulat" |
| `GET /peserta/0` | 422, "id minimal 1" |
| `GET /peserta/60` | 200 |
| `GET /jurnal/abc` | 422, "id minimal 1" dan "id harus berupa bilangan bulat" |
| Register dengan email `"  Budi@Mail.COM  "` | 201, email tersimpan `budi@mail.com` |
| Register lagi dengan email `budi@mail.com` | 409 `CONFLICT` |
| `GET /jurnal?limit=1` (mentor) | 200, `total` 3 |
| `GET /jurnal?belumDireview=true` (mentor) | 200, `total` 2, data berstatus `belum` |
| `GET /jurnal?belumDireview=false` (mentor) | 200, `total` 1, data berstatus `sudah` (2 + 1 = 3) |
| `GET /jurnal?belumDireview=abc` (mentor) | 422, "belumDireview harus true atau false" |
| `GET /jurnal?belumDireview=true&statusReview=sudah` (mentor) | 422, "belumDireview bertentangan dengan statusReview" |
| `GET /jurnal?from=2026-02-31` (mentor) | 422, "from bukan tanggal yang valid" |

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

# 12 (sejak Minggu 14, body yang memuat role ditolak 422)
curl -i -X PATCH http://localhost:3000/api/v1/me -H "Content-Type: application/json" -H "Authorization: Bearer TOKEN" -d '{"role":"mentor","telepon":"081200000000"}'

# 13: Services > postgresql-x64-18 > Stop
curl -i http://localhost:3000/api/v1/health/ready
curl -i http://localhost:3000/api/v1/health

# 14: npx ts-node src/index.ts, lalu tekan Ctrl+C
```

Perintah tes Minggu 14 (Windows CMD, `-s -w` supaya output hanya body dan kode status):

```
set TOKEN=<accessToken dari login>

curl.exe -s -w "\nHTTP %{http_code}\n" -X PATCH http://localhost:3000/api/v1/me -H "Content-Type: application/json" -H "Authorization: Bearer %TOKEN%" -d "{\"role\":\"mentor\"}"
curl.exe -s -w "\nHTTP %{http_code}\n" -X PATCH http://localhost:3000/api/v1/me -H "Content-Type: application/json" -H "Authorization: Bearer %TOKEN%" -d "{\"nama\":\"Budi\"}"
curl.exe -s -w "\nHTTP %{http_code}\n" -X POST http://localhost:3000/api/v1/auth/register -H "Content-Type: application/json" -d "[]"
curl.exe -s -w "\nHTTP %{http_code}\n" -X PATCH http://localhost:3000/api/v1/peserta/1 -H "Content-Type: application/json" -H "Authorization: Bearer %TOKEN%" -d "{\"nama\":\"Coba Ubah\"}"
```

Perintah tes Minggu 14, Rabu (tanda kutip pada URL wajib karena ada `&`):

```
curl.exe -s -w "\nHTTP %{http_code}\n" "http://localhost:3000/api/v1/peserta?page=0"
curl.exe -s -w "\nHTTP %{http_code}\n" "http://localhost:3000/api/v1/peserta?sekolah=a&sekolah=b"
curl.exe -s -o nul -w "HTTP %{http_code}\n" "http://localhost:3000/api/v1/peserta?q=%20%20%20"
curl.exe -s -w "\nHTTP %{http_code}\n" http://localhost:3000/api/v1/peserta/abc
curl.exe -s -w "\nHTTP %{http_code}\n" -X POST http://localhost:3000/api/v1/auth/register -H "Content-Type: application/json" -d "{\"nama\":\"Tes Tiga\",\"sekolah\":\"SMK Tes\",\"email\":\"  Budi@Mail.COM  \",\"password\":\"rahasia123\"}"
curl.exe -s -w "\nHTTP %{http_code}\n" "http://localhost:3000/api/v1/jurnal?belumDireview=true&limit=1" -H "Authorization: Bearer %TOKEN_MENTOR%"
curl.exe -s -w "\nHTTP %{http_code}\n" "http://localhost:3000/api/v1/jurnal?belumDireview=false&limit=1" -H "Authorization: Bearer %TOKEN_MENTOR%"
```

## Catatan Pelaksanaan

- Skenario 6 membutuhkan `JWT_EXPIRES_IN` sementara 30 detik. Nilainya sudah dikembalikan ke `15m` setelah tes.
- Skenario 4 dijalankan setelah server di-restart agar hitungan rate limit mulai dari nol. Setelah terkena 429, login dari IP yang sama terkunci sampai 15 menit atau sampai server di-restart.
- Skenario 13 hanya membuktikan `/health/ready`. Perilaku endpoint biasa saat database mati belum diuji (lihat "Masalah Desain yang Diketahui" di `endpoint-audit.md`).
- Skenario 14 dijalankan lewat `npx ts-node src/index.ts`, karena `nodemon` menangani `Ctrl+C` sendiri.
- Tes Minggu 14: variabel `TOKEN` dari `set TOKEN=...` hanya berlaku di jendela CMD yang sama. Di jendela baru, `%TOKEN%` terkirim mentah dan menghasilkan 401 `INVALID_TOKEN` ("jwt malformed"). Access token berlaku 15 menit, jadi login ulang jika menerima 401 `TOKEN_EXPIRED`.
- Tes jurnal khusus mentor (Minggu 14, Rabu) memakai akun uji id 60 yang role-nya diubah sementara lewat database (`UPDATE peserta SET role='mentor' WHERE id=60;`), lalu dikembalikan (`... SET role='peserta' ...`). Token harus diambil dengan login ulang setelah perubahan role, karena role tersimpan di dalam token.