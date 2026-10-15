# Konvensi API SiTrack

## 1. URL
- Kata benda jamak, huruf kecil, kebab-case, tanpa trailing slash.
- Semua route diawali prefix versi `/api/v1`. Perubahan yang mematahkan client (menghapus atau mengganti nama field, mengubah tipe data, mengubah arti status code, membuat field opsional jadi wajib) dirilis sebagai `/api/v2`. Menambah field, endpoint, atau query parameter opsional aman di versi yang sama.
- Endpoint milik user yang login memakai `/me` dan `/me/jurnal`.
- Nesting maksimal 2 level (contoh `/peserta/1/jurnal`).
- Route statis didaftarkan sebelum route dinamis.
- Aksi yang bukan CRUD hanya untuk autentikasi: `/auth/login`, `/auth/logout`, `/auth/refresh`.

## 2. Method dan status code

| Method | Sukses | Keterangan |
|---|---|---|
| GET | 200 | Membaca data, tidak mengubah apa pun (safe) |
| POST | 201 + header `Location` | Membuat data baru. Pengecualian: login, refresh, logout mengembalikan 200 |
| PATCH | 200 | Mengubah sebagian data, hanya field di whitelist |
| PUT | 200 | Dipakai pada `/jurnal/:id` (field `kegiatan` wajib dikirim) |
| DELETE | 204 tanpa body | Idempotent. Memanggil ulang untuk data yang sudah tidak ada mengembalikan 404 (keputusan tim) |

| Status | Kode | Arti |
|---|---|---|
| 400 | INVALID_JSON | Body tidak bisa di-parse sama sekali (JSON rusak). Hanya untuk kasus ini |
| 401 | UNAUTHORIZED / TOKEN_EXPIRED / INVALID_TOKEN | Belum login, token kedaluwarsa, atau token rusak |
| 403 | FORBIDDEN | Sudah login tapi tidak berhak (role atau kepemilikan data) |
| 404 | NOT_FOUND | Data atau route tidak ada |
| 409 | CONFLICT | Bentrok dengan data yang ada (email duplikat, data masih dipakai relasi lain) |
| 422 | VALIDATION_ERROR | Semua kegagalan validasi DTO, baik body, query string, maupun route params, dengan detail per field |
| 429 | RATE_LIMITED | Terlalu banyak percobaan login gagal |
| 500 | INTERNAL_ERROR | Bug di server |
| 503 | - | Hanya dari `/health/ready` saat database mati |

401 berarti "aku tidak tahu kamu siapa". 403 berarti "aku tahu kamu siapa, tapi kamu tidak boleh".

Revisi Minggu 14: sebelumnya `id` yang bukan angka (misalnya `/peserta/abc`) dihitung 400. Setelah ada DTO, aturannya disederhanakan: **semua kegagalan validasi DTO adalah 422**, termasuk `id` yang bukan bilangan bulat positif, `page=0`, dan `sortBy` di luar whitelist. **400 hanya untuk body yang tidak bisa di-parse sama sekali** (`INVALID_JSON`).

## 3. Format response sukses
`{ sukses: true, pesan, data, meta? }`. Field `meta` hanya ada pada endpoint daftar.

## 4. Format response error
`{ sukses: false, error: { kode, pesan, detail? }, requestId }`
- `kode` stabil, dipakai kode frontend untuk mengambil keputusan.
- `pesan` dibaca manusia dan boleh berubah redaksinya.
- `detail` hanya ada pada validasi, berbentuk array `{ field, pesan }`.
- `requestId` sama dengan header `X-Request-Id`.
- Field `debug` (pesan asli dan stack trace) hanya muncul saat `NODE_ENV=development`.

## 5. Endpoint daftar (list)
- Parameter: `page`, `limit` (maksimal 100), `sortBy` (whitelist), `order`, `q`.
- `meta`: `page`, `limit`, `total`, `totalPages`, `hasNext`, `hasPrev`.
- Nilai parameter yang tidak valid **ditolak dengan 422** dan pesan per field (misalnya `page=0` menghasilkan "page minimal 1"). Tidak ada lagi koreksi diam-diam, supaya kesalahan di sisi client langsung ketahuan. `q` yang hanya berisi spasi dipangkas menjadi kosong dan dianggap tanpa pencarian.
- Halaman di luar jangkauan mengembalikan `data: []` dengan status 200.

## 6. Keamanan
- Password tidak pernah dikirim ke client dan tidak pernah dicatat di log. Kolom `password` memakai `select: false`.
- Field yang boleh diubah dipilih eksplisit (whitelist), tidak pernah menyalin `req.body` langsung ke entity. Pada endpoint yang sudah memakai DTO, properti di luar DTO ditolak dengan 422. Nilai seperti `role`, `password`, `status`, `pesertaId`, dan `statusReview` tidak bisa diubah lewat endpoint umum.
- `pesertaId` pada jurnal selalu diambil dari token, bukan dari body.
- Error validasi tidak pernah menyertakan nilai input (opsi `value: false`), supaya password tidak bocor lewat response atau log.
- Error database dan stack trace tidak dikirim ke client di production.
- `sortBy` dan filter memakai whitelist, dan karakter wildcard `%` dan `_` pada pencarian di-escape.

## 7. Validasi dan sanitasi input
- Validasi memakai DTO (`class-validator`) lewat middleware `validasi(Dto, sumber)`. Hasilnya dibaca controller dengan `ambilDto`, bukan `req.body`, `req.query`, atau `req.params` mentah.
- Sanitasi dijalankan sebelum validasi: teks di-trim, email diubah ke huruf kecil, dan teks pada query string/params diubah ke tipe aslinya (angka, boolean).
- Boolean dari query string memakai `@KeBoolean()`, bukan `@Type(() => Boolean)`, karena `Boolean("false")` bernilai `true`.
- Urutan middleware: rate limit, authGuard, requireRole, validasi, controller.
- Setiap properti DTO wajib punya minimal satu decorator. Properti tanpa decorator dianggap tidak dikenal.

## 8. Penamaan
- Bahasa Indonesia untuk field dan pesan.
- camelCase untuk nama field JSON.
- Kode error memakai UPPER_SNAKE_CASE.

## 9. Operasional
- Setiap request punya `requestId` (UUID) di header, body error, dan log.
- Log berbentuk JSON satu baris. 5xx dicatat `error`, 4xx dicatat `warn`.
- `/api/v1/health` (liveness) dan `/api/v1/health/ready` (readiness, 503 jika database mati).
- Server mati dengan rapi saat menerima SIGTERM atau SIGINT.
- Rate limit hanya pada `POST /auth/login`: 10 percobaan gagal per IP per 15 menit.