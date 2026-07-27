import express from "express";
import authMiddleware from "../middlewares/authmiddleware.js";
import authorize from "../middlewares/rolemiddleware.js";
import { assignTrainer, unassignTrainer, getTrainerAssignments, getMemberAssignment  } from "../controllers/assignment.controller.js";

const router = express.Router();

router.use(authMiddleware);

router.post("/assign", authorize("admin", "superAdmin"), assignTrainer);
router.post("/unassign", authorize("admin", "superAdmin"), unassignTrainer);

router.get("/trainer/:id", authorize("admin", "superAdmin", "trainer"), getTrainerAssignments);
router.get("/member/:id", authorize("admin", "superAdmin", "trainer", "member"), getMemberAssignment);


export default router;


