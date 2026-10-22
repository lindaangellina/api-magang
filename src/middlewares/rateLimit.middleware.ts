import rateLimit from "express-rate-limit";
import { AppError } from "../utils/AppError";
import { ErrorCode } from "../utils/errorCodes";

export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // jendela 15 menit
  limit: 10, // maksimal 10 percobaan per IP
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // hanya login yang gagal yang dihitung
  // Dimatikan saat test supaya test login yang berulang tidak kena 429.
  // Satu test khusus (tests/http/rate-limit.test.ts) menyalakannya kembali.
  skip: () => process.env.NODE_ENV === "test",
  // Teruskan ke errorHandler supaya format error tetap seragam
  handler: (_req, _res, next) => {
    next(new AppError("Terlalu banyak percobaan, coba lagi nanti", 429, ErrorCode.RATE_LIMITED));
  },
});