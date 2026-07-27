import DietPlan from "../models/dietplan.model.js";
import Member from "../models/member.model.js";
import Trainer from "../models/trainer.model.js";
import Notification from "../models/notification.model.js";

const canAccessMember = async (member, user) => {
    if (["admin", "superAdmin"].includes(user.role) || member.user.toString() === user.id) return true;
    if (user.role !== "trainer") return false;
    return Boolean(await Trainer.findOne({ user: user.id, assignedMembers: member._id }));
};

const createDietPlan = async (req, res, next) => {
    try {
        const { title, assignedTo, goal, dailyCalorieTarget, dailyMeals, restrictions, notes } = req.body;
        const trainer = await Trainer.findOne({ user: req.user.id });
        if (!trainer) return res.status(404).json({ success: false, message: "Trainer profile not found" });
        if (!trainer.assignedMembers.some((memberId) => memberId.toString() === assignedTo)) {
            return res.status(403).json({ success: false, message: "You can create diet plans only for assigned members" });
        }

        const dietPlan = await DietPlan.create({ title, createdBy: trainer._id, assignedTo, goal, dailyCalorieTarget, dailyMeals, restrictions, notes });
        const member = await Member.findById(assignedTo);
        await Notification.create({ recipient: member.user, type: "plan_assigned", title: "New diet plan assigned", message: `Your trainer assigned a new diet plan: ${title}`, link: `/diet-plans/${dietPlan._id}` });
        res.status(201).json({ success: true, dietPlan });
    } catch (error) {
        next(error);
    }
};

const getMemberDiet = async (req, res, next) => {
    try {
        const member = await Member.findById(req.params.id);
        if (!member) return res.status(404).json({ success: false, message: "Member not found" });
        if (!await canAccessMember(member, req.user)) return res.status(403).json({ success: false, message: "Access denied" });

        const dietPlans = await DietPlan.find({ assignedTo: member._id }).sort({ createdAt: -1 });
        res.status(200).json({ success: true, count: dietPlans.length, dietPlans });
    } catch (error) {
        next(error);
    }
};

const getPlanById = async (req, res, next) => {
    try {
        const dietPlan = await DietPlan.findById(req.params.id)
            .populate({ path: "createdBy", populate: { path: "user", select: "name email" } })
            .populate({ path: "assignedTo", populate: { path: "user", select: "name email" } });
        if (!dietPlan) return res.status(404).json({ success: false, message: "Diet plan not found" });
        if (!await canAccessMember(dietPlan.assignedTo, req.user)) return res.status(403).json({ success: false, message: "Access denied" });
        res.status(200).json({ success: true, dietPlan });
    } catch (error) {
        next(error);
    }
};

const updateDietPlan = async (req, res, next) => {
    try {
        const dietPlan = await DietPlan.findById(req.params.id);
        if (!dietPlan) return res.status(404).json({ success: false, message: "Diet plan not found" });
        const trainer = await Trainer.findOne({ user: req.user.id });
        if (!trainer || !dietPlan.createdBy.equals(trainer._id)) return res.status(403).json({ success: false, message: "You can update only your own diet plans" });

        for (const field of ["title", "goal", "dailyCalorieTarget", "dailyMeals", "restrictions", "notes", "isActive"]) {
            if (req.body[field] !== undefined) dietPlan[field] = req.body[field];
        }
        await dietPlan.save();
        res.status(200).json({ success: true, dietPlan });
    } catch (error) {
        next(error);
    }
};

const deleteDietPlan = async (req, res, next) => {
    try {
        const dietPlan = await DietPlan.findById(req.params.id);
        if (!dietPlan) return res.status(404).json({ success: false, message: "Diet plan not found" });

        const isAdmin = ["admin", "superAdmin"].includes(req.user.role);
        if (!isAdmin) {
            const trainer = await Trainer.findOne({ user: req.user.id });
            if (!trainer || !dietPlan.createdBy.equals(trainer._id)) return res.status(403).json({ success: false, message: "You can delete only your own diet plans" });
        }
        await dietPlan.deleteOne();
        res.status(200).json({ success: true, message: "Diet plan deleted successfully" });
    } catch (error) {
        next(error);
    }
};

export { createDietPlan, getMemberDiet, getPlanById, updateDietPlan, deleteDietPlan };
