import { Router } from "express";
import { statsController } from "../controllers";

const router = Router();

router.get("/", statsController.getStatistik);

export default router;