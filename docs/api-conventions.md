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
| 400 | INVALID_JSON | Request tidak bisa dipahami (JSON rusak) |
| 401 | UNAUTHORIZED / TOKEN_EXPIRED / INVALID_TOKEN | Belum login, token kedaluwarsa, atau token rusak |
| 403 | FORBIDDEN | Sudah login tapi tidak berhak (role atau kepemilikan data) |
| 404 | NOT_FOUND | Data atau route tidak ada |
| 409 | CONFLICT | Bentrok dengan data yang ada (email duplikat, data masih dipakai relasi lain) |
| 422 | VALIDATION_ERROR | Request dipahami tapi isinya melanggar aturan, dengan detail per field |
| 429 | RATE_LIMITED | Terlalu banyak percobaan login gagal |
| 500 | INTERNAL_ERROR | Bug di server |
| 503 | - | Hanya dari `/health/ready` saat database mati |

401 berarti "aku tidak tahu kamu siapa". 403 berarti "aku tahu kamu siapa, tapi kamu tidak boleh".

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
- Nilai parameter yang tidak valid dikoreksi otomatis, bukan ditolak. Halaman di luar jangkauan mengembalikan `data: []` dengan status 200.

## 6. Keamanan
- Password tidak pernah dikirim ke client dan tidak pernah dicatat di log. Kolom `password` memakai `select: false`.
- Field yang boleh diubah dipilih eksplisit (whitelist), tidak pernah menyalin `req.body` langsung ke entity. Nilai seperti `role`, `password`, `status`, `pesertaId`, dan `statusReview` tidak bisa diubah lewat endpoint umum.
- `pesertaId` pada jurnal selalu diambil dari token, bukan dari body.
- Error database dan stack trace tidak dikirim ke client di production.
- `sortBy` dan filter memakai whitelist, dan karakter wildcard `%` dan `_` pada pencarian di-escape.

## 7. Penamaan
- Bahasa Indonesia untuk field dan pesan.
- camelCase untuk nama field JSON.
- Kode error memakai UPPER_SNAKE_CASE.

## 8. Operasional
- Setiap request punya `requestId` (UUID) di header, body error, dan log.
- Log berbentuk JSON satu baris. 5xx dicatat `error`, 4xx dicatat `warn`.
- `/api/v1/health` (liveness) dan `/api/v1/health/ready` (readiness, 503 jika database mati).
- Server mati dengan rapi saat menerima SIGTERM atau SIGINT.
- Rate limit hanya pada `POST /auth/login`: 10 percobaan gagal per IP per 15 menit.