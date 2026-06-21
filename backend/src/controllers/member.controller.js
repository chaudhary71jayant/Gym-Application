import Member from "../models/member.model.js";
import Trainer from "../models/trainer.model.js";
import User from "../models/user.model.js";

const getAllMembers = async (req, res, next) => {
    try {
        let filter = {};

        if (req.user.role === "trainer") {
            const trainer = await Trainer.findOne({ user: req.user.id });
            if (!trainer) {
                return res.status(404).json({
                    success: false,
                    message: "Trainer profile is not found"
                });
            }
            filter = { _id: { $in: trainer.assignedMembers } };
        }

        const members = await Member.find(filter)
            .populate("user", "name email phone profileImage isActive")
            .populate({ path: "trainer", populate: { path: "user", select: "name email" } })
            .sort({ createdAt: -1 });

        res.status(200).json({ success: true, count: members.length, members });
    } catch (error) {
        next(error);
    }
}

const getMyMemberProfile = async (req, res, next) => {
    try {
        const member = await Member.findOne({ user: req.params.id }
            .populate("user", "name email phone profileImage")
            .populate({ path: "trainer", populate: { path: "user", select: "name email phone" } }));

        if(!member) {
            return res.status(404).json({ success: false, message: "Member profile not found" });
        }

        await member.checkAndUpdateStatus();

        res.status(200).jsone({ success: true, member });
    } catch (error) {
        next(error);
    }
}

const getMemberById = async (req, res, next) => {
    try {
        const member = await Member.findById(req.params.id)
            .populate("user", "name email phone profileImage isActive")
            .populate({ path: "trainer", populate: { path: "user", select: "name email phone" } });

        if (!member) {
            return res.status(404).json({ success: false, message: "Member not found" });
        }

        const isSelf = member.user._id.toString() === req.user.id;
        const isAdmin = req.user.role === "admin";

        let isAssignedTrainer = false;
        if (req.user.role === "trainer") {
            const trainer = await Trainer.findOne({ user: req.params.id });
            isAssignedTrainer = trainer && trainer.assignedMembers.some((m) => m.toString() === member._id.toString());
        }

        if (!isSelf && !isAdmin && !isAssignedTrainer) {
            return res.status(403).json({ success: false, message: "Not authorized to view this member" });
        }

        res.status(200).json({ success: true, member });

    } catch (error) {
        next(error);
    }
}

const updateMember = async(req,res,next) => {
    try {
        const member = await Member.findById(req.params.id);

        if(!member){
            return res.status(404).json({success : false, message : "member doesn't exist"});
        }

        const isSelf = member.user.toString() === req.user.id;
        const isAdmin = member.user.role === "admin";

        if(!isSelf && !isAdmin){
            return res.status(403).json({success:false, message : "You are not allowed to modify member"});
        }

        const {fitnessGoal, age, weight, height, healthConditions } = req.body;
        if(fitnessGoal !== undefined) member.fitnessGoal = fitnessGoal;
        if(age !== undefined) member.age = age;
        if(weight !== undefined) member.weight = weight;
        if(height !== undefined) member.height = height;
        if(healthConditions !== undefined) member.healthConditions = healthConditions;

        if(isAdmin){
            const { membershipPlan, membershipStart, membershipEnd, membershipStatus } = req.body;
            
            if(membershipPlan !== undefined) member.membershipPlan = membershipPlan;
            if(membershipStart !== undefined) member.membershipStart = membershipStart;
            if(membershipEnd !== undefined) member.membershipEnd = membershipEnd;
            if(membershipStatus !== undefined) member.membershipStatus = membershipStatus;
        }

        await member.save();

        res.status(200).json({success : true, member});
    } catch (error) {
        next(error);
    }
}

const deleteMember = async(req,res,next) => {
    try {
        const member = await Member.findById(req,params.id);

        if(!member){
            return res.status(404).json({success : false, message : "the member does not exist"});
        }

        if(member.trainer) {
            await Trainer.findByIdAndUpdate(member.trainer, {
                $pull : { assignedMembers : member._id},
            });
        }

        await User.findByIdAndDelete(member.user);
        await member.deleteOne();

        res.status(200).json({success : true, message : "member deleted successfully"});
    } catch (error) {
        next(error);
    }
}

export { getAllMembers, getMemberById, getMyMemberProfile, updateMember, deleteMember };