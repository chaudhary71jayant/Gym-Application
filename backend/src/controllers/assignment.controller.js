import Trainer from "../models/trainer.model.js";
import Member from "../models/member.model.js";
import Notification from "../models/notification.model.js";

const assignTrainer = async (req, res, next) => {
    try {
        const { memberId, trainerId } = req.body;
        const member = await Member.findById(memberId);
        const trainer = await Trainer.findById(trainerId);
        
        if (!member) return res.status(404).json({ success: false, message: "Member not found" });
        if (!trainer) return res.status(404).json({ success: false, message: "Trainer not found" });
        if (!trainer.isAvailable) return res.status(400).json({ success: false, message: "Trainer is not available" });
        if (!trainer.assignedMembers.some((id) => id.equals(member._id)) && trainer.isFull) {
            return res.status(400).json({ success: false, message: "Trainer capacity is full" });
        }

        if (member.trainer && !member.trainer.equals(trainer._id)) {
            await Trainer.findByIdAndUpdate(member.trainer, { $pull: { assignedMembers: member._id } });
        }
        member.trainer = trainer._id;
        await member.save();
        await Trainer.findByIdAndUpdate(trainer._id, { $addToSet: { assignedMembers: member._id } });
        await Notification.create({ recipient: member.user, type: "trainer_assigned", title: "Trainer assigned", message: "A trainer has been assigned to you." });
        res.status(200).json({ success: true, message: "Trainer assigned successfully" });
    } catch (error) {
        next(error);
    }
};

const unassignTrainer = async (req, res, next) => {
    try {
        const member = await Member.findById(req.body.memberId);
        if (!member) return res.status(404).json({ success: false, message: "Member not found" });
        if (!member.trainer) return res.status(400).json({ success: false, message: "Member has no assigned trainer" });

        await Trainer.findByIdAndUpdate(member.trainer, { $pull: { assignedMembers: member._id } });
        member.trainer = null;
        await member.save();
        res.status(200).json({ success: true, message: "Trainer unassigned successfully" });
    } catch (error) {
        next(error);
    }
};

const getTrainerAssignments = async (req, res, next) => {
    try {
        const trainer = await Trainer.findById(req.params.id).populate({ path: "assignedMembers", populate: { path: "user", select: "name email phone profileImage" } });
        if (!trainer) return res.status(404).json({ success: false, message: "Trainer not found" });
        if (trainer.user.toString() !== req.user.id && !["admin", "superAdmin"].includes(req.user.role)) {
            return res.status(403).json({ success: false, message: "Access denied" });
        }
        res.status(200).json({ success: true, count: trainer.assignedMembers.length, members: trainer.assignedMembers });
    } catch (error) {
        next(error);
    }
};

const getMemberAssignment = async (req, res, next) => {
    try {
        const member = await Member.findById(req.params.id).populate({ path: "trainer", populate: { path: "user", select: "name email phone profileImage" } });
        if (!member) return res.status(404).json({ success: false, message: "Member not found" });

        const isSelf = member.user.toString() === req.user.id;
        const isAdmin = ["admin", "superAdmin"].includes(req.user.role);
        const isTrainer = req.user.role === "trainer" && member.trainer?.user?.toString() === req.user.id;
        if (!isSelf && !isAdmin && !isTrainer) return res.status(403).json({ success: false, message: "Access denied" });

        res.status(200).json({ success: true, trainer: member.trainer || null });
    } catch (error) {
        next(error);
    }
};

export { getTrainerAssignments, assignTrainer, unassignTrainer, getMemberAssignment };
