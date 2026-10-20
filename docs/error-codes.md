# Kode Error API

Semua error memakai format yang sama:

```json
{
  "sukses": false,
  "error": {
    "kode": "VALIDATION_ERROR",
    "pesan": "Validasi gagal",
    "detail": [{ "field": "email", "pesan": "Format email tidak valid" }]
  },
  "requestId": "b7a1c9e2"
}
```

- `kode`: stabil, dipakai kode frontend untuk mengambil keputusan.
- `pesan`: dibaca manusia, boleh berubah redaksinya.
- `detail`: opsional, hanya ada pada validasi (per field). Field di dalam objek atau array memakai notasi titik, misalnya `lampiran.1.url`.
- `requestId`: dikirim user ke developer saat melapor error.
- `debug` (pesan asli dan stack trace) hanya muncul saat `NODE_ENV=development`, tidak pernah di production.

## Daftar Kode

| Kode | Status | Kapan terjadi |
|---|---|---|
| VALIDATION_ERROR | 422 | Format request benar, tapi isinya melanggar aturan DTO: email tidak valid, password kurang dari 8 karakter, properti yang tidak diizinkan, `id` bukan bilangan bulat, `page=0`, `sortBy` di luar whitelist. Berlaku untuk body, query string, dan route params. Juga 400 jika PostgreSQL menolak format nilai (kode 22P02) |
| INVALID_JSON | 400 | Body request bukan JSON yang valid. Satu-satunya kasus yang menghasilkan 400 dari lapisan validasi |
| PAYLOAD_TOO_LARGE | 413 | Body request lebih dari 1 MB (batas `express.json`). Kesalahan client, bukan bug server |
| UNAUTHORIZED | 401 | Token tidak ada, atau login gagal (email/password salah) |
| TOKEN_EXPIRED | 401 | Access/refresh token sudah kedaluwarsa. Client sebaiknya memanggil `/api/v1/auth/refresh` |
| INVALID_TOKEN | 401 | Token rusak atau tidak dikenali |
| FORBIDDEN | 403 | Sudah login, tapi role atau kepemilikan data tidak sesuai |
| NOT_FOUND | 404 | Data atau route tidak ditemukan |
| CONFLICT | 409 | Bentrok dengan data yang ada: email duplikat (23505), atau data masih dipakai relasi lain (23503) |
| RATE_LIMITED | 429 | Terlalu banyak percobaan login gagal dari satu IP (maksimal 10 per 15 menit). Header `Retry-After` memuat sisa detik tunggu |
| INTERNAL_ERROR | 500 | Bug di server atau error tak terduga. Detail teknis tidak dikirim ke client |

Catatan: daftar ini tumbuh seiring pengujian. Setiap jenis kegagalan baru yang ditemukan ditambahkan ke `terjemahkanError` (`src/middlewares/error.middleware.ts`) dan dicatat di sini. Kode `PAYLOAD_TOO_LARGE` lahir dari uji tembak Minggu 14: sebelum ditambal, body 2 MB menghasilkan 500.

## Kasus Baru Minggu 14

| Kasus | Status | Kode | Pesan atau detail |
|---|---|---|---|
| Properti yang tidak ada di DTO (misalnya `role` pada register atau `PATCH /me`) | 422 | VALIDATION_ERROR | `{ field: "role", pesan: "Properti ini tidak diizinkan" }` |
| `id` pada route bukan bilangan bulat positif (`/peserta/abc`, `/peserta/0`) | 422 | VALIDATION_ERROR | `id minimal 1`, `id harus berupa bilangan bulat` |
| `id` lebih besar dari batas integer (`/peserta/99999999999`) | 422 | VALIDATION_ERROR | `id terlalu besar` |
| Parameter list tidak valid (`page=0`, `limit=1000`, `sortBy=password`) | 422 | VALIDATION_ERROR | pesan per field, misalnya `page minimal 1` |
| Item dalam array salah (`lampiran[1].url`) | 422 | VALIDATION_ERROR | `{ field: "lampiran.1.url", pesan: "URL lampiran tidak valid" }` |
| `catatan` kosong saat `statusReview` = `sudah` | 422 | VALIDATION_ERROR | `Catatan wajib diisi saat jurnal ditandai sudah direview` |
| Body kosong pada `PATCH /me` atau `PUT /jurnal/:id` | 422 | VALIDATION_ERROR | `{ field: "body", pesan: "Minimal satu field harus diisi" }` |
| Body lebih dari 1 MB | 413 | PAYLOAD_TOO_LARGE | `Ukuran request terlalu besar` |

## Contoh Response

**VALIDATION_ERROR (422)**
```json
{
  "sukses": false,
  "error": {
    "kode": "VALIDATION_ERROR",
    "pesan": "Validasi gagal",
    "detail": [
      { "field": "email", "pesan": "Format email tidak valid" },
      { "field": "password", "pesan": "Password minimal 8 karakter" }
    ]
  },
  "requestId": "a1b2c3d4"
}
```

**VALIDATION_ERROR karena properti tidak diizinkan (422)**
```json
{
  "sukses": false,
  "error": {
    "kode": "VALIDATION_ERROR",
    "pesan": "Validasi gagal",
    "detail": [{ "field": "role", "pesan": "Properti ini tidak diizinkan" }]
  },
  "requestId": "a1b2c3d4"
}
```

**INVALID_JSON (400)**
```json
{
  "sukses": false,
  "error": { "kode": "INVALID_JSON", "pesan": "Format JSON pada body tidak valid" },
  "requestId": "a1b2c3d4"
}
```

**PAYLOAD_TOO_LARGE (413)**
```json
{
  "sukses": false,
  "error": { "kode": "PAYLOAD_TOO_LARGE", "pesan": "Ukuran request terlalu besar" },
  "requestId": "a1b2c3d4"
}
```

**UNAUTHORIZED (401)**
```json
{
  "sukses": false,
  "error": { "kode": "UNAUTHORIZED", "pesan": "Token tidak ditemukan" },
  "requestId": "a1b2c3d4"
}
```

**TOKEN_EXPIRED (401)**
```json
{
  "sukses": false,
  "error": { "kode": "TOKEN_EXPIRED", "pesan": "Token sudah kedaluwarsa" },
  "requestId": "a1b2c3d4"
}
```

**INVALID_TOKEN (401)**
```json
{
  "sukses": false,
  "error": { "kode": "INVALID_TOKEN", "pesan": "Token tidak valid" },
  "requestId": "a1b2c3d4"
}
```

**FORBIDDEN (403)**
```json
{
  "sukses": false,
  "error": { "kode": "FORBIDDEN", "pesan": "Aksi ini hanya untuk: mentor" },
  "requestId": "a1b2c3d4"
}
```

**NOT_FOUND (404)**
```json
{
  "sukses": false,
  "error": { "kode": "NOT_FOUND", "pesan": "Peserta tidak ditemukan" },
  "requestId": "a1b2c3d4"
}
```

**CONFLICT (409)**
```json
{
  "sukses": false,
  "error": { "kode": "CONFLICT", "pesan": "Email sudah terdaftar" },
  "requestId": "a1b2c3d4"
}
```

**INTERNAL_ERROR (500)**
```json
{
  "sukses": false,
  "error": { "kode": "INTERNAL_ERROR", "pesan": "Terjadi kesalahan di server" },
  "requestId": "a1b2c3d4"
}
```