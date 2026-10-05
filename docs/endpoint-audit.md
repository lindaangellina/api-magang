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

## Status Code — 10 Skenario

| # | Skenario | Status Code | Alasan |
|---|---|---|---|
| a | Register berhasil | 201 Created | Data baru berhasil dibuat |
| b | Register dengan email yang sudah ada | 409 Conflict | Bentrok dengan data yang sudah ada |
| c | Login dengan password salah | 401 Unauthorized | Identitas tidak bisa diverifikasi (belum "dikenali" sistem) |
| d | Akses /me tanpa token | 401 Unauthorized | Sistem tidak tahu siapa yang mengakses |
| e | Peserta mencoba PATCH /jurnal/5/review (khusus mentor) | 403 Forbidden | Sistem tahu siapa dia (sudah login), tapi perannya tidak berhak |
| f | GET /peserta/9999 (tidak ada) | 404 Not Found | Resource dengan id tersebut tidak ditemukan |
| g | DELETE /peserta/1 berhasil | 204 No Content | Berhasil, tidak ada isi yang perlu dikembalikan |
| h | POST /peserta dengan body JSON yang rusak | 400 Bad Request | Request tidak bisa dipahami (JSON tidak valid) |
| i | POST /peserta dengan email format salah | 422 Unprocessable Entity* | Request bisa dipahami, tapi melanggar aturan validasi |
| j | Database mati saat request masuk | 503 Service Unavailable | Dependensi (database) tidak tersedia, bukan bug di kode |

\* Catatan: implementasi saat ini (middleware `validasiRegister`) masih mengembalikan 400 untuk email format salah, karena belum dipisahkan 400 vs 422 — ini akan dirapikan di Minggu 14 sesuai arahan materi ("Minggu 14 akan memakai 422 untuk semua kegagalan validasi").