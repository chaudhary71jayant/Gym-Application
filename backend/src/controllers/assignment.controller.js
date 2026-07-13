import User from "../models/user.model.js";
import Trainer from "../models/trainer.model.js";
import Member from "../models/member.model.js";

const assignTrainer = async (req, res, next) => {
    try {
        const { memberId , trainerID } = req.body;
        
        const member = await Member.findById(memberId);
        const trainer = await Trainer.findById(trainerID);

        if(!member){
            return res.status(404).json({
                success : false,
                message : "Member not found",
            });
        }

        if(!trainer){
            return res.status(404).json({
                success : false,
                message : "Trainer not found"
            });
        }

        if(!trainer.isAvailable){
            return res.status(401).json({
                success : false,
                message : "The trainer is not available",
            })
        }

        if(trainer.assignedMembers.length >= trainer.maxcapacity){
            return res.status(400).json({
                success : false,
                message : "The trainer's capacity is maxed out can not assing the trainer."
            })
        }

        if(member.trainer) {
            await Trainer.findByIdAndUpdate(member.trainer, {
                $pull : { assignedMembers : member._id }
            })
        }

        member.trainer = trainer._id;
        await member.save();

        await Trainer.findByIdAndUpdate(trainer._id, {
            $addToSet : { assignedMembers : member._id }
        });


        await Notification.create({
            recipient : member.user,
            type : "trainer_assigned",
            title : "Trainer Assigned",
            message : `A trainer has been assigned to you. Check you profile for details.`,
        });

        res.status(200).json({
            success : true,
            message : "Trainer Assigned Successfully",
        });
    } catch (error) {
        next(error);
    }
}

const unassignTrainer = async ( req, res, next) => {
    try {
        const { memberId } = req.body;

        const member = await User.findById(memberId);

        if(!member){
            return res.status(404).json({
                success : false,
                message : "Member not found"
            });
        }

        if(!member.trainer){
            return res.status(400).json({
                success : false,
                message : "Member has no trainer assign"
            });
        }

        member.trainer = null;
        await member.save();

        res.status(200).json({
            success : true,
            message : "Trainer unassign successfull"
        });
    } catch (error) {
        next(error);
    }
}

const getTrainerAssignments = async (req, res, next) => {
    try {
        const trainer = await Trainer.findById(req.params.id)
            .populate({
                path : "assignedMembers",
                populate : {
                    path : "user",
                    select : "name email phone profileImage",
                },
            });

        if(!member){
            return res.status(404).json({
                success : false,
                message : "Member not found",
            });
        }

        if(!member.trainer){
            return res.status(200).json({
                success : true,
                message : "No trainer assinged yet",
                trainer : null,
            });
        }

        res.status(200).json({
            success : true,
            trainer : member.trainer
        });

    } catch (error) {
        next(error);
    }
}

export { getTrainerAssignments, assignTrainer, unassignTrainer };