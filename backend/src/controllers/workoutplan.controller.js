import WorkoutPlan from "../models/workoutplan.model.js";
import Trainer from "../models/trainer.model.js";
import Member from "../models/member.model.js";
import Notification from "../models/notification.model.js";

const canAccessMember = async (member, user) => {
    if (["admin", "superAdmin"].includes(user.role) || member.user.toString() === user.id) return true;
    return user.role === "trainer" && Boolean(await Trainer.findOne({ user: user.id, assignedMembers: member._id }));
};

const createWorkOutPlan = async (req, res, next) => {
    try {
        const { title, description, assignedTo, weeklySchedule, goal, durationWeeks } = req.body;
        const trainer = await Trainer.findOne({ user: req.user.id });
        if (!trainer) return res.status(404).json({ success: false, message: "Trainer profile not found" });
        if (!trainer.assignedMembers.some((memberId) => memberId.toString() === assignedTo)) {
            return res.status(403).json({ success: false, message: "You can create workout plans only for assigned members" });
        }

        const workoutPlan = await WorkoutPlan.create({ title, description, createdBy: trainer._id, assignedTo, weeklySchedule, goal, durationWeeks });
        const member = await Member.findById(assignedTo);
        await Notification.create({ recipient: member.user, type: "plan_assigned", title: "New workout plan assigned", message: `Your trainer assigned a new workout plan: ${title}`, link: `/workout-plans/${workoutPlan._id}` });
        res.status(201).json({ success: true, workoutPlan });
    } catch (error) {
        next(error);
    }
};

const getMemberWorkouts = async (req, res, next) => {
    try {
        const member = await Member.findById(req.params.id);
        if (!member) return res.status(404).json({ success: false, message: "Member not found" });
        if (!await canAccessMember(member, req.user)) return res.status(403).json({ success: false, message: "Access denied" });
        const workoutPlans = await WorkoutPlan.find({ assignedTo: member._id }).populate({ path: "createdBy", populate: { path: "user", select: "name email" } }).sort({ createdAt: -1 });
        res.status(200).json({ success: true, count: workoutPlans.length, workoutPlans });
    } catch (error) {
        next(error);
    }
};

const getWorkoutPlanById = async (req, res, next) => {
    try {
        const workoutPlan = await WorkoutPlan.findById(req.params.id)
            .populate({ path: "createdBy", populate: { path: "user", select: "name email" } })
            .populate({ path: "assignedTo", populate: { path: "user", select: "name email" } });
        if (!workoutPlan) return res.status(404).json({ success: false, message: "Workout plan not found" });
        if (!await canAccessMember(workoutPlan.assignedTo, req.user)) return res.status(403).json({ success: false, message: "Access denied" });
        res.status(200).json({ success: true, workoutPlan });
    } catch (error) {
        next(error);
    }
};

const updateWorkoutPlan = async (req, res, next) => {
    try {
        const workoutPlan = await WorkoutPlan.findById(req.params.id);
        if (!workoutPlan) return res.status(404).json({ success: false, message: "Workout plan not found" });
        const trainer = await Trainer.findOne({ user: req.user.id });
        if (!trainer || !workoutPlan.createdBy.equals(trainer._id)) return res.status(403).json({ success: false, message: "You can update only your own workout plans" });

        for (const field of ["title", "description", "weeklySchedule", "goal", "durationWeeks", "isActive"]) {
            if (req.body[field] !== undefined) workoutPlan[field] = req.body[field];
        }
        await workoutPlan.save();
        res.status(200).json({ success: true, workoutPlan });
    } catch (error) {
        next(error);
    }
};

const deleteWorkoutPlan = async (req, res, next) => {
    try {
        const workoutPlan = await WorkoutPlan.findById(req.params.id);
        if (!workoutPlan) return res.status(404).json({ success: false, message: "Workout plan not found" });
        const isAdmin = ["admin", "superAdmin"].includes(req.user.role);
        if (!isAdmin) {
            const trainer = await Trainer.findOne({ user: req.user.id });
            if (!trainer || !workoutPlan.createdBy.equals(trainer._id)) return res.status(403).json({ success: false, message: "You can delete only your own workout plans" });
        }
        await workoutPlan.deleteOne();
        res.status(200).json({ success: true, message: "Workout plan deleted successfully" });
    } catch (error) {
        next(error);
    }
};

export { createWorkOutPlan, updateWorkoutPlan, deleteWorkoutPlan, getMemberWorkouts, getWorkoutPlanById };
