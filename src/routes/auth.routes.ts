import { Router } from "express";
import * as authController from "../controllers/auth.controller";
import { validasi } from "../middlewares/validasi.middleware";
import { loginLimiter } from "../middlewares/rateLimit.middleware";
import { LoginDto, RefreshTokenDto, RegisterDto } from "../dto/auth.dto";

const router = Router();

/**
 * @openapi
 * /auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Daftarkan akun peserta baru
 *     description: |
 *       Membuat akun dengan role `peserta`.
 *       - Email dinormalkan (spasi tepi dibuang, huruf kecil), sehingga
 *         `Budi@Mail.com` dan `budi@mail.com` dianggap email yang sama.
 *       - `konfirmasiPassword` hanya untuk validasi dan tidak disimpan.
 *       - Properti di luar yang tercantum ditolak (422).
 *       - Response tidak pernah memuat password.
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterRequest'
 *           examples:
 *             valid:
 *               summary: Payload valid
 *               value:
 *                 nama: Budi Santoso
 *                 sekolah: SMK 5 Malang
 *                 email: budi@mail.com
 *                 password: rahasia123
 *                 konfirmasiPassword: rahasia123
 *     responses:
 *       '201':
 *         description: Akun berhasil dibuat
 *         headers:
 *           X-Request-Id:
 *             $ref: '#/components/headers/XRequestId'
 *           Location:
 *             description: URL peserta yang baru dibuat
 *             schema:
 *               type: string
 *               example: /api/v1/peserta/1
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
router.post("/register", validasi(RegisterDto), authController.register);

/**
 * @openapi
 * /auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Login dan dapatkan access token serta refresh token
 *     description: |
 *       Pesan error SAMA untuk email yang tidak terdaftar maupun password yang salah
 *       (supaya penyerang tidak bisa menebak email mana yang valid).
 *       Dibatasi 10 percobaan gagal per 15 menit per IP; login yang berhasil tidak dihitung.
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *           examples:
 *             peserta:
 *               summary: Login peserta
 *               value:
 *                 email: budi@mail.com
 *                 password: rahasia123
 *     responses:
 *       '200':
 *         description: Login berhasil
 *         headers:
 *           X-Request-Id:
 *             $ref: '#/components/headers/XRequestId'
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *       '401':
 *         description: Email atau password salah
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               sukses: false
 *               error:
 *                 kode: UNAUTHORIZED
 *                 pesan: Email atau password salah
 *               requestId: b7a1c9e2-4f6d-4a9b-8d3e-1c2f5a7e9b10
 *       '422':
 *         $ref: '#/components/responses/ValidationError'
 *       '429':
 *         $ref: '#/components/responses/TooManyRequests'
 */
router.post("/login", loginLimiter, validasi(LoginDto), authController.login);

/**
 * @openapi
 * /auth/refresh:
 *   post:
 *     tags: [Auth]
 *     summary: Tukar refresh token dengan access token baru
 *     description: |
 *       Refresh token harus masih berlaku dan masih tersimpan di server
 *       (belum dicabut lewat logout). Yang dikembalikan hanya access token baru;
 *       refresh token tidak diganti.
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RefreshRequest'
 *           examples:
 *             refreshToken:
 *               summary: Refresh token dari hasil login
 *               value:
 *                 refreshToken: tempel-refresh-token-dari-login
 *     responses:
 *       '200':
 *         description: Access token baru berhasil dibuat
 *         headers:
 *           X-Request-Id:
 *             $ref: '#/components/headers/XRequestId'
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RefreshResponse'
 *       '401':
 *         description: Refresh token kedaluwarsa, tidak valid, atau sudah dicabut
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               kedaluwarsa:
 *                 summary: Refresh token kedaluwarsa
 *                 value:
 *                   sukses: false
 *                   error:
 *                     kode: TOKEN_EXPIRED
 *                     pesan: Token sudah kedaluwarsa
 *                   requestId: b7a1c9e2-4f6d-4a9b-8d3e-1c2f5a7e9b10
 *               tidakValid:
 *                 summary: Refresh token tidak valid
 *                 value:
 *                   sukses: false
 *                   error:
 *                     kode: INVALID_TOKEN
 *                     pesan: Token tidak valid
 *                   requestId: b7a1c9e2-4f6d-4a9b-8d3e-1c2f5a7e9b10
 *               dicabut:
 *                 summary: Refresh token sudah dicabut (logout)
 *                 value:
 *                   sukses: false
 *                   error:
 *                     kode: UNAUTHORIZED
 *                     pesan: Refresh token tidak dikenali atau sudah dicabut
 *                   requestId: b7a1c9e2-4f6d-4a9b-8d3e-1c2f5a7e9b10
 *       '422':
 *         $ref: '#/components/responses/ValidationError'
 */
router.post("/refresh", validasi(RefreshTokenDto), authController.refresh);

/**
 * @openapi
 * /auth/logout:
 *   post:
 *     tags: [Auth]
 *     summary: Logout dengan mencabut refresh token
 *     description: |
 *       Menghapus refresh token dari server sehingga tidak bisa dipakai lagi di `/auth/refresh`.
 *       Access token yang sudah terbit tetap berlaku sampai kedaluwarsa (maksimal 15 menit).
 *       Token yang tidak dikenal tetap menghasilkan 200.
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RefreshRequest'
 *           examples:
 *             refreshToken:
 *               summary: Refresh token dari hasil login
 *               value:
 *                 refreshToken: tempel-refresh-token-dari-login
 *     responses:
 *       '200':
 *         description: Logout berhasil (data bernilai null)
 *         headers:
 *           X-Request-Id:
 *             $ref: '#/components/headers/XRequestId'
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MessageResponse'
 *       '422':
 *         $ref: '#/components/responses/ValidationError'
 */
router.post("/logout", validasi(RefreshTokenDto), authController.logout);

export default router;