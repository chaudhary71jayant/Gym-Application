import bcrypt from 'bcrypt';
import User from "../models/user.model.js";
import Member from "../models/member.model.js"
import generateToken from '../utils/tokenGenerator.util.js';


const registerUser = async (req, res, next) => {
    try {
        const { name,email,password,phone,fitnessGoal,membershipPlan,membershipStart,membershipEnd } = req.body;

        const existingUser = await User.findOne({ email });
        if(existingUser){
            return res.status(409).json({
                success : false,
                message : "Email already exist."
            })
        }

        const hashedPassword = await bcrypt.hash(password, 11);

        const user = await User.create({
            name,
            email,
            password : hashedPassword,
            phone,
            role : "member",
        });

        const member = await Member.create({
            user : user._id,
            fitnessGoal,
            membershipPlan,
            membershipStart,
            membershipEnd,
        });

        const token = generateToken(user._id,user.role);

        return res.status(201).json({
            success : true,
            message : "Member registered successfully",
            token,
            user : {
                id : user._id,
                name : user.name,
                email : user.email,
                role : user.role,
            },
            member,
        });
       
    } catch (error) {
        next(error);
    }
}

const loginUser = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        if(!email || !password) {
            return res.status(400).json({
                success : false,
                message : "email and password are required"
            });
        }

        const user = await User.findOne({ email }).select("+password");

        if(!user) {
            return res.status(401).json({
                success : false,
                message : "Invalid email"
            });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if(!isMatch){
            return res.status(401).json({
                success : false,
                message : "Invalid email or password"
            });
        }

        if(!user.isActive){
            return res.status(403).json({
                success : false,
                message : "Account is deactivated. Please contact Admin"
            });
        }

        const token = generateToken(user._id, user._role);

        res.status(200).json({
            success : true,
            token,
            user : {
                id : user._id,
                name : user.name,
                email: user.email,
                role : user.role,
            },
        });
    } catch (error) {
        next(error);
    }
}

const changePassword = async ( req, res, next) => {
    try {
        const { currentPassword, newPassword} = req.body;

        const user = await User.findById(req.user.id).select("+password");

        const isMatch = await bcrypt.compare(password, user.password);

        if(!isMatch){
            return res.status(401).json({
                success : false,
                message : "Current password is incorrect",
            });
        }

        user.password = await bcrypt.hash(newPassword, 12);

        res.status(200).json({
            success : true,
            message : "Password is updated successfully"
        });
    } catch (error) {
        next(error);
    }
}

export {loginUser, registerUser, changePassword };