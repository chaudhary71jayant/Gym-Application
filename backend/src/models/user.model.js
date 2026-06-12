import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
    name : {
        type : String,
        required : [true, "Name is required"],
        trim : true,
    },
    email : {
        type : String,
        required : [true, "Email is required"],
        trim : true,
        lowercase : true,
        unique : true,
    },
    password : {
        type : String,
        required : [true, "Name is required"],
        trim : true,
        minlength : 6,
        select : false,
    },
    role : {
        type : String,
        enum : ["admin", "trainer", "member"],
        default : "member",
    },
    profileImage : {
        type : String,
        default : "",
    },
    phone : {
        type : String,
        default : "",
    },
    isActive : {
        type : Boolean,
        default : true,
    }
}, { timestamps : true });

const User = mongoose.model("User", UserSchema);

export default User;
