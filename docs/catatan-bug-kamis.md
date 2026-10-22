# Catatan Bug: Test HTTP (Minggu 15, Kamis)

## authGuard dan error JWT (Soal 2)

Materi memperkirakan `authGuard` bisa "menelan" error JWT sehingga token kedaluwarsa menghasilkan `INVALID_TOKEN`, bukan `TOKEN_EXPIRED`. Setelah membaca `src/middlewares/auth.middleware.ts`, kode kita **tidak punya masalah itu**: `verifikasiToken(token)` dipanggil tanpa `try/catch`, sehingga `TokenExpiredError` dan `JsonWebTokenError` naik ke `errorHandler`, yang menerjemahkannya menjadi `TOKEN_EXPIRED` dan `INVALID_TOKEN`. Jadi tidak ada perbaikan yang perlu dibuat; dua test (`401 TOKEN_EXPIRED` dan `401 INVALID_TOKEN`) berfungsi sebagai pengaman supaya perilaku ini tidak berubah diam-diam.

## Temuan lain

Belum ada bug baru dari test HTTP. Bila `npm test` menunjukkan test yang gagal, catat di sini: test, hasil yang diharapkan, hasil sebenarnya, dan apakah yang salah kode atau test.

## Masalah desain yang masih diketahui

`POST /peserta` masih publik dan tidak mengatur password (tercatat di `docs/endpoint-audit.md`).