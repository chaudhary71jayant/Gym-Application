import express from "express";
import authMiddleware from "../middlewares/authmiddleware.js";
import authorize from "../middlewares/rolemiddleware.js";
import { createWorkOutPlan, deleteWorkoutPlan, getMemberWorkouts, getWorkoutPlanById, updateWorkoutPlan } from "../controllers/workoutplan.controller.js";

const router = express.Router();

router.use(authMiddleware);

router.post("/", authorize("trainer"), createWorkOutPlan);
router.get("/member/:id", authorize("admin", "superAdmin", "trainer", "member"), getMemberWorkouts);
router.get("/:id", authorize("admin", "superAdmin", "trainer", "member"), getWorkoutPlanById);
router.put("/:id", authorize("trainer"), updateWorkoutPlan);
router.delete("/:id", authorize("admin", "superAdmin", "trainer"), deleteWorkoutPlan);

export default router;
