import { Router } from "express";
import { pesertaController, jurnalController } from "../controllers";
import { authGuard } from "../middlewares/auth.middleware";
import { validasi } from "../middlewares/validasi.middleware";
import { UpdateProfilDto } from "../dto/peserta.dto";

const router = Router();

/**
 * @openapi
 * /me:
 *   get:
 *     tags: [Profil]
 *     summary: Lihat profil sendiri
 *     description: Data diambil berdasarkan token, jadi tidak perlu mengirim id.
 *     responses:
 *       '200':
 *         description: Profil berhasil diambil
 *         headers:
 *           X-Request-Id:
 *             $ref: '#/components/headers/XRequestId'
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PesertaResponse'
 *       '401':
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get("/", authGuard, pesertaController.getProfilSaya);

/**
 * @openapi
 * /me:
 *   patch:
 *     tags: [Profil]
 *     summary: Ubah profil sendiri
 *     description: |
 *       Hanya `nama`, `sekolah`, dan `telepon` yang boleh diubah.
 *       Properti lain (termasuk `role`, `email`, `password`) **ditolak dengan 422**
 *       untuk mencegah mass assignment. Minimal satu field harus diisi.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateProfilRequest'
 *           examples:
 *             ubahNama:
 *               summary: Ubah nama saja
 *               value:
 *                 nama: Budi Santoso Putra
 *     responses:
 *       '200':
 *         description: Profil berhasil diubah
 *         headers:
 *           X-Request-Id:
 *             $ref: '#/components/headers/XRequestId'
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PesertaResponse'
 *       '401':
 *         $ref: '#/components/responses/Unauthorized'
 *       '422':
 *         $ref: '#/components/responses/ValidationError'
 */
router.patch("/", authGuard, validasi(UpdateProfilDto), pesertaController.ubahProfilSaya);

/**
 * @openapi
 * /me/jurnal:
 *   get:
 *     tags: [Profil]
 *     summary: Daftar jurnal milik sendiri
 *     description: Seluruh jurnal milik pengguna yang sedang login (tanpa pagination; ada field `total`).
 *     responses:
 *       '200':
 *         description: Jurnal milik saya
 *         headers:
 *           X-Request-Id:
 *             $ref: '#/components/headers/XRequestId'
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/JurnalSayaResponse'
 *       '401':
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get("/jurnal", authGuard, jurnalController.getJurnalSaya);

export default router;