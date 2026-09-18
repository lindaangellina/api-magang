import { Router } from "express";
import * as testController from "../controllers/test.controller";

const router = Router();

router.get("/not-found", testController.testNotFound);
router.get("/validation", testController.testValidation);
router.get("/unauthorized", testController.testUnauthorized);
router.get("/crash", testController.testCrash);

export default router;