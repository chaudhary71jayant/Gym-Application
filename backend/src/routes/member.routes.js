import express from "express";
import authMiddleware from "../middlewares/authmiddleware.js";
import authorize from "../middlewares/rolemiddleware.js";
import { getAllMembers, getMemberById, getMyMemberProfile, updateMember,updateMembershipStatus, deleteMember } from "../controllers/member.controller.js";

const router = express.Router();

router.use(authMiddleware);

router.get("/me", authorize("member"), getMyMemberProfile);
router.get("/", authorize("admin", "superAdmin", "trainer"), getAllMembers);

router
    .route("/:id")
    .get(getMemberById)
    .put(updateMember)
    .delete(authorize("admin", "superAdmin"),deleteMember);

router.put("/:id/membership-status", authorize("admin"), updateMembershipStatus);

export default router;
