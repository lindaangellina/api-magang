import { Router } from "express";
import { statsController } from "../controllers";

const router = Router();

/**
 * @openapi
 * /stats:
 *   get:
 *     tags: [Sistem]
 *     summary: Ringkasan statistik peserta dan jurnal
 *     description: |
 *       Menghitung total peserta, total jurnal, jumlah jurnal yang belum direview, rata-rata jurnal
 *       per peserta, jumlah jurnal tiap peserta, dan lima skill terpopuler.
 *       Endpoint ini saat ini **publik** (tanpa login). Jika database masih kosong, semua angka 0
 *       dan daftar kosong.
 *     security: []
 *     responses:
 *       '200':
 *         description: Statistik berhasil diambil
 *         headers:
 *           X-Request-Id:
 *             $ref: '#/components/headers/XRequestId'
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/StatsResponse'
 */
router.get("/", statsController.getStatistik);

export default router;