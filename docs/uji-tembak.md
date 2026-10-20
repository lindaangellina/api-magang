# Uji Tembak: "Coba Rusakkan API-ku" (Minggu 14, Jumat)

Sesi saling menyerang memakai 14 payload jahat. Dijalankan dengan `src/scripts/tembak.ts`, baik terhadap API sendiri maupun API teman (lewat `BASE_URL`). Berkas ini berisi hasil terhadap API sendiri dan jawaban atas dua pertanyaan laporan.

<!-- TEMBAK:MULAI -->

## Hasil uji tembak terhadap `http://localhost:3000/api/v1`

| # | Payload | Status | Hasil | Catatan |
|---|---|---|---|---|
| 1 | `register dengan body {}` | 422 | Ditolak dengan benar (422 VALIDATION_ERROR) | response memuat stack trace (aman hanya jika NODE_ENV=development); pesan: Validasi gagal |
| 2 | `register dengan body []` | 422 | Ditolak dengan benar (422 VALIDATION_ERROR) | response memuat stack trace (aman hanya jika NODE_ENV=development); pesan: Validasi gagal |
| 3 | `Content-Type text/plain, isi JSON valid` | 422 | Ditolak dengan benar (422 VALIDATION_ERROR) | response memuat stack trace (aman hanya jika NODE_ENV=development); pesan: Validasi gagal |
| 4 | `{"nama":123,"email":true}` | 422 | Ditolak dengan benar (422 VALIDATION_ERROR) | response memuat stack trace (aman hanya jika NODE_ENV=development); pesan: Validasi gagal |
| 5 | `nama "      " (6 spasi)` | 422 | Ditolak dengan benar (422 VALIDATION_ERROR) | response memuat stack trace (aman hanya jika NODE_ENV=development); pesan: Validasi gagal |
| 6 | `nama 10.000 karakter` | 422 | Ditolak dengan benar (422 VALIDATION_ERROR) | response memuat stack trace (aman hanya jika NODE_ENV=development); pesan: Validasi gagal |
| 7a | `register + { "role": "mentor" }` | 422 | Ditolak dengan benar (422 VALIDATION_ERROR) | response memuat stack trace (aman hanya jika NODE_ENV=development); pesan: Validasi gagal |
| 7b | `PATCH /me + { "role": "mentor" }` | 422 | Ditolak dengan benar (422 VALIDATION_ERROR) | response memuat stack trace (aman hanya jika NODE_ENV=development); pesan: Validasi gagal |
| 8 | `email "  Tembak8…@Mail.COM  "` | 201 | Diterima (201), disimpan sebagai teks biasa |  |
| 9 | `password 100 karakter` | 422 | Ditolak dengan benar (422 VALIDATION_ERROR) | response memuat stack trace (aman hanya jika NODE_ENV=development); pesan: Validasi gagal |
| 10 | `?sekolah=a&sekolah=b` | 422 | Ditolak dengan benar (422 VALIDATION_ERROR) | response memuat stack trace (aman hanya jika NODE_ENV=development); pesan: Validasi gagal |
| 11 | `?page[x]=1&limit[]=5` | 200 | Tidak crash (200) |  |
| 12 | `body 2 MB` | 413 | Ditolak dengan benar (413 PAYLOAD_TOO_LARGE) | response memuat stack trace (aman hanya jika NODE_ENV=development); pesan: Ukuran request terlalu besar |
| 13 | `nama "'; DROP TABLE peserta; --"` | 201 | Diterima (201), disimpan sebagai teks biasa |  |
| 14 | `nama "<script>alert(1)</script>"` | 201 | Diterima (201), disimpan sebagai teks biasa | Content-Type: application/json; charset=utf-8 |

Setelah payload 13 (SQL), `GET /peserta` tetap 200: tabel masih utuh.

**14 dari 14 payload ditangani dengan benar.**

<!-- TEMBAK:SELESAI -->

## Jawaban pertanyaan laporan

### Kenapa payload 13 (string SQL di `nama`) aman walau diterima?

Validasi memang menerima `'; DROP TABLE peserta; --` karena itu hanya teks biasa yang panjangnya wajar. Yang membuatnya aman adalah **query berparameter**. TypeORM mengirim SQL dan nilainya secara terpisah, misalnya `INSERT INTO "peserta"("nama", ...) VALUES ($1, ...)` dengan nilai `$1` dikirim sebagai data. PostgreSQL memperlakukan `$1` sebagai nilai, tidak pernah menguraikannya sebagai perintah SQL, sehingga `DROP TABLE` hanya tersimpan sebagai teks di kolom `nama`. Buktinya: setelah payload 13, `GET /peserta` tetap 200 dan tabel `peserta` utuh.

Syarat keamanan ini: nilai dari pengguna tidak boleh disambung ke string SQL. Pola yang aman: `repo.save()`, `findOneBy`, `where("p.email = :email", { email })`. Pola yang berbahaya: menyambung nilai langsung ke teks SQL dengan template string, misalnya `where` atau `query` yang berisi `${email}` di dalamnya. Untuk `LIKE`, karakter `%` dan `_` tambahan di-escape lewat `escapeLike`, supaya pengguna tidak bisa mengubah pola pencarian.

### Payload 14 (HTML di `nama`) diterima oleh validasi. Kenapa itu tidak otomatis berbahaya di React, dan lapisan mana yang bertanggung jawab?

API hanya menyimpan dan mengembalikan teks itu sebagai JSON (`Content-Type: application/json`), jadi browser tidak pernah mengeksekusinya sebagai HTML. Bahaya (XSS) baru muncul saat teks itu **ditampilkan** sebagai HTML. React secara default meng-escape semua teks yang dirender lewat JSX (`{peserta.nama}`): `<script>` tampil sebagai tulisan `<script>alert(1)</script>`, bukan dijalankan. Bahayanya baru ada kalau frontend sengaja mematikan perlindungan itu, misalnya `dangerouslySetInnerHTML` atau `element.innerHTML = nama`.

Lapisan yang bertanggung jawab adalah **lapisan output (frontend)**: escape saat menampilkan data, ditambah header `Content-Security-Policy` sebagai pertahanan berlapis. Backend tidak mengubah data diam-diam karena tidak tahu data itu nanti ditampilkan di mana (HTML, PDF, email, CSV), dan membuang karakter seperti `<` akan merusak data sah (misalnya nama sekolah yang memuat `&`). Aturan umumnya: validasi di pintu masuk, escape di pintu keluar sesuai konteks tampilannya.