# Hasil Suntik Bug

Dijalankan dengan `node tools/suntik-bug.js --ya`. Setiap bug disuntikkan satu per satu, lalu file dikembalikan.

| Bug | Perubahan | Terdeteksi? | Test yang gagal |
|---|---|---|---|
| 1 | buatMeta: page < totalPages menjadi page <= totalPages | ya | buatMeta halaman terakhir tidak punya hasNext<br>buatMeta data kosong tetap menghasilkan 1 halaman<br>Otorisasi (role) 200 dengan meta pagination jika mentor mengakses daftar jurnal |
| 2 | ListQueryDto: hapus @Max(100) dari limit | ya | ListPesertaQueryDto menolak: limit 1000<br>Validasi input 422 jika limit melebihi batas |
| 3 | UpdateProfilDto: hapus @IsOptional dari field nama | ya | UpdateProfilDto menerima: ubah telepon<br>UpdateProfilDto menerima: sekolah dan telepon +62<br>UpdateProfilDto body kosong lolos DTO (aturan 'minimal satu field' ada di service, bukan DTO)<br>dan 4 lainnya |
| 4 | authGuard: hapus next() pada jalur sukses | ya | errorHandler: error PostgreSQL 23505 (UNIQUE dilanggar) menjadi 23505 409<br>errorHandler: error PostgreSQL 23503 (FOREIGN KEY dilanggar) menjadi 23503 409<br>errorHandler: error PostgreSQL 22P02 (format nilai tidak valid) menjadi 22 400<br>dan 21 lainnya |
| 5 | requireRole: ForbiddenError menjadi UnauthorizedError | ya | Otorisasi (role) 403 FORBIDDEN jika peserta mengakses daftar jurnal (khusus mentor)<br>PATCH dan DELETE /peserta/:id peserta tidak boleh menghapus peserta: 403 dan service tidak dipanggil<br>/jurnal h. PATCH /jurnal/1/review sebagai peserta: 403 dan service tidak dipanggil |
| 6 | errorHandler: error 23505 menjadi 400, bukan 409 | ya | errorHandler: error PostgreSQL 23505 (UNIQUE dilanggar) menjadi 23505 409 |
| 7 | AuthService.login: pesan berbeda untuk email salah dan password salah | ya | AuthService login f. pesan error email tidak ada dan password salah SAMA persis |
| 8 | serialisasi: hapus excludeExtraneousValues | ya | Response DTO password tidak pernah ikut keluar walau service mengembalikannya<br>POST /auth/register a. sukses: 201, Location, dan body tidak memuat password<br>POST /auth/login, refresh, logout login sukses: 200 dengan token dan peserta tanpa password<br>dan 1 lainnya |
| 9 | validasi: forbidNonWhitelisted menjadi false | ya | a. mass assignment lewat UpdateProfilDto menolak role walau dikirim sendirian<br>a. mass assignment lewat UpdateProfilDto menolak id walau dikirim sendirian<br>a. mass assignment lewat UpdateProfilDto menolak password walau dikirim sendirian<br>dan 21 lainnya |
| 10 | AuthService.logout: refresh token tidak dihapus dari database | ya | AuthService refresh dan logout j. logout menghapus refresh token yang dikirim |

Terdeteksi: **10 dari 10**.
