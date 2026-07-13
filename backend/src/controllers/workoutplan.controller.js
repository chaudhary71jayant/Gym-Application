import WorkoutPlan from "../models/workoutplan.model.js";
import Trainer from "../models/trainer.model.js";
import Member from "../models/member.model.js";
import Notification from "../models/notification.model.js";

const createWorkOutPlan = async ( req, res, next) => {
    try {
        const { title, description, assignedTo, weeklySchedule, goal, duration } = req.body;

        const trainer = await Trainer.findOne({ user : req.user.id });

        if(!trainer){
            return res.status(404).json({
                    success : false,
                    message : "Trainer not found"
            })
        };

        //allowing for the specific trainer to plan for their own assigned members only
        const isAssigned = trainer.assignedMembers.some(
            (memberId) => memberId.toString() === assignedTo
        );

        if(!isAssigned){
            return res.status(403).json({
                success : false,
                message : "You can only create workout plans for assigned members",
            });
        }

        const workoutplan = await WorkoutPlan.create({
            title,
            description,
            createdBy : trainer._id,
            assignedTo,
            weeklySchedule,
            goal,
            durationWeeks,
        });

        const member = await Member.findById(assignedTo);

        await Notification.create({
            recipient : member.user,
            type : "plan_assigned",
            title : "New Workout Plan Assigned",
            message : `Your trainer has assinged you a new workout plan : ${title}`,
            link : `/workoutPlan/${workoutplan._id}`,
        });

        
        res.status(200).json({
            success : true,
            workoutplan,
        });
    } catch (error) {
        next(error);
    }
}


const getMemberWorkouts = async (req,res,next) => {
    try {
        const workoutPlans = await WorkoutPlan.find({ assignedTo : req.params.id })
            .populate("createdBy","user")
            .sort({ createdAt : -1 });
        
        res.status(200).json({
            success : true,
            count : workoutPlans.length,
            workoutPlans,
        });
    } catch (error) {
        next(error);
    }
}

const getWorkoutPlanById =  async (req,res,next) => {
    try {
       const workoutPlan = await WorkoutPlan.findById(req.params.id)
            .populate({
                path : "createdBy",
                populate : { path : "user", select : "name email"},
            })
            .populate({
                path : "assignedTo",
                populate : { path : "user", select : "name email"},
            });

        if(!workoutPlan){
            return res.status(404).json({
                success : false,
                message : "workout plan not found",
            })
        }

        res.status(200).json({
            success : true,
            workoutPlan,
        });
    } catch (error) {
        next(error);
    }
};

const updateWorkoutPlan = async( req,res,next) => {
    try {
        const workoutPlan = await WorkoutPlan.findById(req.params.id);

        if(!workoutPlan){
            return res.status(404).json({
                success : false,
                message : "workout plan not found",
            });
        }

        const trainer = await Trainer.findOne({ user : req.params.id });

        if(workoutPlan.createdBy.toString() !== trianer._id.toString()){
            return res.status(403).json({
                success : false,
                message : "You can only update the plan you have created",
            });
        }

        const { title, description, weeklySchedule, goal, durationWeeks, isActive} = req.body;

        if(title !== undefined) WorkoutPlan.title = title;
        if(description !== undefined) WorkoutPlan.description = description;
        if(weeklySchedule !== undefined) WorkoutPlan.weeklySchedule = weeklySchedule;
        if(goal !== undefined) WorkoutPlan.goal = goal;
        if(durationWeeks !== undefined) WorkoutPlan.durationWeeks = durationWeeks;
        if(isActive !== undefined) WorkoutPlan.isActive = isActive;

        await WorkoutPlan.save();

        res.status(200).json({
            success : true,
            workoutPlan
        });
    } catch (error) {
        next(error);
    }
}

const deleteWorkoutPlan = async (req, res, next) => {
    try {
        const workoutPlan = await WorkoutPlan.findById(req.params.id);

        if(!workoutPlan){
            return res.status(404).json({
                success : false,
                message : "workout plan not found",
            });
        }

        if(req.user.role === "admin"){
            const trainer  = await Trainer.findOne({ user : req.params.id });
            if(workoutPlan.createdBy.toString() !== trainer._id.toString()){
                return res.status(403).json({
                    success : false,
                    message : "You are only allowed to delete the workout you created"
                });
            }
        }

        await workoutPlan.deleteOne();

        res.status(200).json({
            success : true,
            message : "The workoutPlan is deleted successfully."
        })
    } catch (error) {
        next(error);
    }
}

export { createWorkOutPlan, updateWorkoutPlan, deleteWorkoutPlan, getMemberWorkouts, getWorkoutPlanById };