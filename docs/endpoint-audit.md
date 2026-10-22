# Endpoint Audit

Dokumen ini berisi audit endpoint versi akhir (setelah refactor Minggu 13), riwayat perubahan, masalah desain yang masih diketahui, serta hasil pengujian. Audit awal sebelum refactor tetap disimpan di bagian bawah.

## Audit Versi Akhir

Semua path diawali `/api/v1`. Kolom "Error" memuat status error yang mungkin muncul menurut kode.

| Method | Path | Login? | Role | Sukses | Error | Test |
|---|---|---|---|---|---|---|
| POST | /auth/register | Tidak | - | 201 + Location | 409, 422 | ✅ 201, 409, 422 |
| POST | /auth/login | Tidak | - | 200 | 401, 422, 429 | ✅ 200, 401, 429 |
| POST | /auth/refresh | Tidak (refreshToken di body) | - | 200 | 401, 422 | ✅ 200, 422 |
| POST | /auth/logout | Tidak (refreshToken di body) | - | 200 | 422 | ✅ 200 |
| GET | /me | Ya | peserta, mentor | 200 | 401, 404 | ✅ 200, 401 (3 jenis) |
| PATCH | /me | Ya | peserta, mentor | 200 | 401, 404, 422 | ✅ 422 mass assignment |
| GET | /me/jurnal | Ya | peserta, mentor | 200 | 401 | ✅ 200 |
| GET | /peserta | Tidak | - | 200 | 422 | ✅ 200, 422 |
| GET | /peserta/:id | Tidak | - | 200 | 404, 422 | ✅ 200, 422 |
| POST | /peserta | Tidak | - | 201 + Location | 409, 422 | ✅ 201 |
| PATCH | /peserta/:id | Ya | peserta (hanya dirinya), mentor (semua) | 200 | 401, 403, 404, 422 | ✅ 200, 403 |
| DELETE | /peserta/:id | Ya | mentor | 204 | 401, 403, 404, 409, 422 | ✅ 204, 403, 404 |
| GET | /peserta/:id/jurnal | Tidak | - | 200 | 404, 422 | ✅ 200 |
| GET | /jurnal | Ya | mentor | 200 | 401, 403, 422 | ✅ 200, 403, 422 |
| GET | /jurnal/:id | Tidak | - | 200 | 404, 422 | ✅ 200, 404 |
| POST | /jurnal | Ya | peserta, mentor | 201 + Location | 401, 422 | ✅ 201, 401, 422 |
| PUT | /jurnal/:id | Ya | pemilik jurnal, mentor | 200 | 401, 403, 404, 422 | ✅ 200, 403 |
| PATCH | /jurnal/:id/review | Ya | mentor | 200 | 401, 403, 404, 422 | ✅ 200, 403, 422 |
| DELETE | /jurnal/:id | Ya | pemilik jurnal, mentor | 204 | 401, 403, 404, 422 | ✅ 204 |
| GET | /stats | Tidak | - | 200 | - | 🔴 BELUM ADA TEST |
| GET | /health | Tidak | - | 200 | - | ✅ 200 |
| GET | /health/ready | Tidak | - | 200 | 503 | 🔴 BELUM ADA TEST (butuh database, Jumat) |

Setiap endpoint yang menerima body juga bisa menghasilkan 413 `PAYLOAD_TOO_LARGE` (body lebih dari 1 MB) dan 400 `INVALID_JSON` (JSON rusak).

## Audit Input: DTO per Endpoint (Minggu 14, Jumat)

Setiap endpoint yang menerima input harus lewat DTO. Tanda `-` berarti endpoint tidak menerima input di bagian itu.

| Method | Path | Body | Query | Params |
|---|---|---|---|---|
| POST | /auth/register | `RegisterDto` | - | - |
| POST | /auth/login | `LoginDto` | - | - |
| POST | /auth/refresh | `RefreshTokenDto` | - | - |
| POST | /auth/logout | `RefreshTokenDto` | - | - |
| GET | /me | - | - | - |
| PATCH | /me | `UpdateProfilDto` | - | - |
| GET | /me/jurnal | - | - | - (`pesertaId` dari token) |
| GET | /peserta | - | `ListPesertaQueryDto` | - |
| GET | /peserta/:id | - | - | `IdParamDto` |
| POST | /peserta | `CreatePesertaDto` | - | - |
| PATCH | /peserta/:id | `UpdateProfilDto` | - | `IdParamDto` |
| DELETE | /peserta/:id | - | - | `IdParamDto` |
| GET | /peserta/:id/jurnal | - | - | `IdParamDto` |
| GET | /jurnal | - | `ListJurnalQueryDto` | - |
| GET | /jurnal/:id | - | - | `IdParamDto` |
| POST | /jurnal | `CreateJurnalDto` (+ `LampiranDto`) | - | - |
| PUT | /jurnal/:id | `UpdateJurnalDto` | - | `IdParamDto` |
| PATCH | /jurnal/:id/review | `ReviewJurnalDto` | - | `IdParamDto` |
| DELETE | /jurnal/:id | - | - | `IdParamDto` |
| GET | /stats | - | - | - |
| GET | /health, /health/ready | - | - | - |

Validasi manual lama (`validasiPeserta`, `validasiUbahProfil`, `validasiJurnal`, `validasiRefreshToken`) dan `parseListQuery` sudah dihapus. `tanpaPassword` masih dipakai `auth.service.ts` sebagai lapis tambahan, sedangkan response ke client tetap lewat Response DTO.

## Perubahan Minggu 13

**Senin (desain REST)**
- Rename endpoint: `/peserta/profil-saya` menjadi `/me`, `/jurnal/saya` menjadi `/me/jurnal`.
- `DELETE /jurnal/:id` diberi `authGuard`. Sebelumnya siapa pun tanpa token bisa menghapus jurnal.
- `requireRole` dan ownership check di `updateJurnal` dikoreksi dari 401 menjadi 403, karena user sudah dikenali lewat token tapi tidak berhak.

**Selasa (daftar data dan keamanan input)**
- Pagination, filter, sorting dengan whitelist, dan pencarian dengan escape wildcard pada `/peserta` dan `/jurnal`.
- Kolom `password` memakai `select: false`, login memakai `addSelect`.

**Rabu (format error)**
- Format error diseragamkan: `{ sukses: false, error: { kode, pesan, detail? }, requestId }`. Daftar kode ada di `docs/error-codes.md`.
- Validasi sekarang 422 dengan `detail` per field (`{ field, pesan }`), sebelumnya 400 dengan array string.
- Error PostgreSQL, JWT, dan JSON rusak diterjemahkan menjadi kode yang sesuai, tidak lagi menjadi 500.
- `authGuard` tidak lagi menangkap error JWT sendiri, sehingga `TOKEN_EXPIRED` dan `INVALID_TOKEN` bisa dibedakan.

**Kamis (operasional)**
- Request ID (UUID) di header, body error, dan setiap log. Log berbentuk JSON.
- Graceful shutdown, health check `/health` dan `/health/ready`, helmet, CORS, dan batas ukuran body.
- Rate limit global diganti rate limit khusus `POST /auth/login` (10 percobaan gagal per IP per 15 menit).

**Jumat (kontrak API)**
- Semua route dipindah ke `/api/v1`, termasuk health check.
- `PUT /peserta/:id` diganti `PATCH /peserta/:id`, ditambah `PATCH /me`, keduanya dengan whitelist field (`nama`, `sekolah`, `telepon`).
- Mass assignment ditutup pada `POST /peserta`, `POST /jurnal`, dan `PUT /jurnal/:id`. `pesertaId` jurnal diambil dari token, bukan dari body.
- `DELETE /jurnal/:id` diberi pengecekan kepemilikan. Sebelumnya semua user yang login bisa menghapus jurnal siapa pun.
- `POST` yang membuat data menyertakan header `Location`, `DELETE` mengembalikan 204.
- `refresh` dan `logout` kini memvalidasi `refreshToken` di body.

## Perubahan Minggu 14 (Validasi Input dan DTO)

- Semua input divalidasi lewat DTO (`class-validator` + `class-transformer`) dengan middleware `validasi(Dto, sumber)`. Properti asing di body ditolak 422, dan hasil validasi dibaca controller lewat `ambilDto`.
- Aturan status berubah: semua kegagalan validasi DTO (body, query, params) adalah 422. 400 hanya untuk JSON rusak.
- Parameter list (`page`, `limit`, `sortBy`, `order`) yang tidak valid ditolak 422, tidak lagi dikoreksi diam-diam.
- Response peserta dan jurnal lewat Response DTO (`@Expose` sebagai whitelist).
- Jurnal mendapat kolom `catatanMentor` dan `lampiran` (jsonb). Review memakai validasi bersyarat.
- Jumat: tambalan 413 `PAYLOAD_TOO_LARGE`, batas `Max` pada id dan `page`, batas `MaxLength` yang masih kurang, dan DTO untuk `POST /peserta`, refresh, dan logout.

## Masalah Desain yang Diketahui

| Endpoint | Masalah | Status |
|---|---|---|
| POST /peserta | Publik dan membuat akun tanpa password (tidak bisa dipakai login). Jalur pendaftaran yang benar adalah `/auth/register`. Sejak Minggu 14 inputnya divalidasi `CreatePesertaDto` | Tetap publik, perlu keputusan mentor |
| GET /peserta, GET /peserta/:id | Publik, response memuat email dan telepon seluruh peserta | Belum diubah, perlu keputusan mentor |
| GET /jurnal/:id, GET /peserta/:id/jurnal | Publik, isi jurnal (kegiatan, hambatan, link commit) milik siapa pun bisa dibaca tanpa login | Belum diubah, perlu keputusan mentor |
| PATCH /jurnal/:id/review | Nilai `statusReview` tidak divalidasi di middleware, nilai salah jadi 400 dari database | Selesai Minggu 14: `ReviewJurnalDto`, nilai salah 422 |
| Semua route dengan `:id` | Parameter `:id` yang bukan angka tidak divalidasi dan diteruskan ke database | Selesai Minggu 14: `IdParamDto`, `/peserta/abc` dan id di luar batas integer menjadi 422 |
| PUT /jurnal/:id | Memakai PUT sementara endpoint peserta memakai PATCH. Sejak Minggu 14 semua field opsional (minimal satu), jadi perilakunya mirip PATCH | Dibiarkan |
| Semua endpoint dengan body | Body lebih dari 1 MB menghasilkan 500 `INTERNAL_ERROR` karena error `entity.too.large` belum diterjemahkan | Selesai Minggu 14: 413 `PAYLOAD_TOO_LARGE` |
| Semua endpoint saat database mati | Hanya `/health/ready` yang mengembalikan 503. Endpoint biasa belum diuji, menurut kode `errorHandler` kemungkinan jatuh ke 500 `INTERNAL_ERROR` | Belum diuji |

## Audit Awal (Sebelum Refactor, Minggu 10-12)

Audit seluruh endpoint sebelum refactor Minggu 13. Path pada bagian ini dan bagian di bawahnya ditulis sebelum versioning, sekarang semuanya berada di bawah `/api/v1`.

| Method | Path | Perlu Login? | Role | Masalah Desain (jika ada) |
|---|---|---|---|---|
| GET | /api/peserta | Tidak | - | - |
| GET | /api/peserta/:id | Tidak | - | - |
| POST | /api/peserta | Tidak | - | - |
| PUT | /api/peserta/:id | Ya | peserta/mentor | - |
| DELETE | /api/peserta/:id | Ya | mentor | - |
| GET | /api/peserta/:id/jurnal | Tidak | - | - |
| GET | /api/peserta/profil-saya | Ya | peserta/mentor | Melanggar aturan bahasa konsisten, dipindah ke `/api/me` |
| GET | /api/jurnal | Ya | mentor | - |
| GET | /api/jurnal/saya | Ya | peserta/mentor | Melanggar aturan bahasa konsisten, dipindah ke `/api/me/jurnal` |
| GET | /api/jurnal/:id | Tidak | - | - |
| POST | /api/jurnal | Ya | peserta/mentor | - |
| PUT | /api/jurnal/:id | Ya | peserta/mentor | - |
| PATCH | /api/jurnal/:id/review | Ya | mentor | - |
| DELETE | /api/jurnal/:id | **Tidak (sebelum diperbaiki)** | - | **Celah keamanan: siapa pun tanpa login bisa menghapus jurnal siapa saja. Sudah ditambahkan `authGuard`.** |
| GET | /api/stats | Tidak | - | - |
| POST | /api/auth/register | Tidak | - | - |
| POST | /api/auth/login | Tidak | - | - |
| POST | /api/auth/refresh | Tidak | - | - |
| POST | /api/auth/logout | Tidak | - | - |

## Status Code, 10 Skenario

| # | Skenario | Status Code | Alasan |
|---|---|---|---|
| a | Register berhasil | 201 Created | Data baru berhasil dibuat |
| b | Register dengan email yang sudah ada | 409 Conflict (`CONFLICT`) | Bentrok dengan data yang sudah ada |
| c | Login dengan password salah | 401 Unauthorized (`UNAUTHORIZED`) | Identitas tidak bisa diverifikasi |
| d | Akses /me tanpa token | 401 Unauthorized (`UNAUTHORIZED`) | Sistem tidak tahu siapa yang mengakses |
| e | Peserta mencoba PATCH /jurnal/5/review (khusus mentor) | 403 Forbidden (`FORBIDDEN`) | Sistem tahu siapa dia (sudah login), tapi perannya tidak berhak |
| f | GET /peserta/9999 (tidak ada) | 404 Not Found (`NOT_FOUND`) | Resource dengan id tersebut tidak ditemukan |
| g | DELETE /peserta/1 berhasil | 204 No Content | Berhasil, tidak ada isi yang perlu dikembalikan |
| h | POST /peserta dengan body JSON yang rusak | 400 Bad Request (`INVALID_JSON`) | Request tidak bisa dipahami |
| i | POST /peserta dengan email format salah | 422 Unprocessable Entity (`VALIDATION_ERROR`) | Request bisa dipahami, tapi melanggar aturan validasi. Diverifikasi lewat curl: detail berisi array `{ field, pesan }` |
| j | Database mati saat request masuk | 503 Service Unavailable | Dependensi tidak tersedia, bukan bug di kode. Baru terbukti pada `/health/ready`. Endpoint biasa belum diuji (lihat Masalah Desain yang Diketahui) |

## Uji Terjemahan Error (Rabu, diuji lewat curl)

| Skenario | Hasil |
|---|---|
| Register dengan email yang sudah ada | 409 `CONFLICT` |
| Hapus peserta yang masih punya jurnal | 409 `CONFLICT` (PostgreSQL 23503 diterjemahkan) |
| Body JSON rusak | 400 `INVALID_JSON` |
| Akses /me dengan token expired | 401 `TOKEN_EXPIRED` |
| Akses /me dengan token asal-asalan | 401 `INVALID_TOKEN` |
| Peserta mengakses endpoint khusus mentor | 403 `FORBIDDEN` |
| Route yang tidak ada | 404 `NOT_FOUND` |
| Error tak terduga dengan `NODE_ENV=production` | 500 `INTERNAL_ERROR`, tanpa field `debug` (stack trace dan pesan asli tidak bocor) |

Dengan `NODE_ENV=development`, response menyertakan field `debug` untuk membantu penelusuran.

## Uji Kasus Tepi (Selasa)

Semua diuji di endpoint `GET /api/peserta`.

| Kasus | Hasil | Keterangan |
|---|---|---|
| `?page=0` | 200 OK, `meta.page: 1` | Dikoreksi otomatis ke minimal 1 |
| `?page=-5` | 200 OK, `meta.page: 1` | Dikoreksi otomatis ke minimal 1 |
| `?page=abc` | 200 OK, `meta.page: 1` | `parseInt` gagal, fallback ke default |
| `?limit=1000` | 200 OK, `meta.limit: 100` | Dibatasi ke maksimal 100 |
| `?limit=0` | 200 OK, `meta.limit: 10` | Dikoreksi, fallback ke default 10 |
| `?limit=abc` | 200 OK, `meta.limit: 10` | `parseInt` gagal, fallback ke default |
| `?sortBy=password` | 200 OK, urutan default (createdAt) | Ditolak whitelist, password tidak bocor lewat urutan |
| `?sortBy=nama;DROP TABLE peserta` | 200 OK, urutan default, tabel tetap utuh | Percobaan SQL injection gagal, whitelist menolak nilai yang tidak dikenal |
| `?q=%` | 200 OK, `total: 0` | Wildcard `%` di-escape, dicari sebagai karakter literal |
| `?q=_` | 200 OK, `total: 0` | Wildcard `_` di-escape |
| `?q=` (kosong) | 200 OK, semua data | String kosong dianggap tidak ada pencarian |

Semua kasus ditangani tanpa crash (tidak ada 500), tanpa bocor data sensitif, dan tanpa merusak data di database.

## Uji Pagination dengan 50 Data Dummy (Selasa, bonus)

Seed 50 peserta dummy lewat `src/scripts/seed-peserta.ts`, total peserta menjadi 57.

| Kasus | Hasil |
|---|---|
| `?page=6&limit=10` (halaman terakhir) | 200 OK, 7 data tersisa, `total: 57`, `totalPages: 6`, `hasNext: false`, `hasPrev: true` |
| `?page=7&limit=10` (satu halaman di luar batas) | 200 OK, `data: []`, meta tetap konsisten |
### Keterangan kolom Test (Minggu 15, Kamis)

✅ = ada test HTTP (Supertest, service di-mock) di `tests/http/`; angka di sampingnya adalah status yang diuji. 🔴 = belum ada test. `GET /stats` belum diuji karena `statsService` belum dikontrakkan; `GET /health/ready` butuh database sungguhan, jadi diuji pada integration test Jumat. Status 409 pada `DELETE /peserta/:id` (peserta masih punya jurnal) berasal dari database, jadi juga menunggu Jumat.