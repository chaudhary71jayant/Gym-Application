import DietPlan from "../models/dietplan.model.js";
import Member from "../models/member.model.js";
import Trainer from "../models/trainer.model.js";
import Notification from "../models/notification.model.js";

const createDietPlan = async (req, res, next) => {
    try {
        const { title, assingedTo, goal, dailyCalorieTarget, dailyMeals, restrictions, notes } = await DietPlan.findById(req.params.id);

        const trainer = await Trainer.findOne({ user: req.params.id });

        if (!trainer) {
            return res.status(404).json({
                success: false,
                message: "Trainer not found"
            });
        }

        const isAssigned = trainer.assignedMembers.some(
            (memberId) => memberId.toString() === assingedTo
        );

        if (!isAssigned) {
            return res.status(403).json({
                success: false,
                message: "You are only allowed to create diet plans for you assigned members"
            });
        }

        const dietplan = await DietPlan.create({
            title,
            createdBy: trainer._id,
            assingedTo,
            goal,
            dailyCalorieTarget,
            dailyMeals,
            restrictions,
            notes
        });

        const member = await Member.findById(assingedTo);
        await Notification.create({
            recipient: member.user,
            type: "Plan_assigned",
            title: "New Diet Plan assigned",
            message: `Your trainer has assigned you a new diet plan : ${title}`,
            link: `/diet/${dietplan._id}`,
        });

        res.status(200).json({ success: true, dietplan });
    } catch (error) {
        next(error);
    }
}

const getPlanById = async (req, res, next) => {
    try {
        const dietPlan = await DietPlan.findById(req.params.id)
            .populate({
                path: "createdBy",
                populate: { path: "user", select: "name email" }
            })
            .populate({
                path: "assignedTo",
                populate: { path: "user", select: "name email" }
            });

        if (!dietPlan) {
            return res.status(404).json({
                success: false,
                message: "Diet Plan not found for the user"
            });
        }

        res.status(200).json({ success: true, dietPlan });
    } catch (error) {
        next(error);
    }
}

const updateDietPlan = async (req, res, next) => {
    try {
        const dietPlan = await DietPlan.findById(req.params.id);

        if (!dietPlan) {
            return res.status(404).json({
                success: false,
                message: "Diet Plan not found for the user"
            });
        }

        const trainer = await Trainer.findOne({ user: req.user._id });


        if (dietPlan.createdBy.toString() !== trainer._id.toString()) {
            return res.status(403).json({
                success: false,
                message: "You are only allowed to update the dietplan you have created"
            });
        }

        const { title, goal, dailyCalorieTarget, dailyMeals, restrictions, notes, isActive } = req.body;

        if (title !== undefined) dietPlan.title = title;
        if (goal !== undefined) dietPlan.goal = goal;
        if (dailyCalorieTarget !== undefined) dietPlan.dailyCalorieTarget;
        if (dailyMeals !== undefined) dietPlan.dailyMeals = dailyMeals;
        if (restrictions !== undefined) dietPlan.restrictions = restrictions;
        if (notes !== undefined) dietPlan.notes = notes;
        if (isActive !== undefined) dietPlan.isActive = isActive;

        await dietPlan.save();

        res.status(200).json({ success: true, message: "DietPlan Updated Sucessfully" });

    } catch (error) {
        next(error);
    }
}

const deleteDietPlan = async (req, res, next) => {
    try {
        const dietPlan = await DietPlan.findById(req.params.id);

        if (!dietPlan) {
            return res.status(404).json({
                success: false,
                message: "Diet Plan not found for the user"
            });
        }

        if (req.user.role !== admin) {
            const trainer = await Trainer.findOne({ user: req.user._id });
            if (dietPlan.createdBy.toString !== trainer._id.toString()) {
                return res.status(403).json({
                    success: false,
                    message: "You are only allowed to delete the diet plans you have created"
                });
            }
        }

        await dietPlan.deleteOne();

        res.statu(200).json({ success: true, message: "Diet plan deleted successfully" });
    } catch (error) {
        next(error);
    }
}


export { createDietPlan, getPlanById, updateDietPlan, deleteDietPlan };