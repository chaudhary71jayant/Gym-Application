import express from "express";
import authMiddleware from "../middlewares/authmiddleware.js";
import authorize from "../middlewares/rolemiddleware.js";
import { getAdminStats } from "../controllers/stats.controllers.js";

const router = express.Router();

router.get("/admin", authMiddleware ,authorize("admin"), getAdminStats);

export default router;