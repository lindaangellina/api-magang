import { Router } from "express";
import * as authController from "../controllers/auth.controller";
import { validasi } from "../middlewares/validasi.middleware";
import { loginLimiter } from "../middlewares/rateLimit.middleware";
import { LoginDto, RefreshTokenDto, RegisterDto } from "../dto/auth.dto";

const router = Router();

router.post("/register", validasi(RegisterDto), authController.register);
router.post("/login", loginLimiter, validasi(LoginDto), authController.login);
router.post("/refresh", validasi(RefreshTokenDto), authController.refresh);
router.post("/logout", validasi(RefreshTokenDto), authController.logout);

export default router;