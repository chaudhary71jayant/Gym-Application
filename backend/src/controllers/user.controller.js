import User from "../models/user.model.js";
import Member from "../models/member.model.js";
import Trainer from "../models/trainer.model.js";

const getAllUsers = async(req,resizeBy,next) => {
    try {
        const { role } = req.query;
        const filter = role ? { role } : {};

        const users = await User.find(filter).sort({ createdAt : -1});

        res.status(200).json({
            success : true,
            count : users.length,
            users
        });
    } catch (error) {
        next(error);
    }
}

const getMyProfile = async(req,res,next) => {
    try {
        const user = await User.findById(req.user.id);
        res.status(200).json({
            success : true,
            user
        });
    } catch (error) {
       next(error); 
    }
};

const updateUser = async(req,res,next) => {
    try {
        const { name,phone, profileImage } = req.body;

        const user = await User.findByIdAndUpdate(
            req.user.id,
            {
                name,
                phone,
                profileImage
            },
            {
                new : true,
                runValidators : true
            }
        );

        res.status(200).json({
            sucess : true,
            user,
        });

    } catch (error) {
        next(error);
    }
}

const getUserById = async(req,res,next) => {
    try {
        const user = await User.findById(req.params.id);

        if(!user){
            return res.status(404).json({
                success : false,
                message : "User don't exsists",
            });
        }

        req.status(200).json({
            success : true,
            user,
        });
    } catch (error) {
       next(error); 
    }
}

const updatedUserStatus = async(req,res,next) => {
    try {
        const { isActive } = req.body;

        const user = await User.findByIdAndUpdate(
            req.params.id,
            { isActive },
            { new : true },
        );

        if(!user){
            return res.status(404).json({
                success : false,
                message : "User not exist"
            });
        }

        res.status(200).json({
            success : true,
            message : `User ${isActive ? "activated" : "deactivated"} successfully`,
            user,
        });
    } catch (error) {
        next(error);  
    }
}

const deleteUser = async(req,res,next) => {
    try {
        const user = findById(req.params.id);

        if(!user){
            return res.status(404).json({success : false, message : "User not found"});
        }

        if(user.role === "member"){
            await Member.findOneAndDelete({ user : user._id});
        } else if(user.role === "trainer"){
            await Trainer.findOneAndDelete({ user : user._id});
        }

        await user.deleteOne();

        res.status(200).json({success : true, message : "User deleted successfully"});
    } catch (error) {
        next(error);
    }
};

export { getAllUsers, getMyProfile, getUserById, updateUser, updatedUserStatus, deleteUser }