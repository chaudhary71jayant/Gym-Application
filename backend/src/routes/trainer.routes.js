import express from "express";
import authMiddleware from "../middlewares/authmiddleware.js";
import authorize from "../middlewares/rolemiddleware.js";
import {  createTrainer, getAllTrainers, getTrainerById, getAssignedMembers, deleteTrainer, updateTrainer } from "../controllers/trainer.controller.js";

const router = express.Router();

router.use(authMiddleware);

router
    .route("/")
    .get(getAllTrainers)
    .post(authorize("admin"), createTrainer);

router
    .route("/:id")
    .get(getTrainerById)
    .put(authorize("admin", "trainer"), updateTrainer)
    .delete(authorize("admin"), deleteTrainer);

router.get("/:id/members", authorize("admin", "trainer"), getAssignedMembers);

export default router;
