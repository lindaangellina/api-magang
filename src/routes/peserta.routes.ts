import { Router } from "express";
import { pesertaController } from "../controllers";
import { validasi } from "../middlewares/validasi.middleware";
import { authGuard } from "../middlewares/auth.middleware";
import { requireRole } from "../middlewares/role.middleware";
import { IdParamDto } from "../dto/common.dto";
import { CreatePesertaDto, ListPesertaQueryDto, UpdateProfilDto } from "../dto/peserta.dto";

const router = Router();

/**
 * @openapi
 * /peserta:
 *   get:
 *     tags: [Peserta]
 *     summary: Daftar peserta
 *     description: |
 *       Endpoint ini saat ini **publik** (tanpa login), sesuai kode di `peserta.routes.ts`.
 *       Mendukung pagination, filter, pengurutan, dan pencarian.
 *       Parameter yang tidak valid ditolak dengan 422 (tidak dikoreksi diam-diam).
 *     security: []
 *     parameters:
 *       - $ref: '#/components/parameters/Page'
 *       - $ref: '#/components/parameters/Limit'
 *       - $ref: '#/components/parameters/Order'
 *       - $ref: '#/components/parameters/Q'
 *       - in: query
 *         name: sortBy
 *         description: Kolom pengurutan
 *         schema:
 *           type: string
 *           enum: [nama, fase, createdAt]
 *           default: createdAt
 *       - in: query
 *         name: sekolah
 *         description: Filter berdasarkan sekolah
 *         schema: { type: string, maxLength: 100 }
 *       - in: query
 *         name: fase
 *         description: Filter berdasarkan fase
 *         schema: { type: integer, minimum: 1, maximum: 5 }
 *     responses:
 *       '200':
 *         description: Daftar peserta
 *         headers:
 *           X-Request-Id:
 *             $ref: '#/components/headers/XRequestId'
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PesertaListResponse'
 *       '422':
 *         $ref: '#/components/responses/ValidationError'
 */
router.get("/", validasi(ListPesertaQueryDto, "query"), pesertaController.getSemuaPeserta);

/**
 * @openapi
 * /peserta/{id}:
 *   get:
 *     tags: [Peserta]
 *     summary: Detail satu peserta
 *     description: Endpoint ini saat ini **publik** (tanpa login). Password tidak pernah ikut keluar.
 *     security: []
 *     parameters:
 *       - $ref: '#/components/parameters/IdPath'
 *     responses:
 *       '200':
 *         description: Detail peserta
 *         headers:
 *           X-Request-Id:
 *             $ref: '#/components/headers/XRequestId'
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PesertaResponse'
 *       '404':
 *         $ref: '#/components/responses/NotFound'
 *       '422':
 *         $ref: '#/components/responses/ValidationError'
 */
router.get("/:id", validasi(IdParamDto, "params"), pesertaController.getPesertaById);

/**
 * @openapi
 * /peserta:
 *   post:
 *     tags: [Peserta]
 *     summary: Tambah data peserta
 *     description: |
 *       Menambah data peserta tanpa akun login (tanpa password). Endpoint ini saat ini **publik**.
 *       `role`, `status`, `fase`, `password`, dan `id` tidak bisa diisi lewat body
 *       (ditolak 422). Untuk membuat akun yang bisa login, gunakan `/auth/register`.
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreatePesertaRequest'
 *           examples:
 *             valid:
 *               summary: Payload valid
 *               value:
 *                 nama: Sari Wulandari
 *                 sekolah: SMK 2 Surabaya
 *                 email: sari@mail.com
 *                 telepon: "081234567890"
 *     responses:
 *       '201':
 *         description: Peserta berhasil ditambahkan
 *         headers:
 *           X-Request-Id:
 *             $ref: '#/components/headers/XRequestId'
 *           Location:
 *             description: URL peserta yang baru dibuat
 *             schema:
 *               type: string
 *               example: /api/v1/peserta/2
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PesertaResponse'
 *       '409':
 *         description: Email sudah terdaftar
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               sukses: false
 *               error:
 *                 kode: CONFLICT
 *                 pesan: Email sudah terdaftar
 *               requestId: b7a1c9e2-4f6d-4a9b-8d3e-1c2f5a7e9b10
 *       '422':
 *         $ref: '#/components/responses/ValidationError'
 */
router.post("/", validasi(CreatePesertaDto), pesertaController.buatPeserta);

/**
 * @openapi
 * /peserta/{id}:
 *   patch:
 *     tags: [Peserta]
 *     summary: Ubah data peserta
 *     description: |
 *       Peserta hanya boleh mengubah **dirinya sendiri**; mentor boleh mengubah siapa saja.
 *       Hanya `nama`, `sekolah`, dan `telepon` yang boleh diubah. Properti lain
 *       (termasuk `role`, `email`, `password`) **ditolak dengan 422**.
 *       Minimal satu field harus diisi.
 *     parameters:
 *       - $ref: '#/components/parameters/IdPath'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateProfilRequest'
 *           examples:
 *             ubahSekolah:
 *               summary: Ubah sekolah saja
 *               value:
 *                 sekolah: SMK 1 Malang
 *     responses:
 *       '200':
 *         description: Peserta berhasil diubah
 *         headers:
 *           X-Request-Id:
 *             $ref: '#/components/headers/XRequestId'
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PesertaResponse'
 *       '401':
 *         $ref: '#/components/responses/Unauthorized'
 *       '403':
 *         description: Peserta mencoba mengubah data peserta lain
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               sukses: false
 *               error:
 *                 kode: FORBIDDEN
 *                 pesan: Kamu tidak berhak mengubah data peserta lain
 *               requestId: b7a1c9e2-4f6d-4a9b-8d3e-1c2f5a7e9b10
 *       '404':
 *         $ref: '#/components/responses/NotFound'
 *       '422':
 *         $ref: '#/components/responses/ValidationError'
 */
router.patch(
  "/:id",
  authGuard,
  validasi(IdParamDto, "params"),
  validasi(UpdateProfilDto),
  pesertaController.ubahPeserta
);

/**
 * @openapi
 * /peserta/{id}:
 *   delete:
 *     tags: [Peserta]
 *     summary: Hapus peserta (khusus mentor)
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
 *         $ref: '#/components/responses/Forbidden'
 *       '404':
 *         $ref: '#/components/responses/NotFound'
 *       '409':
 *         description: Peserta masih punya data terkait (mis. jurnal) sehingga tidak bisa dihapus
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               sukses: false
 *               error:
 *                 kode: CONFLICT
 *                 pesan: Data berelasi dengan data lain (tidak ditemukan atau masih dipakai)
 *               requestId: b7a1c9e2-4f6d-4a9b-8d3e-1c2f5a7e9b10
 *       '422':
 *         $ref: '#/components/responses/ValidationError'
 */
router.delete(
  "/:id",
  authGuard,
  requireRole("mentor"),
  validasi(IdParamDto, "params"),
  pesertaController.hapusPeserta
);

/**
 * @openapi
 * /peserta/{id}/jurnal:
 *   get:
 *     tags: [Peserta]
 *     summary: Daftar jurnal milik seorang peserta
 *     description: Endpoint ini saat ini **publik** (tanpa login).
 *     security: []
 *     parameters:
 *       - $ref: '#/components/parameters/IdPath'
 *     responses:
 *       '200':
 *         description: Jurnal milik peserta
 *         headers:
 *           X-Request-Id:
 *             $ref: '#/components/headers/XRequestId'
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PesertaJurnalResponse'
 *       '404':
 *         $ref: '#/components/responses/NotFound'
 *       '422':
 *         $ref: '#/components/responses/ValidationError'
 */
router.get("/:id/jurnal", validasi(IdParamDto, "params"), pesertaController.getJurnalByPeserta);

export default router;