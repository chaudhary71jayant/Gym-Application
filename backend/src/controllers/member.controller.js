import Member from "../models/member.model.js";
import Trainer from "../models/trainer.model.js";
import User from "../models/user.model.js";

const memberDetails = (query) => query
    .populate("user", "name email phone profileImage isActive")
    .populate({ path: "trainer", populate: { path: "user", select: "name email phone" } });

const getAllMembers = async (req, res, next) => {
    try {
        const filter = {};
        if (req.user.role === "trainer") {
            const trainer = await Trainer.findOne({ user: req.user.id });
            if (!trainer) return res.status(404).json({ success: false, message: "Trainer profile not found" });
            filter._id = { $in: trainer.assignedMembers };
        }

        const members = await memberDetails(Member.find(filter)).sort({ createdAt: -1 });
        res.status(200).json({ success: true, count: members.length, members });
    } catch (error) {
        next(error);
    }
};

const getMyMemberProfile = async (req, res, next) => {
    try {
        const member = await memberDetails(Member.findOne({ user: req.user.id }));
        if (!member) return res.status(404).json({ success: false, message: "Member profile not found" });
        res.status(200).json({ success: true, member });
    } catch (error) {
        next(error);
    }
};

const getMemberById = async (req, res, next) => {
    try {
        const member = await memberDetails(Member.findById(req.params.id));
        if (!member) return res.status(404).json({ success: false, message: "Member not found" });

        const isSelf = member.user._id.toString() === req.user.id;
        const isAdmin = req.user.role === "admin" || req.user.role === "superAdmin";
        const trainer = req.user.role === "trainer"
            ? await Trainer.findOne({ user: req.user.id, assignedMembers: member._id })
            : null;

        if (!isSelf && !isAdmin && !trainer) {
            return res.status(403).json({ success: false, message: "Not authorized to view this member" });
        }

        res.status(200).json({ success: true, member });
    } catch (error) {
        next(error);
    }
};

const updateMember = async (req, res, next) => {
    try {
        const member = await Member.findById(req.params.id);
        if (!member) return res.status(404).json({ success: false, message: "Member not found" });

        const isSelf = member.user.toString() === req.user.id;
        const isAdmin = req.user.role === "admin" || req.user.role === "superAdmin";
        if (!isSelf && !isAdmin) return res.status(403).json({ success: false, message: "Not authorized to update this member" });

        const editableFields = ["fitnessGoal", "age", "weight", "height", "healthConditions"];
        for (const field of editableFields) {
            if (req.body[field] !== undefined) member[field] = req.body[field];
        }

        if (isAdmin) {
            const adminFields = ["membershipPlan", "membershipStart", "membershipEnd", "membershipStatus", "expiryAlertSent", "trainer"];
            for (const field of adminFields) {
                if (req.body[field] !== undefined) member[field] = req.body[field];
            }
        }

        await member.save();
        res.status(200).json({ success: true, member });
    } catch (error) {
        next(error);
    }
};

const deleteMember = async (req, res, next) => {
    try {
        const member = await Member.findById(req.params.id);
        if (!member) return res.status(404).json({ success: false, message: "Member not found" });

        if (member.trainer) {
            await Trainer.findByIdAndUpdate(member.trainer, { $pull: { assignedMembers: member._id } });
        }
        await User.findByIdAndDelete(member.user);
        await member.deleteOne();
        res.status(200).json({ success: true, message: "Member deleted successfully" });
    } catch (error) {
        next(error);
    }
};

export { getAllMembers, getMemberById, getMyMemberProfile, updateMember, deleteMember };
