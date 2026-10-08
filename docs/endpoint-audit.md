# Endpoint Audit — Minggu 10-12

Audit seluruh endpoint yang ada sebelum refactor Minggu 13.

| Method | Path | Perlu Login? | Role | Masalah Desain (jika ada) |
|---|---|---|---|---|
| GET | /api/peserta | Tidak | - | - |
| GET | /api/peserta/:id | Tidak | - | - |
| POST | /api/peserta | Tidak | - | - |
| PUT | /api/peserta/:id | Ya | peserta/mentor | - |
| DELETE | /api/peserta/:id | Ya | mentor | - |
| GET | /api/peserta/:id/jurnal | Tidak | - | - |
| GET | /api/peserta/profil-saya | Ya | peserta/mentor | Melanggar aturan bahasa konsisten — dipindah ke `/api/me` |
| GET | /api/jurnal | Ya | mentor | - |
| GET | /api/jurnal/saya | Ya | peserta/mentor | Melanggar aturan bahasa konsisten — dipindah ke `/api/me/jurnal` |
| GET | /api/jurnal/:id | Tidak | - | - |
| POST | /api/jurnal | Ya | peserta/mentor | - |
| PUT | /api/jurnal/:id | Ya | peserta/mentor | - |
| PATCH | /api/jurnal/:id/review | Ya | mentor | - |
| DELETE | /api/jurnal/:id | **Tidak (sebelum diperbaiki)** | - | **Celah keamanan: siapapun tanpa login bisa menghapus jurnal siapa saja. Sudah ditambahkan `authGuard`.** |
| GET | /api/stats | Tidak | - | - |
| POST | /api/auth/register | Tidak | - | - |
| POST | /api/auth/login | Tidak | - | - |
| POST | /api/auth/refresh | Tidak | - | - |
| POST | /api/auth/logout | Tidak | - | - |

## Perubahan Setelah Refactor Minggu 13

- `GET /api/peserta/profil-saya` → `GET /api/me`
- `GET /api/jurnal/saya` → `GET /api/me/jurnal`
- `DELETE /api/jurnal/:id` sekarang wajib login (`authGuard`) — sebelumnya bisa diakses siapa saja tanpa token.
- `requireRole` sebelumnya melempar 401 Unauthorized saat role tidak sesuai, sekarang dikoreksi menjadi 403 Forbidden (user sudah dikenali lewat token, hanya tidak punya hak akses).
- Ownership check di `updateJurnal` (peserta mencoba edit jurnal milik orang lain) juga dikoreksi dari 401 menjadi 403, dengan alasan yang sama.
- Format error diseragamkan: `{ sukses: false, error: { kode, pesan, detail? }, requestId }`. Daftar kode ada di `docs/error-codes.md`.
- Kegagalan validasi sekarang mengembalikan 422 dengan `detail` per field (`{ field, pesan }`), sebelumnya 400 dengan array string.
- Error PostgreSQL, JWT, dan JSON rusak diterjemahkan menjadi `AppError` yang sesuai, tidak lagi menjadi 500.
- `authGuard` tidak lagi menangkap error JWT sendiri, supaya `TOKEN_EXPIRED` dan `INVALID_TOKEN` bisa dibedakan oleh `errorHandler`.
- Rate limiter memakai format error yang sama (`RATE_LIMITED`, 429) beserta header `Retry-After`.

## Status Code — 10 Skenario

| # | Skenario | Status Code | Alasan |
|---|---|---|---|
| a | Register berhasil | 201 Created | Data baru berhasil dibuat |
| b | Register dengan email yang sudah ada | 409 Conflict (`CONFLICT`) | Bentrok dengan data yang sudah ada |
| c | Login dengan password salah | 401 Unauthorized (`UNAUTHORIZED`) | Identitas tidak bisa diverifikasi (belum "dikenali" sistem) |
| d | Akses /me tanpa token | 401 Unauthorized (`UNAUTHORIZED`) | Sistem tidak tahu siapa yang mengakses |
| e | Peserta mencoba PATCH /jurnal/5/review (khusus mentor) | 403 Forbidden (`FORBIDDEN`) | Sistem tahu siapa dia (sudah login), tapi perannya tidak berhak |
| f | GET /peserta/9999 (tidak ada) | 404 Not Found (`NOT_FOUND`) | Resource dengan id tersebut tidak ditemukan |
| g | DELETE /peserta/1 berhasil | 204 No Content | Berhasil, tidak ada isi yang perlu dikembalikan |
| h | POST /peserta dengan body JSON yang rusak | 400 Bad Request (`INVALID_JSON`) | Request tidak bisa dipahami (JSON tidak valid) |
| i | POST /peserta dengan email format salah | 422 Unprocessable Entity (`VALIDATION_ERROR`) | Request bisa dipahami, tapi melanggar aturan validasi. Sudah diverifikasi lewat curl: detail berisi array `{ field, pesan }` |
| j | Database mati saat request masuk | 503 Service Unavailable | Dependensi (database) tidak tersedia, bukan bug di kode. Belum ditangani khusus, saat ini masih jatuh ke 500 `INTERNAL_ERROR` |

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

## Uji Kasus Tepi (Soal 5, Minggu 13 Selasa)

Semua diuji di endpoint `GET /api/peserta`.

| Kasus | Hasil | Keterangan |
|---|---|---|
| `?page=0` | 200 OK, `meta.page: 1` | Dibenerin otomatis ke minimal 1 |
| `?page=-5` | 200 OK, `meta.page: 1` | Dibenerin otomatis ke minimal 1 |
| `?page=abc` | 200 OK, `meta.page: 1` | `parseInt` gagal → fallback ke default |
| `?limit=1000` | 200 OK, `meta.limit: 100` | Dibatasi ke cap maksimal 100 |
| `?limit=0` | 200 OK, `meta.limit: 10` | Dibenerin otomatis ke minimal 1, fallback ke default 10 |
| `?limit=abc` | 200 OK, `meta.limit: 10` | `parseInt` gagal → fallback ke default |
| `?sortBy=password` | 200 OK, urutan default (createdAt) | Ditolak whitelist, fallback ke default, password tidak bocor lewat urutan |
| `?sortBy=nama;DROP TABLE peserta` | 200 OK, urutan default, tabel tetap utuh | Percobaan SQL injection gagal total — whitelist menolak nilai yang tidak dikenal |
| `?q=%` | 200 OK, `total: 0` | Wildcard `%` di-escape, dicari sebagai karakter literal, tidak mengembalikan semua data |
| `?q=_` | 200 OK, `total: 0` | Wildcard `_` di-escape, sama seperti di atas |
| `?q=` (kosong) | 200 OK, semua data normal | String kosong dianggap "tidak ada pencarian" |

Semua kasus ditangani tanpa crash (tidak ada 500), tanpa bocor data sensitif, dan tanpa mengubah/merusak data di database.

## Soal 6 (Bonus) — Uji Pagination dengan 50 Data Dummy

Seed 50 peserta dummy dijalankan lewat `src/scripts/seed-peserta.ts`, menambah total peserta dari 7 menjadi 57.

| Kasus | Hasil |
|---|---|
| `?page=6&limit=10` (halaman terakhir) | 200 OK, 7 data tersisa, `total: 57`, `totalPages: 6`, `hasNext: false`, `hasPrev: true` |
| `?page=7&limit=10` (satu halaman di luar batas) | 200 OK, `data: []`, meta tetap konsisten menunjukkan total dan totalPages yang benar |

Kedua kasus ditangani tanpa error, membuktikan `skip`/`take` di TypeORM aman dipakai meski halaman yang diminta melebihi jumlah data yang tersedia.