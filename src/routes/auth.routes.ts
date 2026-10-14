import { Router } from "express";
import * as authController from "../controllers/auth.controller";
import { validasi, validasiRefreshToken } from "../middlewares/validasi.middleware";
import { loginLimiter } from "../middlewares/rateLimit.middleware";
import { RegisterDto, LoginDto } from "../dto/auth.dto";

const router = Router();

router.post("/register", validasi(RegisterDto), authController.register);
router.post("/login", loginLimiter, validasi(LoginDto), authController.login);
router.post("/refresh", validasiRefreshToken, authController.refresh);
router.post("/logout", validasiRefreshToken, authController.logout);

export default router;