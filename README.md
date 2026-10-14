# API Magang Batch 4

API untuk mengelola data peserta magang dan jurnal harian, dibangun dengan Express + TypeScript, terhubung ke database PostgreSQL lewat TypeORM, dengan autentikasi JWT (access token + refresh token) dan role-based access control. Semua endpoint berada di bawah `/api/v1`.

## Menjalankan Project

```bash
npm install
npm run dev
```

Pastikan PostgreSQL sudah jalan dan database `magang_db` sudah dibuat sebelum menjalankan project (lihat bagian Database di bawah).

Server berjalan di `http://localhost:3000` (atau sesuai `PORT` di `.env`).

## Environment Variables

Salin `.env.example` menjadi `.env`, lalu isi:

```
NODE_ENV=development
PORT=3000
APP_NAME=API Magang Batch 4
DB_HOST=localhost
DB_PORT=5432
DB_NAME=magang_db
DB_USER=postgres
DB_PASSWORD=
JWT_SECRET=
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=
JWT_REFRESH_EXPIRES_IN=7d
CORS_ORIGINS=http://localhost:5173
```

`JWT_SECRET` dan `JWT_REFRESH_SECRET` harus string acak yang panjang dan **berbeda satu sama lain**. Generate dengan:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

`CORS_ORIGINS` berisi daftar origin frontend yang diizinkan memanggil API ini, dipisah koma jika lebih dari satu.

`NODE_ENV=production` menyembunyikan field `debug` (pesan asli dan stack trace) dari response error. Di `development`, field itu muncul untuk membantu penelusuran.

## Database

Buat database terlebih dahulu lewat `psql`:

```sql
CREATE DATABASE magang_db;
```

Project ini menggunakan `synchronize: false`. Semua perubahan struktur tabel (skema) dilakukan lewat Migration, bukan otomatis. Migration harus dijalankan setelah database dibuat (lihat langkah "Setup Database dari Nol" di bawah).

## Setup Database dari Nol

Langkah lengkap menyiapkan database setelah clone repo (misal di komputer baru atau anggota tim baru):

1. **Clone repo dan install dependencies**
```bash
   git clone <url-repo>
   cd api-magang
   npm install
```

2. **Siapkan file `.env`**: salin `.env.example` menjadi `.env`, lalu isi kredensial database dan JWT secret sesuai komputer masing-masing.

3. **Buat database kosong**
```bash
   psql -U postgres
   CREATE DATABASE magang_db;
   \q
```

4. **Jalankan semua migration**
```bash
   npm run migration:run
```
   Ini membuat seluruh tabel (`peserta`, `jurnal_harian`, `mentor`, `skill`, `peserta_skill`, `refresh_token`) beserta relasi dan foreign key-nya, sesuai urutan migration, tanpa perlu `synchronize: true`.

5. **Jalankan server**
```bash
   npm run dev
```
   Jika berhasil, muncul log `Database terhubung` dan `Server berjalan di http://localhost:3000`.

6. **Verifikasi**
```bash
   curl http://localhost:3000/api/v1/health/ready
```
   Harus mengembalikan `{"status":"ready","database":"up"}`. Data tetap tersimpan meskipun server atau PostgreSQL di-restart, karena semua data ada di database.

### Perintah migration yang sering dipakai
- `npm run migration:run`: jalankan migration yang belum dieksekusi
- `npm run migration:revert`: batalkan migration terakhir yang dijalankan
- `npm run migration:generate -- src/migrations/NamaMigration`: buat migration baru setelah entity diubah

## Versioning

Semua route diawali `/api/v1`. Perubahan yang mematahkan client (menghapus atau mengganti nama field, mengubah tipe data, mengubah arti status code, membuat field opsional menjadi wajib) akan dirilis sebagai `/api/v2`, sementara versi lama tetap hidup. Menambah field, endpoint, atau query parameter opsional aman di versi yang sama.

Path lama tanpa versi (misalnya `/api/peserta`) sudah tidak ada dan mengembalikan `404 NOT_FOUND`.

## Autentikasi

API ini memakai JWT dengan dua jenis token:
- **Access token**: umur pendek (15 menit), dikirim di header `Authorization: Bearer <token>` untuk tiap request ke endpoint yang terproteksi.
- **Refresh token**: umur panjang (7 hari), disimpan di database (tabel `refresh_token`) sehingga bisa dicabut saat logout. Dipakai khusus untuk menukar access token baru tanpa perlu login ulang.

Saat access token kedaluwarsa, API mengembalikan `401` dengan `kode: "TOKEN_EXPIRED"`. Client cukup memanggil `/api/v1/auth/refresh` dengan refresh token untuk mendapat access token baru, tanpa perlu mengisi ulang email dan password. Token yang rusak atau dipalsukan mengembalikan `kode: "INVALID_TOKEN"`.

### Endpoint Auth

| Method | Endpoint | Keterangan | Butuh Token? |
|---|---|---|---|
| POST | /api/v1/auth/register | Daftar peserta baru (201 + header `Location`) | Tidak |
| POST | /api/v1/auth/login | Login, dapat accessToken + refreshToken (dibatasi rate limit) | Tidak |
| POST | /api/v1/auth/refresh | Tukar refreshToken dengan accessToken baru | Tidak (refreshToken di body) |
| POST | /api/v1/auth/logout | Hapus refreshToken dari database | Tidak (refreshToken di body) |

**Register**
```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"nama":"Rani","sekolah":"SMK1","email":"rani@mail.com","password":"password123"}'
```
Response (201), dengan header `Location: /api/v1/peserta/7`:
```json
{
  "sukses": true,
  "pesan": "Registrasi berhasil",
  "data": { "id": 7, "nama": "Rani", "sekolah": "SMK1", "email": "rani@mail.com", "role": "peserta", "...": "..." }
}
```

**Login**
```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"rani@mail.com","password":"password123"}'
```
Response (200):
```json
{
  "sukses": true,
  "pesan": "Login berhasil",
  "data": {
    "accessToken": "eyJhbGciOi...",
    "refreshToken": "eyJhbGciOi...",
    "peserta": { "id": 7, "nama": "Rani", "role": "peserta", "...": "..." }
  }
}
```
Email tidak terdaftar maupun password salah mengembalikan pesan error yang **sama** (`"Email atau password salah"`, 401), supaya penyerang tidak bisa menebak email mana yang valid.

**Refresh**
```bash
curl -X POST http://localhost:3000/api/v1/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken":"eyJhbGciOi..."}'
```
Response (200):
```json
{ "sukses": true, "pesan": "Access token berhasil diperbarui", "data": { "accessToken": "eyJhbGciOi..." } }
```
Refresh token yang tidak valid, kedaluwarsa, atau sudah dihapus (misal setelah logout) mengembalikan 401. Body tanpa `refreshToken` mengembalikan 422.

**Logout**
```bash
curl -X POST http://localhost:3000/api/v1/auth/logout \
  -H "Content-Type: application/json" \
  -d '{"refreshToken":"eyJhbGciOi..."}'
```
Response (200):
```json
{ "sukses": true, "pesan": "Logout berhasil", "data": null }
```
Refresh token langsung dihapus dari database, sehingga tidak bisa dipakai lagi untuk refresh walau JWT-nya sendiri secara teknis belum kedaluwarsa.

### Role

Ada dua role: `peserta` (default saat register) dan `mentor` (di-set manual di database). Role menentukan endpoint mana yang boleh diakses (lihat kolom "Akses" di tabel endpoint). Sudah login tapi role atau kepemilikan data tidak sesuai mengembalikan `403 FORBIDDEN`. Belum login mengembalikan `401 UNAUTHORIZED`.

## Daftar Endpoint

Endpoint yang butuh login dipanggil dengan header:
```
Authorization: Bearer <accessToken>
```

### Profil Saya

| Method | Endpoint | Keterangan | Akses |
|---|---|---|---|
| GET | /api/v1/me | Profil milik sendiri (diambil dari token) | Login |
| PATCH | /api/v1/me | Ubah profil sendiri. Hanya `nama`, `sekolah`, `telepon` | Login |
| GET | /api/v1/me/jurnal | Jurnal milik sendiri (diambil dari token, bukan dari query atau params) | Login |

### Peserta

| Method | Endpoint | Keterangan | Akses |
|---|---|---|---|
| GET | /api/v1/peserta | Daftar peserta dengan pagination, filter, sorting, pencarian | Publik |
| GET | /api/v1/peserta/:id | Detail satu peserta | Publik |
| POST | /api/v1/peserta | Tambah peserta baru (201 + `Location`) | Publik |
| PATCH | /api/v1/peserta/:id | Ubah sebagian data. Peserta hanya untuk dirinya sendiri, mentor untuk siapa pun | Login |
| DELETE | /api/v1/peserta/:id | Hapus peserta (204, atau 409 jika masih punya jurnal) | Hanya mentor |
| GET | /api/v1/peserta/:id/jurnal | Semua jurnal milik peserta tertentu | Publik |

### Jurnal

| Method | Endpoint | Keterangan | Akses |
|---|---|---|---|
| GET | /api/v1/jurnal | Daftar semua jurnal dengan pagination, filter, sorting | Hanya mentor |
| GET | /api/v1/jurnal/:id | Detail satu jurnal | Publik |
| POST | /api/v1/jurnal | Tambah jurnal baru. `pesertaId` diambil dari token (201 + `Location`) | Login |
| PUT | /api/v1/jurnal/:id | Ubah jurnal (`kegiatan`, `hambatan`, `linkCommit`). Peserta hanya jurnal miliknya, mentor semua | Login |
| PATCH | /api/v1/jurnal/:id/review | Ubah status review, body `{"statusReview": "sudah"}` | Hanya mentor |
| DELETE | /api/v1/jurnal/:id | Hapus jurnal (204). Peserta hanya jurnal miliknya, mentor semua | Login |

### Statistik

| Method | Endpoint | Keterangan | Akses |
|---|---|---|---|
| GET | /api/v1/stats | Total peserta, total jurnal, jurnal belum direview, rata-rata jurnal per peserta, jumlah jurnal per peserta (QueryBuilder + GROUP BY), skill terpopuler (relasi Many-to-Many) | Publik |

### Health Check

| Method | Endpoint | Keterangan | Akses |
|---|---|---|---|
| GET | /api/v1/health | Liveness: memastikan proses hidup, tidak menyentuh database. Selalu 200 selama server menyala | Publik |
| GET | /api/v1/health/ready | Readiness: mengecek koneksi database. 200 jika siap, 503 jika database mati | Publik |

Health check memakai format response sendiri (`{ "status": ... }`), bukan format sukses dan error di bawah.

## Perubahan Data yang Aman (Whitelist)

Request body tidak pernah disalin langsung ke entity, karena itu membuka celah mass assignment (misalnya peserta mengirim `{"role":"mentor"}` untuk menaikkan haknya sendiri). Field yang boleh diubah dipilih eksplisit:

- `PATCH /me` dan `PATCH /peserta/:id`: hanya `nama`, `sekolah`, `telepon`. Nilai `role`, `password`, `email`, dan `status` diabaikan.
- `POST /jurnal`: `pesertaId` diambil dari token dan `statusReview` selalu `belum`. Keduanya tidak bisa diisi dari body.
- `PUT /jurnal/:id`: hanya `kegiatan`, `hambatan`, `linkCommit`. Status review hanya bisa diubah mentor lewat `PATCH /jurnal/:id/review`.

Contoh: body `{"role":"mentor","telepon":"081234567890"}` pada `PATCH /me` hanya mengubah `telepon`, `role` tetap `peserta`.
```bash
curl -X PATCH http://localhost:3000/api/v1/me \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <accessToken>" \
  -d '{"role":"mentor","telepon":"081234567890"}'
```

## Pagination, Filtering, Sorting & Pencarian

Endpoint daftar (`GET /api/v1/peserta` dan `GET /api/v1/jurnal`) tidak pernah mengembalikan semua data sekaligus.

| Parameter | Keterangan | Default |
|---|---|---|
| `page` | Halaman ke berapa (mulai dari 1) | 1 |
| `limit` | Jumlah data per halaman, maksimal 100 | 10 |
| `sortBy` | Kolom pengurutan, hanya dari daftar yang diizinkan | `createdAt` |
| `order` | `asc` atau `desc` | `desc` |
| `q` | Kata kunci pencarian (khusus peserta: nama atau email) | - |

Filter dan kolom `sortBy` yang diizinkan:

| Endpoint | Filter | sortBy yang diizinkan |
|---|---|---|
| GET /api/v1/peserta | `sekolah`, `fase`, `q` | `nama`, `fase`, `createdAt` |
| GET /api/v1/jurnal | `pesertaId`, `statusReview`, `from`, `to` (format `YYYY-MM-DD`) | `createdAt`, `statusReview` |

Contoh:
```bash
curl "http://localhost:3000/api/v1/peserta?page=2&limit=10&sortBy=nama&order=asc&q=budi&fase=1"
```

Response memuat `meta`:
```json
{
  "sukses": true,
  "pesan": "Daftar peserta berhasil diambil",
  "data": [ { "id": 3, "nama": "Ajeng", "...": "..." } ],
  "meta": { "page": 1, "limit": 10, "total": 57, "totalPages": 6, "hasNext": true, "hasPrev": false }
}
```

Keamanan input:
- `page` dan `limit` yang tidak valid (0, negatif, huruf) otomatis diganti nilai default, dan `limit` dibatasi maksimal 100.
- `sortBy` memakai whitelist. Nilai di luar daftar (misalnya `password` atau potongan SQL) diabaikan dan memakai urutan default.
- Karakter wildcard `%` dan `_` pada `q` di-escape, sehingga `q=%` tidak mengembalikan semua data.
- Halaman di luar jangkauan mengembalikan `data: []` dengan status tetap `200`.

## Rate Limiting

Hanya `POST /api/v1/auth/login` yang dibatasi: maksimal 10 percobaan **gagal** per IP dalam 15 menit (login yang berhasil tidak dihitung). Jika terlampaui, API mengembalikan `429` dengan `kode: "RATE_LIMITED"`, `requestId`, serta header `RateLimit-*` dan `Retry-After` yang menunjukkan berapa detik harus menunggu.

## Keamanan & Ketahanan Server

- **Request ID**: setiap response membawa header `X-Request-Id` (UUID). Nilai yang sama ada di body error dan di setiap baris log.
- **Log terstruktur**: semua log berbentuk JSON satu baris (`waktu`, `level`, `pesan`, plus metadata). Error 5xx dicatat level `error`, 4xx level `warn`. Password dan token tidak pernah masuk log, dan logging query TypeORM dibatasi ke `error` dan `warn`.
- **Graceful shutdown**: `Ctrl+C` atau `SIGTERM` membuat server berhenti menerima request baru, menunggu request berjalan selesai, menutup koneksi database, lalu keluar (batas waktu 10 detik). `uncaughtException` memicu shutdown, sedangkan `unhandledRejection` dicatat.
- **helmet**: memasang header keamanan standar.
- **CORS**: hanya origin di `CORS_ORIGINS` yang diizinkan. Header `Location`, `X-Request-Id`, dan `Retry-After` dibuka agar bisa dibaca JavaScript di browser.
- **Batas body**: `express.json({ limit: "1mb" })`.
- **Password**: tidak pernah dikirim ke client dan tidak pernah dicatat di log. Kolom `password` memakai `select: false`.

## Melacak Error Lewat Request ID

Setiap response membawa header `X-Request-Id`. Nilai yang sama ada di body error (`requestId`) dan di setiap baris log server, sehingga satu laporan error bisa dilacak sampai ke penyebabnya.

Langkah pelacakan:
1. User melapor error dan menyebut `requestId` dari response, misalnya `7068b5c7-e145-41ed-8a43-d5a2cd2e9d0e`.
2. Cari `requestId` itu di log server (di VS Code: klik terminal, tekan `Ctrl + F`).
3. Dua baris akan ketemu: log `error` dari `errorHandler` (berisi `method`, `url`, `status`, `kode`, `userId` jika login, dan `stack`), dan log `request selesai` (berisi `durasiMs`).
4. `stack` menunjuk file dan baris tempat error terjadi.

Contoh percobaan: endpoint sementara `GET /api/test/crash` (dibuat sebelum versioning) melempar error biasa. Response-nya `500 INTERNAL_ERROR` dengan `requestId: 7068b5c7-...`, dan log server dengan ID yang sama menunjukkan stack yang menunjuk ke `test.routes.ts`. Endpoint ini sudah dihapus setelah percobaan.

## Format Response

Sukses:
```json
{ "sukses": true, "pesan": "...", "data": { } }
```
Endpoint daftar menambah field `meta`. `POST` yang membuat data menyertakan header `Location`, dan `DELETE` mengembalikan `204` tanpa body.

Error:
```json
{
  "sukses": false,
  "error": {
    "kode": "VALIDATION_ERROR",
    "pesan": "Validasi gagal",
    "detail": [{ "field": "email", "pesan": "Format email tidak valid" }]
  },
  "requestId": "7068b5c7-e145-41ed-8a43-d5a2cd2e9d0e"
}
```

- `kode` stabil dan dipakai kode frontend untuk mengambil keputusan (misal `TOKEN_EXPIRED` memicu refresh token).
- `pesan` dibaca manusia dan boleh berubah redaksinya.
- `detail` opsional, hanya ada pada validasi (per field).
- `requestId` dikirim user ke developer saat melapor error, sama dengan header `X-Request-Id`.

## Dokumentasi

- [docs/api-conventions.md](docs/api-conventions.md): konvensi API tim
- [docs/endpoint-audit.md](docs/endpoint-audit.md): audit endpoint, riwayat perubahan, dan masalah desain yang diketahui
- [docs/error-codes.md](docs/error-codes.md): daftar kode error beserta contoh response
- [docs/uji-skenario.md](docs/uji-skenario.md): hasil uji 14 skenario

## Catatan: Apa itu ORM?

ORM (Object-Relational Mapping) adalah cara menghubungkan kode program (object/class) dengan tabel di database, tanpa harus menulis query SQL manual satu-satu.

Tanpa ORM, setiap kali ambil atau simpan data, saya harus menulis SQL seperti:
```sql
SELECT * FROM peserta WHERE id = 1;
```

Dengan ORM (TypeORM), cukup menulis kode TypeScript biasa:
```typescript
await pesertaRepository.findOneBy({ id: 1 });
```
ORM yang akan menerjemahkan kode itu menjadi SQL di belakang layar.

**Kenapa tidak menulis SQL manual saja?**
1. Lebih aman dari typo dan salah tipe data, karena TypeScript ikut mengecek strukturnya saat compile.
2. Mengurangi risiko SQL injection, karena ORM otomatis membersihkan nilai yang dimasukkan.
3. Kode jadi lebih konsisten dengan pola yang sudah dipakai sejak Minggu 5 dan 10 (Repository pattern), sehingga struktur project tidak berubah drastis walau sumber datanya berganti dari memori ke database sungguhan.
4. Perubahan struktur tabel bisa dicatat rapi lewat Migration, sehingga tim bisa kerja bareng di database yang sama tanpa saling menimpa perubahan orang lain.

## Catatan: Fungsi Tabel migrations

Tabel `migrations` adalah "buku catatan" milik TypeORM yang menyimpan daftar migration apa saja yang SUDAH pernah dijalankan ke database ini, lengkap dengan timestamp dan namanya.

Fungsinya:
1. Supaya TypeORM tahu migration mana yang sudah dijalankan dan mana yang belum, sehingga saat `migration:run` dipanggil, migration yang sudah ada di tabel ini TIDAK dijalankan ulang (mencegah error karena tabel/kolom sudah ada).
2. Menjadi acuan urutan untuk `migration:revert`. TypeORM tahu migration mana yang PALING TERAKHIR dijalankan, sehingga revert selalu membatalkan yang paling baru dulu, bukan sembarangan.
3. Kalau bekerja dalam tim, setiap anggota bisa menjalankan migration yang sama di database masing-masing, dan tabel ini memastikan semua orang "sinkron" mengenai versi skema database yang sedang dipakai.

## Catatan: Kenapa DELETE Harus Idempotent, dan Kenapa Tidak Boleh Hapus Lewat GET?

DELETE harus idempotent karena hasil akhirnya harus sama baik dipanggil satu kali maupun berkali-kali. Begitu `DELETE /peserta/1` dijalankan dan peserta itu terhapus, memanggilnya lagi seharusnya tidak menimbulkan efek tambahan (paling hanya mengembalikan 404 karena datanya sudah tidak ada, bukan menghapus sesuatu yang lain). Ini penting untuk keandalan: kalau koneksi putus dan client mengirim ulang request yang sama, sistem tidak akan rusak karena perintah dijalankan dua kali. Keputusan tim: DELETE untuk data yang sudah tidak ada mengembalikan 404.

GET tidak boleh dipakai untuk menghapus data karena GET harus bersifat safe, artinya tidak mengubah apa pun di server. Browser, crawler mesin pencari, dan fitur prefetch semuanya mengasumsikan GET aman dipanggil kapan saja tanpa izin eksplisit dari pengguna. Kalau ada endpoint seperti `GET /peserta/1/hapus`, sebuah link yang di-prefetch otomatis oleh browser bisa menghapus data sungguhan tanpa ada yang benar-benar menekan tombol apa pun. Ini pelanggaran serius terhadap asumsi dasar HTTP.