import express from "express";
import authMiddleware from "../middlewares/authmiddleware.js";
import authorize from "../middlewares/rolemiddleware.js";
import { createDietPlan, getPlanById, getMemberDiet,updateDietPlan, deleteDietPlan } from "../controllers/dietPlan.controller.js";

const router = express.Router();

router.use(authMiddleware);

router.post("/", authorize("trainer"), createDietPlan);


router.get("/member/:id", authorize("admin", "superAdmin", "trainer", "member"), getMemberDiet);
router.get("/:id", authorize("admin", "superAdmin", "trainer", "member"), getPlanById);

router.put("/:id", authorize("trainer"), updateDietPlan);
router.delete("/:id", authorize("admin", "superAdmin", "trainer"), deleteDietPlan);

export default router;
