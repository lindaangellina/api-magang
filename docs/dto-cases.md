# Kasus Uji DTO

Setiap DTO punya minimal 3 payload valid dan 5 payload tidak valid, beserta **hasil nyata** dari API yang berjalan. Tabel di bawah dibuat otomatis oleh `src/scripts/tes-dto-cases.ts` (jalankan ulang kapan saja, bagian di antara penanda akan diganti). Minggu depan setiap kasus ini diubah menjadi unit test otomatis dengan Jest.

DTO yang dicakup: RegisterDto, LoginDto, RefreshTokenDto, CreatePesertaDto, UpdateProfilDto, CreateJurnalDto (+ LampiranDto), UpdateJurnalDto, ReviewJurnalDto, IdParamDto, ListPesertaQueryDto (+ ListQueryDto), ListJurnalQueryDto.

<!-- HASIL-UJI:MULAI -->

## Hasil uji nyata

Dibuat otomatis oleh `src/scripts/tes-dto-cases.ts` pada 2026-10-19 terhadap API yang berjalan di `http://localhost:3000/api/v1`. Ringkasan: **127 dari 127 kasus sesuai harapan.** Tanda ✓ berarti hasil nyata sama dengan yang diharapkan.

### RegisterDto

Endpoint: POST /auth/register (body)

**Valid (4)**

| # | Payload | Diharapkan | Hasil nyata |
|---|---|---|---|
| 1 | `{"nama":"Budi Santoso","sekolah":"SMK 5 Malang","password":"rahasia123","konfirmasiPassword":"rahasia123","email":"reg11792375911882@mail.com"}` | 201 | 201 ✓ |
| 2 | `{"nama":"Budi Santoso","sekolah":"SMK 5 Malang","password":"rahasia123","konfirmasiPassword":"rahasia123","email":"  Reg21792375911882@Mail.COM  "}` | 201 | 201 ✓ |
| 3 | `{"nama":"Budi Santoso","sekolah":"SMK 5 Malang","password":"a1bbbbbbbbbbbbb…(72 karakter)","konfirmasiPassword":"a1bbbbbbbbbbbbb…(72 karakter)","email":"reg31792375911882@mail.com"}` | 201 | 201 ✓ |
| 4 | `{"nama":"Ali","sekolah":"SMK 5 Malang","password":"rahasia123","konfirmasiPassword":"rahasia123","email":"reg41792375911882@mail.com"}` | 201 | 201 ✓ |

**Tidak valid (9)**

| # | Payload | Diharapkan | Hasil nyata |
|---|---|---|---|
| 1 | `{}` | 422, field nama | 422, nama: "Nama maksimal 100 karakter" ✓ |
| 2 | `{"nama":"Bu","sekolah":"SMK 5 Malang","password":"rahasia123","konfirmasiPassword":"rahasia123","email":"r1792375911882@mail.com"}` | 422, field nama | 422, nama: "Nama minimal 3 karakter" ✓ |
| 3 | `{"nama":"      ","sekolah":"SMK 5 Malang","password":"rahasia123","konfirmasiPassword":"rahasia123","email":"r1792375911882@mail.com"}` | 422, field nama | 422, nama: "Nama minimal 3 karakter" ✓ |
| 4 | `{"nama":"Budi Santoso","sekolah":"SMK 5 Malang","password":"rahasia123","konfirmasiPassword":"rahasia123","email":"bukan-email"}` | 422, field email | 422, email: "Format email tidak valid" ✓ |
| 5 | `{"nama":"Budi Santoso","sekolah":"SMK 5 Malang","password":"rahasiaaa","konfirmasiPassword":"rahasiaaa","email":"r1792375911882@mail.com"}` | 422, field password | 422, password: "Password harus mengandung huruf dan angka" ✓ |
| 6 | `{"nama":"Budi Santoso","sekolah":"SMK 5 Malang","password":"a1bbbbbbbbbbbbb…(73 karakter)","konfirmasiPassword":"a1bbbbbbbbbbbbb…(73 karakter)","email":"r1792375911882@mail.com"}` | 422, field password | 422, password: "Password maksimal 72 karakter" ✓ |
| 7 | `{"nama":"Budi Santoso","sekolah":"SMK 5 Malang","password":"rahasia123","konfirmasiPassword":"beda12345","email":"r1792375911882@mail.com"}` | 422, field konfirmasiPassword | 422, konfirmasiPassword: "Konfirmasi password tidak cocok" ✓ |
| 8 | `{"nama":"Budi Santoso","sekolah":"SMK 5 Malang","password":"rahasia123","konfirmasiPassword":"rahasia123","email":"r1792375911882@mail.com","role":"mentor"}` | 422, field role | 422, role: "Properti ini tidak diizinkan" ✓ |
| 9 | `{"nama":123,"email":true}` | 422, field nama | 422, nama: "Nama maksimal 100 karakter" ✓ |

### LoginDto

Endpoint: POST /auth/login (body)

Catatan: Kasus tidak valid dibatasi lima karena setiap request gagal dihitung rate limit login (10 per 15 menit).

**Valid (3)**

| # | Payload | Diharapkan | Hasil nyata |
|---|---|---|---|
| 1 | `{"email":"dtocase1792375911882@mail.com","password":"Rahasia123"}` | 200 | 200 ✓ |
| 2 | `{"email":"  DTOCASE1792375911882@MAIL.COM  ","password":"Rahasia123"}` | 200 | 200 ✓ |
| 3 | `{"email":"   dtocase1792375911882@mail.com","password":"Rahasia123"}` | 200 | 200 ✓ |

**Tidak valid (5)**

| # | Payload | Diharapkan | Hasil nyata |
|---|---|---|---|
| 1 | `{}` | 422, field email | 422, email: "Format email tidak valid" ✓ |
| 2 | `{"email":"bukan-email","password":"Rahasia123"}` | 422, field email | 422, email: "Format email tidak valid" ✓ |
| 3 | `{"email":"dtocase1792375911882@mail.com","password":""}` | 422, field password | 422, password: "Password wajib diisi" ✓ |
| 4 | `{"email":"dtocase1792375911882@mail.com","password":12345678}` | 422, field password | 422, password: "Password maksimal 72 karakter" ✓ |
| 5 | `{"email":"dtocase1792375911882@mail.com","password":"aaaaaaaaaaaaaaa…(73 karakter)"}` | 422, field password | 422, password: "Password maksimal 72 karakter" ✓ |

### RefreshTokenDto

Endpoint: POST /auth/refresh dan POST /auth/logout (body)

**Valid (3)**

| # | Payload | Diharapkan | Hasil nyata |
|---|---|---|---|
| 1 | `{"refreshToken":"eyJhbGciOiJIUzI…(215 karakter)"}` | 200 | 200 ✓ |
| 2 | `{"refreshToken":"eyJhbGciOiJIUzI…(215 karakter)"}` | 200 | 200 ✓ |
| 3 | `{"refreshToken":"eyJhbGciOiJIUzI…(215 karakter)"}` | 200 | 200 ✓ |

**Tidak valid (7)**

| # | Payload | Diharapkan | Hasil nyata |
|---|---|---|---|
| 1 | `{}` | 422, field refreshToken | 422, refreshToken: "refreshToken maksimal 2048 karakter" ✓ |
| 2 | `{"refreshToken":123}` | 422, field refreshToken | 422, refreshToken: "refreshToken maksimal 2048 karakter" ✓ |
| 3 | `{"refreshToken":""}` | 422, field refreshToken | 422, refreshToken: "refreshToken wajib diisi" ✓ |
| 4 | `{"refreshToken":["a"]}` | 422, field refreshToken | 422, refreshToken: "refreshToken maksimal 2048 karakter" ✓ |
| 5 | `{"refreshToken":null}` | 422, field refreshToken | 422, refreshToken: "refreshToken maksimal 2048 karakter" ✓ |
| 6 | `{"refreshToken":"aaaaaaaaaaaaaaa…(5000 karakter)"}` | 422, field refreshToken | 422, refreshToken: "refreshToken maksimal 2048 karakter" ✓ |
| 7 | `{"refreshToken":"eyJhbGciOiJIUzI…(215 karakter)","role":"mentor"}` | 422, field role | 422, role: "Properti ini tidak diizinkan" ✓ |

### CreatePesertaDto

Endpoint: POST /peserta (body)

Catatan: Endpoint ini publik (tanpa token), peninggalan Minggu 9. Data uji yang terbentuk dihapus lagi oleh skrip bila akun mentor tersedia.

**Valid (4)**

| # | Payload | Diharapkan | Hasil nyata |
|---|---|---|---|
| 1 | `{"nama":"Peserta Uji","sekolah":"SMK Uji","email":"cp11792375911882@mail.com","telepon":"081234567890"}` | 201 | 201 ✓ |
| 2 | `{"nama":"Peserta Uji","sekolah":"SMK Uji","email":"cp21792375911882@mail.com"}` | 201 | 201 ✓ |
| 3 | `{"nama":"Peserta Uji","sekolah":"SMK Uji","email":"cp31792375911882@mail.com","telepon":"+6281234567890"}` | 201 | 201 ✓ |
| 4 | `{"nama":"Peserta Uji","sekolah":"SMK Uji","email":"  CP41792375911882@Mail.COM "}` | 201 | 201 ✓ |

**Tidak valid (7)**

| # | Payload | Diharapkan | Hasil nyata |
|---|---|---|---|
| 1 | `{}` | 422, field nama | 422, nama: "Nama maksimal 100 karakter" ✓ |
| 2 | `{"nama":"Bu","sekolah":"SMK Uji","email":"cp1792375911882@mail.com"}` | 422, field nama | 422, nama: "Nama minimal 3 karakter" ✓ |
| 3 | `{"nama":"aaaaaaaaaaaaaaa…(101 karakter)","sekolah":"SMK Uji","email":"cp1792375911882@mail.com"}` | 422, field nama | 422, nama: "Nama maksimal 100 karakter" ✓ |
| 4 | `{"nama":"Peserta Uji","sekolah":"SMK Uji","email":"bukan-email"}` | 422, field email | 422, email: "Format email tidak valid" ✓ |
| 5 | `{"nama":"Peserta Uji","sekolah":"SMK Uji","email":"cp1792375911882@mail.com","telepon":"abc"}` | 422, field telepon | 422, telepon: "Format nomor telepon Indonesia tidak valid" ✓ |
| 6 | `{"nama":"Peserta Uji","sekolah":"SMK Uji","email":"cp1792375911882@mail.com","role":"mentor"}` | 422, field role | 422, role: "Properti ini tidak diizinkan" ✓ |
| 7 | `{"nama":"Peserta Uji","sekolah":"SMK Uji","email":"cp1792375911882@mail.com","password":"x"}` | 422, field password | 422, password: "Properti ini tidak diizinkan" ✓ |

### UpdateProfilDto

Endpoint: PATCH /me dan PATCH /peserta/:id (body)

**Valid (4)**

| # | Payload | Diharapkan | Hasil nyata |
|---|---|---|---|
| 1 | `{"nama":"Nama Uji Satu"}` | 200 | 200 ✓ |
| 2 | `{"telepon":"081234567890"}` | 200 | 200 ✓ |
| 3 | `{"sekolah":"SMK Uji Baru","telepon":"+6281234567890"}` | 200 | 200 ✓ |
| 4 | `{"nama":"   Nama Spasi   "}` | 200 | 200 ✓ |

**Tidak valid (8)**

| # | Payload | Diharapkan | Hasil nyata |
|---|---|---|---|
| 1 | `{}` | 422, field body | 422, body: "Minimal satu field harus diisi" ✓ |
| 2 | `{"role":"mentor"}` | 422, field role | 422, role: "Properti ini tidak diizinkan" ✓ |
| 3 | `{"email":"baru@mail.com"}` | 422, field email | 422, email: "Properti ini tidak diizinkan" ✓ |
| 4 | `{"password":"x"}` | 422, field password | 422, password: "Properti ini tidak diizinkan" ✓ |
| 5 | `{"nama":"ab"}` | 422, field nama | 422, nama: "Nama minimal 3 karakter" ✓ |
| 6 | `{"nama":"aaaaaaaaaaaaaaa…(101 karakter)"}` | 422, field nama | 422, nama: "Nama maksimal 100 karakter" ✓ |
| 7 | `{"sekolah":"   "}` | 422, field sekolah | 422, sekolah: "Sekolah minimal 3 karakter" ✓ |
| 8 | `{"telepon":"abc"}` | 422, field telepon | 422, telepon: "Format nomor telepon Indonesia tidak valid" ✓ |

### CreateJurnalDto (+ LampiranDto)

Endpoint: POST /jurnal (body)

**Valid (5)**

| # | Payload | Diharapkan | Hasil nyata |
|---|---|---|---|
| 1 | `{"kegiatan":"Belajar DTO pada hari Jumat"}` | 201 | 201 ✓ |
| 2 | `{"kegiatan":"Belajar DTO pada hari Jumat","hambatan":"Sempat bingung","linkCommit":"https://github.com/lindaangellina/api-magang/commit/abc123"}` | 201 | 201 ✓ |
| 3 | `{"kegiatan":"0123456789"}` | 201 | 201 ✓ |
| 4 | `{"kegiatan":"aaaaaaaaaaaaaaa…(2000 karakter)"}` | 201 | 201 ✓ |
| 5 | `{"kegiatan":"Menguji lampiran jurnal","lampiran":[{"url":"https://contoh.com/a.png","keterangan":"Screenshot"},{"url":"https://contoh.com/b.png"}]}` | 201 | 201 ✓ |

**Tidak valid (10)**

| # | Payload | Diharapkan | Hasil nyata |
|---|---|---|---|
| 1 | `{}` | 422, field kegiatan | 422, kegiatan: "Kegiatan maksimal 2000 karakter" ✓ |
| 2 | `{"kegiatan":"123456789"}` | 422, field kegiatan | 422, kegiatan: "Kegiatan minimal 10 karakter" ✓ |
| 3 | `{"kegiatan":"aaaaaaaaaaaaaaa…(2001 karakter)"}` | 422, field kegiatan | 422, kegiatan: "Kegiatan maksimal 2000 karakter" ✓ |
| 4 | `{"kegiatan":"Kegiatan yang cukup panjang","pesertaId":1}` | 422, field pesertaId | 422, pesertaId: "Properti ini tidak diizinkan" ✓ |
| 5 | `{"kegiatan":"Kegiatan yang cukup panjang","hambatan":123}` | 422, field hambatan | 422, hambatan: "Hambatan maksimal 2000 karakter" ✓ |
| 6 | `{"kegiatan":"Kegiatan yang cukup panjang","linkCommit":"bukan-url"}` | 422, field linkCommit | 422, linkCommit: "Link commit harus berupa URL yang valid" ✓ |
| 7 | `{"kegiatan":"Kegiatan yang cukup panjang","linkCommit":"https://contoh.…(2119 karakter)"}` | 422, field linkCommit | 422, linkCommit: "Link commit harus berupa URL yang valid" ✓ |
| 8 | `{"kegiatan":"Kegiatan yang cukup panjang","lampiran":[{"url":"https://contoh.com/f0.png"},{"url":"https://contoh.com/f1.png"},{"url":"https://contoh.com/f2.png"},{"url":"https://contoh.com/f3.png"},{"url":"https://contoh.com/f4.png"},{"url":"https://contoh.com/f5.png"}]}` | 422, field lampiran | 422, lampiran: "Lampiran maksimal 5 item" ✓ |
| 9 | `{"kegiatan":"Kegiatan yang cukup panjang","lampiran":[{"url":"https://contoh.com/a.png"},{"url":"bukan-url"}]}` | 422, field lampiran.1.url | 422, lampiran.1.url: "URL lampiran tidak valid" ✓ |
| 10 | `{"kegiatan":"Kegiatan yang cukup panjang","lampiran":[{"url":"https://contoh.com/a.png","sisipan":"x"}]}` | 422, field lampiran.0.sisipan | 422, lampiran.0.sisipan: "Properti ini tidak diizinkan" ✓ |

### UpdateJurnalDto

Endpoint: PUT /jurnal/:id (body)

**Valid (4)**

| # | Payload | Diharapkan | Hasil nyata |
|---|---|---|---|
| 1 | `{"kegiatan":"Kegiatan diperbarui lewat PUT"}` | 200 | 200 ✓ |
| 2 | `{"hambatan":"Hambatan diperbarui"}` | 200 | 200 ✓ |
| 3 | `{"linkCommit":"https://github.com/lindaangellina/api-magang/commit/def456"}` | 200 | 200 ✓ |
| 4 | `{"kegiatan":"Kegiatan diperbarui lagi","hambatan":"Tidak ada hambatan"}` | 200 | 200 ✓ |

**Tidak valid (7)**

| # | Payload | Diharapkan | Hasil nyata |
|---|---|---|---|
| 1 | `{}` | 422, field body | 422, body: "Minimal satu field harus diisi" ✓ |
| 2 | `{"kegiatan":"pendek"}` | 422, field kegiatan | 422, kegiatan: "Kegiatan minimal 10 karakter" ✓ |
| 3 | `{"kegiatan":123}` | 422, field kegiatan | 422, kegiatan: "Kegiatan maksimal 2000 karakter" ✓ |
| 4 | `{"hambatan":"aaaaaaaaaaaaaaa…(2001 karakter)"}` | 422, field hambatan | 422, hambatan: "Hambatan maksimal 2000 karakter" ✓ |
| 5 | `{"linkCommit":"bukan-url"}` | 422, field linkCommit | 422, linkCommit: "Link commit harus berupa URL yang valid" ✓ |
| 6 | `{"statusReview":"sudah"}` | 422, field statusReview | 422, statusReview: "Properti ini tidak diizinkan" ✓ |
| 7 | `{"pesertaId":1}` | 422, field pesertaId | 422, pesertaId: "Properti ini tidak diizinkan" ✓ |

### ReviewJurnalDto

Endpoint: PATCH /jurnal/:id/review (body, akun mentor)

**Valid (4)**

| # | Payload | Diharapkan | Hasil nyata |
|---|---|---|---|
| 1 | `{"statusReview":"belum"}` | 200 | 200 ✓ |
| 2 | `{"statusReview":"sudah","catatan":"Kerja bagus, lanjutkan"}` | 200 | 200 ✓ |
| 3 | `{"statusReview":"sudah","catatan":"Bagus"}` | 200 | 200 ✓ |
| 4 | `{"statusReview":"sudah","catatan":"   Catatan rapi   "}` | 200 | 200 ✓ |

**Tidak valid (7)**

| # | Payload | Diharapkan | Hasil nyata |
|---|---|---|---|
| 1 | `{}` | 422, field statusReview | 422, statusReview: "statusReview harus belum atau sudah" ✓ |
| 2 | `{"statusReview":"lulus"}` | 422, field statusReview | 422, statusReview: "statusReview harus belum atau sudah" ✓ |
| 3 | `{"statusReview":"sudah"}` | 422, field catatan | 422, catatan: "Catatan maksimal 2000 karakter" ✓ |
| 4 | `{"statusReview":"sudah","catatan":"Baik"}` | 422, field catatan | 422, catatan: "Catatan minimal 5 karakter" ✓ |
| 5 | `{"statusReview":"sudah","catatan":12345}` | 422, field catatan | 422, catatan: "Catatan maksimal 2000 karakter" ✓ |
| 6 | `{"statusReview":"sudah","catatan":"aaaaaaaaaaaaaaa…(2001 karakter)"}` | 422, field catatan | 422, catatan: "Catatan maksimal 2000 karakter" ✓ |
| 7 | `{"statusReview":"sudah","catatan":"Catatan cukup panjang","reviewerId":1}` | 422, field reviewerId | 422, reviewerId: "Properti ini tidak diizinkan" ✓ |

### IdParamDto

Endpoint: semua route /:id (params)

Catatan: Baris ke-3 menunjukkan bahwa id yang lolos DTO tetapi datanya tidak ada menghasilkan 404 (aturan service), bukan 422.

**Valid (4)**

| # | Payload | Diharapkan | Hasil nyata |
|---|---|---|---|
| 1 | `GET /peserta/69` | 200 | 200 ✓ |
| 2 | `GET /jurnal/10` | 200 | 200 ✓ |
| 3 | `GET /peserta/9999999` | 404 | 404 NOT_FOUND ✓ |
| 4 | `GET /peserta/69/jurnal` | 200 | 200 ✓ |

**Tidak valid (6)**

| # | Payload | Diharapkan | Hasil nyata |
|---|---|---|---|
| 1 | `GET /peserta/abc` | 422, field id | 422, id: "id terlalu besar" ✓ |
| 2 | `GET /peserta/0` | 422, field id | 422, id: "id minimal 1" ✓ |
| 3 | `GET /peserta/-1` | 422, field id | 422, id: "id minimal 1" ✓ |
| 4 | `GET /peserta/1.5` | 422, field id | 422, id: "id harus berupa bilangan bulat" ✓ |
| 5 | `GET /peserta/99999999999` | 422, field id | 422, id: "id terlalu besar" ✓ |
| 6 | `GET /jurnal/abc` | 422, field id | 422, id: "id terlalu besar" ✓ |

### ListPesertaQueryDto (+ ListQueryDto)

Endpoint: GET /peserta (query)

**Valid (4)**

| # | Payload | Diharapkan | Hasil nyata |
|---|---|---|---|
| 1 | `GET /peserta` | 200 | 200 ✓ |
| 2 | `GET /peserta?page=2&limit=5` | 200 | 200 ✓ |
| 3 | `GET /peserta?sortBy=nama&order=asc` | 200 | 200 ✓ |
| 4 | `GET /peserta?q=budi&fase=1&sekolah=SMK` | 200 | 200 ✓ |

**Tidak valid (10)**

| # | Payload | Diharapkan | Hasil nyata |
|---|---|---|---|
| 1 | `GET /peserta?page=0` | 422, field page | 422, page: "page minimal 1" ✓ |
| 2 | `GET /peserta?page=abc` | 422, field page | 422, page: "page maksimal 1000000" ✓ |
| 3 | `GET /peserta?page=99999999999` | 422, field page | 422, page: "page maksimal 1000000" ✓ |
| 4 | `GET /peserta?limit=1000` | 422, field limit | 422, limit: "limit maksimal 100" ✓ |
| 5 | `GET /peserta?limit=0` | 422, field limit | 422, limit: "limit minimal 1" ✓ |
| 6 | `GET /peserta?sortBy=password` | 422, field sortBy | 422, sortBy: "sortBy harus salah satu dari: nama, fase, createdAt" ✓ |
| 7 | `GET /peserta?order=sembarang` | 422, field order | 422, order: "order harus ASC atau DESC" ✓ |
| 8 | `GET /peserta?sekolah=a&sekolah=b` | 422, field sekolah | 422, sekolah: "sekolah maksimal 100 karakter" ✓ |
| 9 | `GET /peserta?fase=9` | 422, field fase | 422, fase: "fase maksimal 5" ✓ |
| 10 | `GET /peserta?q=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa` | 422, field q | 422, q: "q maksimal 100 karakter" ✓ |

### ListJurnalQueryDto

Endpoint: GET /jurnal (query, akun mentor)

**Valid (4)**

| # | Payload | Diharapkan | Hasil nyata |
|---|---|---|---|
| 1 | `GET /jurnal` | 200 | 200 ✓ |
| 2 | `GET /jurnal?belumDireview=true&limit=5` | 200 | 200 ✓ |
| 3 | `GET /jurnal?from=2026-01-01&to=2026-12-31&sortBy=statusReview&order=asc` | 200 | 200 ✓ |
| 4 | `GET /jurnal?pesertaId=69&statusReview=belum` | 200 | 200 ✓ |

**Tidak valid (8)**

| # | Payload | Diharapkan | Hasil nyata |
|---|---|---|---|
| 1 | `GET /jurnal?belumDireview=abc` | 422, field belumDireview | 422, belumDireview: "belumDireview harus true atau false" ✓ |
| 2 | `GET /jurnal?belumDireview=true&statusReview=sudah` | 422, field belumDireview | 422, belumDireview: "belumDireview bertentangan dengan statusReview" ✓ |
| 3 | `GET /jurnal?from=2026-02-31` | 422, field from | 422, from: "from bukan tanggal yang valid" ✓ |
| 4 | `GET /jurnal?from=31-01-2026` | 422, field from | 422, from: "from bukan tanggal yang valid" ✓ |
| 5 | `GET /jurnal?statusReview=lulus` | 422, field statusReview | 422, statusReview: "statusReview harus belum atau sudah" ✓ |
| 6 | `GET /jurnal?pesertaId=abc` | 422, field pesertaId | 422, pesertaId: "pesertaId terlalu besar" ✓ |
| 7 | `GET /jurnal?pesertaId=99999999999` | 422, field pesertaId | 422, pesertaId: "pesertaId terlalu besar" ✓ |
| 8 | `GET /jurnal?sortBy=password` | 422, field sortBy | 422, sortBy: "sortBy harus salah satu dari: createdAt, statusReview" ✓ |

<!-- HASIL-UJI:SELESAI -->

---

# Tiga lapis validasi: DTO, service, database

Pembagian tempat untuk setiap aturan, beserta alasannya.

| # | Aturan | Tempat | Alasan |
|---|---|---|---|
| a | Format email valid | DTO | Cukup melihat string-nya sendiri. Stateless, murah, tanpa database. |
| b | Email belum dipakai akun lain | Database (UNIQUE) | Perlu data yang ada. Pengecekan di DTO bisa kena race condition: dua request bersamaan sama-sama melihat "email belum ada" lalu keduanya menyimpan. Hanya UNIQUE constraint yang menjamin. Error 23505 diterjemahkan menjadi 409 (Minggu 13). |
| c | Nama minimal 3 karakter | DTO | Aturan bentuk, hanya bergantung pada nilai field itu sendiri. |
| d | Peserta hanya boleh mengedit jurnal miliknya | Service | Perlu tahu siapa yang login (`req.user`) dan siapa pemilik jurnal (data dari database). Ini aturan bisnis/kepemilikan, bukan bentuk data. |
| e | Fase bernilai 1 sampai 5 | DTO | Aturan rentang pada satu nilai, tidak perlu data lain. |
| f | Password minimal 8 karakter | DTO | Aturan bentuk pada satu field, dicek sebelum request menyentuh service. |
| g | `pesertaId` pada jurnal menunjuk peserta yang ada | Database (FOREIGN KEY) | Perlu mengecek isi tabel lain. Foreign key menjamin tanpa celah race (peserta bisa terhapus di antara pengecekan dan penyimpanan). Error 23503 diterjemahkan menjadi pesan yang ramah. |
| h | Jurnal yang sudah direview tidak boleh diedit lagi | Service | Bergantung pada status jurnal saat ini di database (state aplikasi), bukan pada isi request. |

## Cara memutuskan
1. Cukup dengan melihat request itu sendiri? **DTO** (lapis 1, murah, ditolak paling awal dengan 422).
2. Perlu tahu siapa penggunanya atau status data saat ini? **Service** (lapis 2, aturan bisnis, 403/409/422 sesuai kasus).
3. Harus benar walau ada dua request bersamaan, atau walau ada kode lain yang menulis ke tabel? **Database** (lapis 3, penjaga terakhir).

Beberapa aturan sengaja dijaga di lebih dari satu lapis (misalnya email unik: service boleh mengecek lebih dulu untuk pesan yang ramah, tapi UNIQUE tetap penjaga yang menentukan).