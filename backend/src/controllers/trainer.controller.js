import bcrypt from 'bcrypt';
import User from '../models/user.model.js';
import Trainer from '../models/trainer.model.js';


const createTrainer = async(req, res, next)=> {
    try {
        const { name , email, password, phone, specializations, experience, bio, maxCapacity } = req.body;

        const existingUser = await User.findOne({ email });

        if(existingUser){
            return res.status(400).json({success : false, message : "Email already exist"});
        }

        const hashedPassword = await bcrypt.hash(password,12);

        const user = await User.create({
            name,
            email,
            password : hashedPassword,
            phone,
            role : "trainer",
        });

        const trianer = await Trainer.create({
            user : user._id,
            specialization,
            experience,
            bio,
            maxCapacity,
        });

        res.status(201).json({
            success : true,
            trainer : {
                ...trainer.toObject(),
                user : { 
                    id : user._id,
                    name : user.name,
                    email : user.email,
                    phone : user.phone
                },
            }
        })
    } catch (error) {
        next(error);
    }
}

const getAllTrainers = async(req,res,next) => {
    try {
        const trainers = await Trainer.find()
            .populate("user","name email phone profileImage isActive");
        
        res.status(200).json({success : true, count : trainers.length, trainers});
    } catch (error) {
        next(error);
    }
}

const getTrainerById = async(req,res,next) => {
    try {
        const trainer = await Trainer.findById(req.params.id);

        if(!trainer){
            return res.status(404).json({success:false, message : "trainer not found"});
        }

        const isSelf = trainer.user.toString() === req.user.id;
        const isAdmin = req.user.role === "admin";

        if(!isAdmin && !isSelf){
            return res.status(403).json({success : false, message : "Not authorize to update this profile "});
        }

        const { specializations, experience, bio , isAvailable, maxCapacity} = req.body;

        if(specializations !== undefined) trainer.specializations = specializations;
        if(experience !== undefined) trainer.experience = experience;
        if(bio !== undefined) trainer.bio = bio;
        if(isAvailable !== undefined) trainer.isAvailable = isAvailable;

        if(maxCapacity !== undefined && isAdmin){
            trainer.maxCapacity = maxCapacity;
        }

        await trainer.save();

        res.status(200).json({success : true, trainer});
    } catch(error){
        next(error);
    }
};

const deleteTrainer = async(req,res,next) => {
    try {
       const trainer = await Trainer.findById(req.params.id);
       
       if(!trainer){
        return res.status(404).jsont({success : false, message : "Trainer not found"});
       }

       if(trainer.assignedMembers.length > 0){
        return res.status(400).json({
            success : false,
            message : "cannot delete a trainer having the members assigned, Reassign members to another trainer first"
        });
       }

       await User.findByIdAndDelete(trainer.user);
       await trainer.deleteOne();

       res.status(200).json({success:true,message :"Trainer deleted successfully"});
    } catch (error) {
        next(error);
    }
}

const getAssignedMembers = async(req,res,next) => {
    try {
        const trainer = await Trainer.findById(req.params.id).populate({
            path : "assignedMembers",
            populate : { path : "user", select : " name email phone"}
        });

        if(!trianer){
            return res.status(404).json({success : false, message : "trainer not found"});
        }

        const isSelf = trainer.user.toString() === req.user.id;
        const isAdmin = req.user.role === "admin";

        if(!isSelf && !isAdmin){
            return res.status(403).json({
                success : false,
                message : "Not authorized to view these members"
            });
        }

        res.status(200).json({
            success : true,
            count : trainer.assignedMembers.length,
            members : trainer.assignedMembers,
        })
    } catch (error) {
        next(error);
    }
}

export { createTrainer, getAllTrainers, getTrainerById, getAssignedMembers, deleteTrainer  }

