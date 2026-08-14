import express from "express";
import authMiddleware from "../middlewares/authmiddleware.js";
import { registerUser, loginUser, logoutUser, changePassword } from "../controllers/auth.controller.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/logout", authMiddleware, logoutUser);
router.put("/change-password", authMiddleware, changePassword);

export default router;