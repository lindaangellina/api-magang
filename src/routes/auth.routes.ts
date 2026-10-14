import { Router } from "express";
import * as authController from "../controllers/auth.controller";
import { validasiRegister, validasiLogin, validasiRefreshToken } from "../middlewares/validasi.middleware";
import { loginLimiter } from "../middlewares/rateLimit.middleware";

const router = Router();

router.post("/register", validasiRegister, authController.register);
router.post("/login", loginLimiter, validasiLogin, authController.login);
router.post("/refresh", validasiRefreshToken, authController.refresh);
router.post("/logout", validasiRefreshToken, authController.logout);

export default router;