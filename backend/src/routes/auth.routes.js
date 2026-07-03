import express from "express";
import authMiddleware from "../middlewares/authmiddleware.js";
import { registerUser, loginUser, changePassword } from "../controllers/auth.controller.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.put("/change-password", authMiddleware, changePassword);

export default router;