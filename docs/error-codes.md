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
- `detail`: opsional, hanya ada pada validasi (per field).
- `requestId`: dikirim user ke developer saat melapor error.
- `debug` (pesan asli dan stack trace) hanya muncul saat `NODE_ENV=development`, tidak pernah di production.

## Daftar Kode

| Kode | Status | Kapan terjadi |
|---|---|---|
| VALIDATION_ERROR | 422 | Format request benar, tapi isinya melanggar aturan (email tidak valid, password kurang dari 8 karakter). Juga 400 jika PostgreSQL menolak format nilai (kode 22P02) |
| INVALID_JSON | 400 | Body request bukan JSON yang valid |
| UNAUTHORIZED | 401 | Token tidak ada, atau login gagal (email/password salah) |
| TOKEN_EXPIRED | 401 | Access/refresh token sudah kedaluwarsa. Client sebaiknya memanggil `/api/auth/refresh` |
| INVALID_TOKEN | 401 | Token rusak atau tidak dikenali |
| FORBIDDEN | 403 | Sudah login, tapi role atau kepemilikan data tidak sesuai |
| NOT_FOUND | 404 | Data atau route tidak ditemukan |
| CONFLICT | 409 | Bentrok dengan data yang ada: email duplikat (23505), atau data masih dipakai relasi lain (23503) |
| RATE_LIMITED | 429 | Terlalu banyak request dari satu client |
| INTERNAL_ERROR | 500 | Bug di server atau error tak terduga. Detail teknis tidak dikirim ke client |

## Contoh Response

**VALIDATION_ERROR (422)**
```json
{
  "sukses": false,
  "error": {
    "kode": "VALIDATION_ERROR",
    "pesan": "Validasi gagal",
    "detail": [
      { "field": "email", "pesan": "Email wajib diisi dengan format yang valid" },
      { "field": "password", "pesan": "Password wajib diisi, minimal 8 karakter" }
    ]
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