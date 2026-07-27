import express from "express";
import authMiddleware from "../middlewares/authmiddleware.js";
import authorize from "../middlewares/rolemiddleware.js";
import { createPayment, updatePaymentStatus, getMemberPayments, getAllPayments, getPaymentById } from "../controllers/payment.controller.js";


const router = express.Router();

router.use(authMiddleware);

router.post("/", authorize("admin", "superAdmin"), createPayment);
router.get("/", authorize("admin", "superAdmin"), getAllPayments);

router.get("/member/:id", authorize("admin", "superAdmin", "member"), getMemberPayments);

router.put("/:id/status", authorize("admin", "superAdmin"), updatePaymentStatus);
router.get("/:id", authorize("admin", "superAdmin", "member"), getPaymentById);

export default router;
