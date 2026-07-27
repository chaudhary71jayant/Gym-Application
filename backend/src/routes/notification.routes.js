import express from "express";
import authMiddleware from "../middlewares/authmiddleware.js";
import { getMyNotifications, markAllAsRead, markAsRead,deleteNotification } from "../controllers/notification.controller.js";
const router = express.Router();

router.use(authMiddleware);

router.get("/", getMyNotifications);

router.put("/read-all", markAllAsRead);
router.put("/:id/read", markAsRead);

router.delete("/:id", deleteNotification);

export default router;
