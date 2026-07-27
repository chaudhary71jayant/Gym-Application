import express from "express";
import authMiddleware from "../middlewares/authmiddleware.js";
import authorize from "../middlewares/rolemiddleware.js";
import { checkIn, checkOut, getMemberAttendance, getTodayAttendance } from "../controllers/attendence.controller.js";

const router = express.Router();

router.use(authMiddleware);

router.post("/checkIn", authorize("member"), checkIn);
router.put("/checkOut", authorize("member"), checkOut);

router.get("/member/:id", authorize("admin", "superAdmin", "trainer", "member"), getMemberAttendance);
router.get("/today", authorize("admin", "superAdmin"), getTodayAttendance);

export default router;

