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

export default registerUser;