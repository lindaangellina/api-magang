# API Magang Batch 4

API untuk mengelola data peserta magang dan jurnal harian, dibangun dengan Express + TypeScript, terhubung ke database PostgreSQL lewat TypeORM.

## Menjalankan Project

\`\`\`bash
npm install
npm run dev
\`\`\`

Pastikan PostgreSQL sudah jalan dan database `magang_db` sudah dibuat sebelum menjalankan project (lihat bagian Database di bawah).

Server berjalan di `http://localhost:3000` (atau sesuai `PORT` di `.env`).

## Environment Variables

Salin `.env.example` menjadi `.env`, lalu isi:

\`\`\`
NODE_ENV=development
PORT=3000
APP_NAME=API Magang Batch 4
API_KEY=
DB_HOST=localhost
DB_PORT=5432
DB_NAME=magang_db
DB_USER=postgres
DB_PASSWORD=
\`\`\`

## Database

Buat database terlebih dahulu lewat `psql`:

\`\`\`sql
CREATE DATABASE magang_db;
\`\`\`

Project ini menggunakan `synchronize: false` — semua perubahan struktur tabel (skema) dilakukan lewat Migration, bukan otomatis. Migration harus dijalankan setelah database dibuat (lihat langkah "Setup Database dari Nol" di bawah).

## Setup Database dari Nol

Langkah lengkap menyiapkan database setelah clone repo (misal di komputer baru atau anggota tim baru):

1. **Clone repo dan install dependencies**
   \`\`\`bash
   git clone <url-repo>
   cd api-magang
   npm install
   \`\`\`

2. **Siapkan file `.env`**
   Salin `.env.example` menjadi `.env`, lalu isi kredensial database sesuai PostgreSQL di komputer masing-masing.

3. **Buat database kosong**
   \`\`\`bash
   psql -U postgres
   CREATE DATABASE magang_db;
   \q
   \`\`\`

4. **Jalankan semua migration**
   \`\`\`bash
   npm run migration:run
   \`\`\`
   Ini otomatis membuat seluruh tabel (`peserta`, `jurnal_harian`, `mentor`, `skill`, `peserta_skill`) beserta relasi dan foreign key-nya, sesuai urutan migration yang sudah dibuat — tanpa perlu `synchronize: true`.

5. **Jalankan server**
   \`\`\`bash
   npm run dev
   \`\`\`
   Jika berhasil, muncul log `Database terhubung` dan `Server berjalan di http://localhost:3000`.

6. **Verifikasi data persisten**
   \`\`\`bash
   curl http://localhost:3000/api/peserta
   \`\`\`
   Data akan tetap tersimpan meskipun server atau PostgreSQL di-restart, karena semua data ada di database — berbeda dari Minggu 9-10 yang datanya disimpan di array memori dan hilang setiap restart.

### Perintah migration yang sering dipakai
- `npm run migration:run` — jalankan migration yang belum dieksekusi
- `npm run migration:revert` — batalkan migration terakhir yang dijalankan
- `npm run migration:generate -- src/migrations/NamaMigration` — buat migration baru setelah entity diubah

## Daftar Endpoint

### Peserta

| Method | Endpoint | Keterangan |
|---|---|---|
| GET | /api/peserta | Semua peserta, filter `?sekolah=&fase=&limit=` |
| GET | /api/peserta/:id | Detail satu peserta |
| POST | /api/peserta | Tambah peserta baru |
| PUT | /api/peserta/:id | Update peserta |
| DELETE | /api/peserta/:id | Hapus peserta (perlu header `x-api-key`) |
| GET | /api/peserta/:id/jurnal | Semua jurnal milik peserta tertentu (relasi One-to-Many) |

### Jurnal

| Method | Endpoint | Keterangan |
|---|---|---|
| GET | /api/jurnal | Semua jurnal, filter `?peserta=&status=` |
| GET | /api/jurnal/:id | Detail satu jurnal |
| POST | /api/jurnal | Tambah jurnal baru |
| PUT | /api/jurnal/:id | Update jurnal |
| PATCH | /api/jurnal/:id/review | Ubah status review, body `{"statusReview": "sudah"}` |
| DELETE | /api/jurnal/:id | Hapus jurnal (perlu header `x-api-key`) |

### Statistik

| Method | Endpoint | Keterangan |
|---|---|---|
| GET | /api/stats | Total peserta, total jurnal, jurnal belum direview, rata-rata jurnal per peserta, jumlah jurnal per peserta (QueryBuilder + GROUP BY), skill terpopuler (relasi Many-to-Many) |

## Contoh Request

\`\`\`bash
curl -X POST http://localhost:3000/api/peserta \\
  -H "Content-Type: application/json" \\
  -d '{"nama":"Rani","sekolah":"SMK1","email":"rani@mail.com","fase":1}'
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

## Catatan: Apa itu ORM?

ORM (Object-Relational Mapping) adalah cara menghubungkan kode program (object/class) dengan tabel di database, tanpa harus menulis query SQL manual satu-satu.

Tanpa ORM, setiap kali ambil atau simpan data, saya harus menulis SQL seperti:
\`\`\`sql
SELECT * FROM peserta WHERE id = 1;
\`\`\`

Dengan ORM (TypeORM), cukup menulis kode TypeScript biasa:
\`\`\`typescript
await pesertaRepository.findOneBy({ id: 1 });
\`\`\`
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
2. Menjadi acuan urutan untuk `migration:revert` — TypeORM tahu migration mana yang PALING TERAKHIR dijalankan, sehingga revert selalu membatalkan yang paling baru dulu, bukan sembarangan.
3. Kalau bekerja dalam tim, setiap anggota bisa menjalankan migration yang sama di database masing-masing, dan tabel ini memastikan semua orang "sinkron" mengenai versi skema database yang sedang dipakai.