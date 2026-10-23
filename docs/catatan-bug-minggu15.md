# Catatan Bug: Minggu 15 (Unit, HTTP, dan Integration Test)

Setiap entri memuat gejala, penyebab, perbaikan, dan test yang mencegahnya kembali. Bagian terakhir mencatat dugaan yang ternyata bukan bug, supaya tidak dikira terlewat.

## Bug yang ditemukan test

### 1. `potongTeks` menghasilkan teks lebih panjang dari batas (Senin)

- **Gejala:** `potongTeks("abcdef", 2)` menghasilkan `"..."` (3 karakter), padahal batasnya 2.
- **Penyebab:** versi awal memakai `slice(0, max - 3) + "..."` tanpa memikirkan `max` yang lebih kecil dari 3.
- **Perbaikan:** hasil tidak pernah lebih panjang dari `max`. `max <= 0` menghasilkan `""`, dan `max` 1 sampai 3 menghasilkan titik sebanyak `max`.
- **Test pencegah:** `tests/unit/utils/teks.test.ts` (kasus tepi `max` kecil). Bug ini ketahuan oleh test kasus tepi yang ditulis lebih dulu (TDD).

### 2. Dekorator `@Sama` menganggap dua field yang sama-sama kosong itu sama (Selasa)

- **Gejala:** bila `password` dan `konfirmasiPassword` sama-sama tidak dikirim, `@Sama` lolos karena `undefined === undefined`.
- **Penyebab:** `@Sama` hanya membandingkan dengan `===` dan tidak memeriksa apakah field-nya ada.
- **Perbaikan:** `@Sama` selalu dipasangkan dengan `@IsString` (dan `@IsNotEmpty`/`@MinLength`) pada field yang sama, seperti di `RegisterDto`. Field kosong ditolak oleh dekorator itu, bukan oleh `@Sama`.
- **Test pencegah:** `tests/unit/dto/sama.decorator.test.ts` (kasus "kedua field tidak ada dianggap sama") dan test `RegisterDto` di `tests/unit/dto/auth.dto.test.ts`.

### 3. Rate limit login ikut aktif saat test (Kamis)

- **Gejala:** bila test login gagal berjalan lebih dari 10 kali, test berikutnya mendapat 429 `RATE_LIMITED` dan tidak berkaitan dengan hal yang diuji.
- **Penyebab:** `loginLimiter` selalu aktif, tidak peduli lingkungannya.
- **Perbaikan:** `skip: () => process.env.NODE_ENV === "test"` pada `loginLimiter`. Limiter dinyalakan kembali hanya pada satu file test khusus.
- **Test pencegah:** `tests/http/rate-limit.test.ts` (login gagal ke-11 menjadi 429, login yang berhasil tidak dihitung).

### 4. Penerjemahan error database tidak punya test (Jumat, ditemukan lewat Suntik Bug)

- **Gejala:** pada percobaan Suntik Bug, mengubah error PostgreSQL 23505 dari 409 menjadi 400 **tidak terdeteksi** sebelum `error-handler.test.ts` ditulis. Laporan coverage juga menunjukkan `error.middleware.ts` bagian penerjemahan error database belum tersentuh.
- **Penyebab:** test HTTP lama me-mock service, sehingga error database tidak pernah muncul.
- **Perbaikan:** menambah `tests/http/error-handler.test.ts` (23505 dan 23503 menjadi 409, 22P02 menjadi 400, kode lain tetap 500 tanpa membocorkan pesan database). Perilaku yang sama juga diuji di database sungguhan oleh `tests/integration/auth-flow.test.ts` (race condition register menjadi 409) dan `tests/integration/peserta-db.test.ts` (hapus peserta yang punya jurnal menjadi 409).
- **Test pencegah:** ketiga file di atas. Setelah itu bug ini terdeteksi.

## Temuan yang belum diperbaiki

- **`src/data/dummy.ts` memuat 8 error TypeScript** (data contoh tidak mengikuti entity `Peserta` dan `JurnalHarian` yang sekarang). Ditemukan lagi oleh `npm run test:coverage` ("Failed to collect coverage"). File ini peninggalan awal proyek dan tidak dipakai aplikasi, jadi tidak mengganggu `npm test`, tetapi perlu dihapus atau diperbarui pada kesempatan berikutnya.
- **Endpoint publik yang membuka data** (`POST /peserta`, `GET /peserta`, `GET /jurnal/:id`, dan lainnya) tetap tercatat di `docs/endpoint-audit.md` sebagai masalah desain yang menunggu keputusan mentor.

## Dugaan yang ternyata bukan bug

- **`authGuard` menelan error JWT (Kamis).** Materi memperkirakan token kedaluwarsa menjadi `INVALID_TOKEN`. Setelah kode dibaca, `authGuard` memanggil `verifikasiToken` tanpa `try/catch`, sehingga `TokenExpiredError` dan `JsonWebTokenError` naik ke `errorHandler` dan diterjemahkan dengan benar. Tidak ada yang diperbaiki. Test `401 TOKEN_EXPIRED` dan `401 INVALID_TOKEN` di `tests/http/kontrak-api.test.ts` menjaga agar perilaku ini tidak berubah diam-diam.

## Hasil Suntik Bug

10 dari 10 bug suntikan terdeteksi (rincian per bug dan nama test ada di `docs/suntik-bug-hasil.md`). Yang perlu dicatat: bug 6 (error 23505 menjadi 400) hanya ditangkap oleh 1 test, yaitu `error-handler.test.ts` yang baru ditulis hari Jumat. Bug 7 dan bug 10 (pesan login dan logout) juga hanya ditangkap 1 test, jadi perlindungannya tipis tetapi ada.