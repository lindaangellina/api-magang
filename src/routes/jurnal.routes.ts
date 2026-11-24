import { Router } from "express";
import { jurnalController } from "../controllers";
import { validasi } from "../middlewares/validasi.middleware";
import { authGuard } from "../middlewares/auth.middleware";
import { requireRole } from "../middlewares/role.middleware";
import { IdParamDto } from "../dto/common.dto";
import {
  CreateJurnalDto,
  ListJurnalQueryDto,
  ReviewJurnalDto,
  UpdateJurnalDto,
} from "../dto/jurnal.dto";

const router = Router();

/**
 * @openapi
 * /jurnal:
 *   get:
 *     tags: [Jurnal]
 *     summary: Daftar semua jurnal (khusus mentor)
 *     description: |
 *       Mengembalikan jurnal seluruh peserta dengan pagination.
 *       - Hanya role `mentor`. Peserta mendapat 403; gunakan `/me/jurnal` untuk jurnal sendiri.
 *       - `from` dan `to` memfilter berdasarkan tanggal pembuatan (format `YYYY-MM-DD`, tanggal
 *         yang tidak ada seperti `2026-02-31` ditolak). Keduanya boleh dipakai sendiri-sendiri.
 *       - `belumDireview=true` setara dengan `statusReview=belum`, dan `belumDireview=false`
 *         setara dengan `statusReview=sudah`. Jika keduanya dikirim dan saling bertentangan,
 *         hasilnya 422 (tidak ada yang dipilih diam-diam).
 *       - Parameter yang tidak valid ditolak dengan 422, tidak dikoreksi diam-diam.
 *     parameters:
 *       - $ref: '#/components/parameters/Page'
 *       - $ref: '#/components/parameters/Limit'
 *       - $ref: '#/components/parameters/Order'
 *       - in: query
 *         name: sortBy
 *         description: Kolom pengurutan
 *         schema: { type: string, enum: [createdAt, statusReview], default: createdAt }
 *       - in: query
 *         name: pesertaId
 *         description: Hanya jurnal milik peserta ini
 *         schema: { type: integer, minimum: 1, maximum: 2147483647 }
 *       - in: query
 *         name: statusReview
 *         description: Filter status review
 *         schema: { type: string, enum: [belum, sudah] }
 *       - in: query
 *         name: from
 *         description: Tanggal awal (termasuk), format YYYY-MM-DD
 *         schema: { type: string, format: date, pattern: '^\d{4}-\d{2}-\d{2}$', example: '2026-10-01' }
 *       - in: query
 *         name: to
 *         description: Tanggal akhir (termasuk), format YYYY-MM-DD
 *         schema: { type: string, format: date, pattern: '^\d{4}-\d{2}-\d{2}$', example: '2026-10-31' }
 *       - in: query
 *         name: belumDireview
 *         description: Pintasan untuk filter statusReview (true = belum, false = sudah)
 *         schema: { type: boolean }
 *     responses:
 *       '200':
 *         description: Daftar jurnal
 *         headers:
 *           X-Request-Id:
 *             $ref: '#/components/headers/XRequestId'
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/JurnalListResponse'
 *       '401':
 *         $ref: '#/components/responses/Unauthorized'
 *       '403':
 *         $ref: '#/components/responses/Forbidden'
 *       '422':
 *         $ref: '#/components/responses/ValidationError'
 */
router.get(
  "/",
  authGuard,
  requireRole("mentor"),
  validasi(ListJurnalQueryDto, "query"),
  jurnalController.getSemuaJurnal
);

/**
 * @openapi
 * /jurnal/{id}:
 *   get:
 *     tags: [Jurnal]
 *     summary: Detail satu jurnal
 *     description: |
 *       Wajib login. Hanya pemilik jurnal atau mentor yang boleh membaca; peserta lain mendapat 403.
 *       Jurnal berisi kegiatan, hambatan, dan link commit, jadi tidak boleh terbuka untuk siapa pun.
 *     parameters:
 *       - $ref: '#/components/parameters/IdPath'
 *     responses:
 *       '200':
 *         description: Detail jurnal
 *         headers:
 *           X-Request-Id:
 *             $ref: '#/components/headers/XRequestId'
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/JurnalResponse'
 *       '401':
 *         $ref: '#/components/responses/Unauthorized'
 *       '403':
 *         description: Jurnal ini milik peserta lain
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               sukses: false
 *               error:
 *                 kode: FORBIDDEN
 *                 pesan: Kamu tidak berhak melihat jurnal ini
 *               requestId: b7a1c9e2-4f6d-4a9b-8d3e-1c2f5a7e9b10
 *       '404':
 *         description: Jurnal tidak ditemukan
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               sukses: false
 *               error:
 *                 kode: NOT_FOUND
 *                 pesan: Jurnal tidak ditemukan
 *               requestId: b7a1c9e2-4f6d-4a9b-8d3e-1c2f5a7e9b10
 *       '422':
 *         $ref: '#/components/responses/ValidationError'
 */
router.get("/:id", authGuard, validasi(IdParamDto, "params"), jurnalController.getJurnalById);

/**
 * @openapi
 * /jurnal:
 *   post:
 *     tags: [Jurnal]
 *     summary: Buat jurnal harian baru
 *     description: |
 *       Jurnal otomatis dimiliki pengguna yang login dan berstatus `belum` direview.
 *       `pesertaId` dan `statusReview` tidak boleh dikirim lewat body (ditolak 422).
 *       Lampiran maksimal 5 item; kesalahan pada item lampiran dilaporkan dengan notasi titik,
 *       misalnya `lampiran.1.url` untuk lampiran kedua (indeks mulai dari 0).
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateJurnalRequest'
 *           examples:
 *             sederhana:
 *               summary: Tanpa lampiran
 *               value:
 *                 kegiatan: Belajar unit testing dengan Jest dan Supertest
 *             denganLampiran:
 *               summary: Dengan lampiran tangkapan layar
 *               value:
 *                 kegiatan: Menulis test untuk DTO dan service
 *                 hambatan: Bingung cara mock repository
 *                 linkCommit: https://github.com/lindaangellina/api-magang/commit/abc1234
 *                 lampiran:
 *                   - url: https://contoh.com/ss1.png
 *                     keterangan: Hasil npm test
 *     responses:
 *       '201':
 *         description: Jurnal berhasil dibuat
 *         headers:
 *           X-Request-Id:
 *             $ref: '#/components/headers/XRequestId'
 *           Location:
 *             description: URL jurnal yang baru dibuat
 *             schema:
 *               type: string
 *               example: /api/v1/jurnal/7
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/JurnalResponse'
 *       '401':
 *         $ref: '#/components/responses/Unauthorized'
 *       '422':
 *         description: Input tidak valid
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               lampiranSalah:
 *                 summary: URL pada lampiran kedua tidak valid
 *                 value:
 *                   sukses: false
 *                   error:
 *                     kode: VALIDATION_ERROR
 *                     pesan: Validasi gagal
 *                     detail:
 *                       - field: lampiran.1.url
 *                         pesan: URL lampiran tidak valid
 *                   requestId: b7a1c9e2-4f6d-4a9b-8d3e-1c2f5a7e9b10
 *               pesertaIdDikirim:
 *                 summary: Mengirim properti yang tidak diizinkan
 *                 value:
 *                   sukses: false
 *                   error:
 *                     kode: VALIDATION_ERROR
 *                     pesan: Validasi gagal
 *                     detail:
 *                       - field: pesertaId
 *                         pesan: Properti ini tidak diizinkan
 *                   requestId: b7a1c9e2-4f6d-4a9b-8d3e-1c2f5a7e9b10
 */
router.post("/", authGuard, validasi(CreateJurnalDto), jurnalController.buatJurnal);

/**
 * @openapi
 * /jurnal/{id}:
 *   put:
 *     tags: [Jurnal]
 *     summary: Ubah isi jurnal
 *     description: |
 *       Hanya pemilik jurnal atau mentor yang boleh mengubah; peserta lain mendapat 403.
 *       Yang bisa diubah hanya `kegiatan`, `hambatan`, dan `linkCommit`. Field yang tidak
 *       dikirim tidak diubah (perilakunya seperti PATCH), dan minimal satu field harus diisi.
 *       Status review dan pemilik jurnal tidak bisa diubah lewat endpoint ini.
 *
 *       **Bedanya dengan `PATCH /jurnal/{id}/review`:** endpoint ini mengubah ISI jurnal
 *       (oleh pemilik atau mentor), sedangkan `/review` hanya mengubah STATUS review
 *       dan khusus mentor.
 *     parameters:
 *       - $ref: '#/components/parameters/IdPath'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateJurnalRequest'
 *           examples:
 *             ubahHambatan:
 *               summary: Mengisi hambatan saja
 *               value:
 *                 hambatan: Masih bingung membedakan mock dan stub
 *     responses:
 *       '200':
 *         description: Jurnal berhasil diubah
 *         headers:
 *           X-Request-Id:
 *             $ref: '#/components/headers/XRequestId'
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/JurnalResponse'
 *       '401':
 *         $ref: '#/components/responses/Unauthorized'
 *       '403':
 *         description: Jurnal ini milik peserta lain
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               sukses: false
 *               error:
 *                 kode: FORBIDDEN
 *                 pesan: Kamu tidak berhak mengubah jurnal ini
 *               requestId: b7a1c9e2-4f6d-4a9b-8d3e-1c2f5a7e9b10
 *       '404':
 *         description: Jurnal tidak ditemukan
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               sukses: false
 *               error:
 *                 kode: NOT_FOUND
 *                 pesan: Jurnal tidak ditemukan
 *               requestId: b7a1c9e2-4f6d-4a9b-8d3e-1c2f5a7e9b10
 *       '422':
 *         $ref: '#/components/responses/ValidationError'
 */
router.put(
  "/:id",
  authGuard,
  validasi(IdParamDto, "params"),
  validasi(UpdateJurnalDto),
  jurnalController.updateJurnal
);

/**
 * @openapi
 * /jurnal/{id}/review:
 *   patch:
 *     tags: [Jurnal]
 *     summary: Tandai status review jurnal (khusus mentor)
 *     description: |
 *       Hanya role `mentor`. Ada dua bentuk request yang sah:
 *       - `statusReview: sudah` **wajib** disertai `catatan` (5 sampai 2000 karakter).
 *         Tanpa catatan hasilnya 422.
 *       - `statusReview: belum` mengembalikan jurnal ke status belum direview. `catatan`
 *         tidak diperlukan: kalau dikirim, nilainya diabaikan dan catatan mentor yang lama dikosongkan.
 *     parameters:
 *       - $ref: '#/components/parameters/IdPath'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ReviewJurnalRequest'
 *           examples:
 *             sudah:
 *               summary: Ditandai sudah direview (catatan wajib)
 *               value:
 *                 statusReview: sudah
 *                 catatan: Sudah bagus, lanjutkan.
 *             belum:
 *               summary: Dikembalikan ke belum direview
 *               value:
 *                 statusReview: belum
 *     responses:
 *       '200':
 *         description: Status review berhasil diperbarui
 *         headers:
 *           X-Request-Id:
 *             $ref: '#/components/headers/XRequestId'
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/JurnalResponse'
 *       '401':
 *         $ref: '#/components/responses/Unauthorized'
 *       '403':
 *         $ref: '#/components/responses/Forbidden'
 *       '404':
 *         description: Jurnal tidak ditemukan
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               sukses: false
 *               error:
 *                 kode: NOT_FOUND
 *                 pesan: Jurnal tidak ditemukan
 *               requestId: b7a1c9e2-4f6d-4a9b-8d3e-1c2f5a7e9b10
 *       '422':
 *         description: |
 *           Validasi gagal. Untuk `statusReview: sudah` tanpa `catatan`, field `catatan`
 *           muncul tiga kali di `detail` (satu per aturan yang dilanggar); perbaiki dengan mengisi `catatan` 5 sampai 2000 karakter.
 *         headers:
 *           X-Request-Id:
 *             $ref: '#/components/headers/XRequestId'
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               sudahTanpaCatatan:
 *                 summary: Status sudah tanpa catatan
 *                 value:
 *                   sukses: false
 *                   error:
 *                     kode: VALIDATION_ERROR
 *                     pesan: Validasi gagal
 *                     detail:
 *                       - field: catatan
 *                         pesan: Catatan maksimal 2000 karakter
 *                       - field: catatan
 *                         pesan: Catatan minimal 5 karakter
 *                       - field: catatan
 *                         pesan: Catatan wajib diisi saat jurnal ditandai sudah direview
 *                   requestId: b7a1c9e2-4f6d-4a9b-8d3e-1c2f5a7e9b10
 */
router.patch(
  "/:id/review",
  authGuard,
  requireRole("mentor"),
  validasi(IdParamDto, "params"),
  validasi(ReviewJurnalDto),
  jurnalController.updateStatusReview
);

/**
 * @openapi
 * /jurnal/{id}:
 *   delete:
 *     tags: [Jurnal]
 *     summary: Hapus jurnal
 *     description: Hanya pemilik jurnal atau mentor yang boleh menghapus; peserta lain mendapat 403.
 *     parameters:
 *       - $ref: '#/components/parameters/IdPath'
 *     responses:
 *       '204':
 *         description: Berhasil dihapus (tanpa body)
 *         headers:
 *           X-Request-Id:
 *             $ref: '#/components/headers/XRequestId'
 *       '401':
 *         $ref: '#/components/responses/Unauthorized'
 *       '403':
 *         description: Jurnal ini milik peserta lain
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               sukses: false
 *               error:
 *                 kode: FORBIDDEN
 *                 pesan: Kamu tidak berhak menghapus jurnal ini
 *               requestId: b7a1c9e2-4f6d-4a9b-8d3e-1c2f5a7e9b10
 *       '404':
 *         description: Jurnal tidak ditemukan
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               sukses: false
 *               error:
 *                 kode: NOT_FOUND
 *                 pesan: Jurnal tidak ditemukan
 *               requestId: b7a1c9e2-4f6d-4a9b-8d3e-1c2f5a7e9b10
 *       '422':
 *         $ref: '#/components/responses/ValidationError'
 */
router.delete("/:id", authGuard, validasi(IdParamDto, "params"), jurnalController.hapusJurnal);

export default router;