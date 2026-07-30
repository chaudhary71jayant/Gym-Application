import User from "../models/user.model.js";
import Member from "../models/member.model.js";
import Trainer from "../models/trainer.model.js";
import uploadToCloudainary from "../utils/uploading.js";
import bcrypt from "bcrypt";

const getAllAdmins = async ( req, res, next ) => {
    try {
        const admins = await User.find({ role : "admin"}).sort({createdAt : -1});

        res.status(200).json({
            success : true,
            count : admins.length,
            admins
        });
    } catch (error) {
        next(error);
    }
}

const createAdmin = async (req,res,next) =>{
    try {
        const { name , email , phone , password } = req.body;

        const exsisting = await User.findOne({ email });

        if(exsisting){
            return res.status(400).json({
                success : false,
                message : "The admin already exsist."
            });
        }

        const hashedPassword = await bcrypt.hash(password,12);

        const user = await User.create({
            name,
            email,
            phone,
            password : hashedPassword,
            role : "admin",
        });

        res.status(201).json({
            success : true,
            message : "Admin created successfully"
        })
    } catch (error) {
        next(error);
    }
}

const deleteAdmin = async ( req, res, next ) => {
    try {
        const user = await User.findById(req.params.id);

        if(!user){
            return res.status(404).json({
                success : false,
                message : "User not found."
            });
        }

        if(user.role !== "admin") {
            return res.status(403).json({
                success : false,
                message : "Superadmin can only delete admin accounts."
            });
        }

        await user.deleteOne();

        res.status(200).json({success : true, message : "Admin deleted successfully."});
    } catch (error) {
        next(error);
    }
}

const getAllUsers = async(req,res,next) => {
    try {
        const { role } = req.query;
        const filter = {role : { $nin : ["superAdmin", "admin"]}};

        if( role && role !== "superAdmin" && role !== "admin"){
            filter.role = role;
        }

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
        const { name,phone } = req.body;

        const user = await User.findByIdAndUpdate(
            req.user.id,
            {
                name,
                phone,
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

        if(user.role === "superAdmin"){
            return res.status(403).json({
                success : false,
                message : "Access Denied."
            });
        }

        res.status(200).json({
            success : true,
            user,
        });
    } catch (error) {
       next(error); 
    }
}

const uploadProfileImage = async (req,res,next) => {
    try {
        if(!req.file){
            return res.status(400).json({success : false, message : "No image file provided"});
        }

        const result = await uploadToCloudainary(req.file.buffer);

        const user = await User.findByIdAndUpdate(
            req.user.id,
            { profileImage : result.secure_url },
            { new : true }
        );

        res.status(200).json({
            success : true,
            user
        });
    } catch (error) {
        next(error);
    }
};

const updatedUserStatus = async(req,res,next) => {
    try {
        const { isActive } = req.body;

        if(req.user.role !== "admin") {
            return res.status(403).json({
                success : false,
                message : "Only admins can update the status."
            });
        }

        const user = await User.findById(req.params.id);

        if(!user){
            return res.status(404).json({
                success : false,
                message : "User not found."
            });
        }

        if(user.role === "superAdmin"){
            return res.status(403).json({
                success : false,
                message : "Superadmin account cannot be modified."
            });
        }

        user.isActive = isActive;
        await user.save();

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
        const user = await User.findById(req.params.id);

        if(!user){
            return res.status(404).json({success : false, message : "User not found"});
        }

        if(user.role === "superAdmin" || user.role === "admin"){
            return res.status(403).json({
                success : false,
                message : "Admin cannot delete this account"
            });
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

export { createAdmin,getAllAdmins, getAllUsers, deleteAdmin, getMyProfile, getUserById, updateUser, updatedUserStatus, deleteUser, uploadProfileImage,  }
