import express from "express";
import authMiddleware from "../middlewares/authmiddleware.js";
import authorize from "../middlewares/rolemiddleware.js";
import upload from "../middlewares/uploadmiddleware.js";
import { createAdmin,getAllUsers, getMyProfile, getUserById, updateUser, updatedUserStatus, deleteUser, uploadProfileImage } from "../controllers/user.controller.js";

const router = express.Router();

router.use(authMiddleware);

router.get("/me", getMyProfile);
router.put("/me", updateUser);
router.put("/me/profile-image", upload.single("image"), uploadProfileImage);

router.post("/create-admin", authorize("superAdmin"), createAdmin);
router.get("/", authorize("admin", "superAdmin"), getAllUsers);
router.get("/:id", authorize("admin", "superAdmin"), getUserById);
router.put("/:id/status", authorize("admin", "superAdmin"), updatedUserStatus);
router.delete("/:id", authorize("admin", "superAdmin"), deleteUser);

export default router;
