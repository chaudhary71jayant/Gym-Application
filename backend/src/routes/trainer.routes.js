import express from "express";
import authMiddleware from "../middlewares/authmiddleware.js";
import authorize from "../middlewares/rolemiddleware.js";
import {  createTrainer, getAllTrainers, getTrainerById, getAssignedMembers, deleteTrainer, updateTrainer } from "../controllers/trainer.controller.js";

const router = express.Router();

router.use(authMiddleware);

router
    .route("/")
    .get(getAllTrainers)
    .post(authorize("admin", "superAdmin"), createTrainer);

router
    .route("/:id")
    .get(getTrainerById)
    .put(authorize("admin", "superAdmin", "trainer"), updateTrainer)
    .delete(authorize("admin", "superAdmin"), deleteTrainer);

router.get("/:id/members", authorize("admin", "superAdmin", "trainer"), getAssignedMembers);

export default router;
