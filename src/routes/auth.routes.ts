import { Router } from "express";
import * as authController from "../controllers/auth.controller";
import { validasiRegister, validasiLogin } from "../middlewares/validasi.middleware";

const router = Router();

router.post("/register", validasiRegister, authController.register);
router.post("/login", validasiLogin, authController.login);

export default router;