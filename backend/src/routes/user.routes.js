import express from "express";
import authMiddleware from "../middlewares/authmiddleware.js";
import authorize from "../middlewares/rolemiddleware.js";
import upload from "../middlewares/uploadmiddleware.js";
import {  
    getAllAdmins,
    createAdmin,
    deleteAdmin,
    getAllUsers,
    getMyProfile,
    getUserById,
    updateUser,
    updatedUserStatus,
    deleteUser,
    uploadProfileImage,
 } from "../controllers/user.controller.js";

const router = express.Router();

router.use(authMiddleware);

router.get("/me", getMyProfile);
router.put("/me", updateUser);
router.put("/me/profile-image", upload.single("image"), uploadProfileImage);

router.get("/admin",authorize("superAdmin"), getAllAdmins);
router.post("/create-admin", authorize("superAdmin"), createAdmin);
router.delete("/:id/delete-admin", authorize("superAdmin"),deleteAdmin)
router.get("/", authorize("admin"), getAllUsers);
router.get("/:id", authorize("admin"), getUserById);
router.put("/:id/status", authorize("admin"), updatedUserStatus);
router.delete("/:id", authorize("admin"), deleteUser);

export default router;
