import mongoose from "mongoose";

const memberSchema = new mongoose.Schema({
    user : {
        type : mongoose.Schema.Types.ObjectId,
        ref : "User",
        required : true,
        unique : true,
    },
    trainer : {
        type : mongoose.Schema.Types.ObjectId,
        ref : "Trainer",
        default : null,
    },
    fitnessGoal : {
        type : String,
        enum : ["weight_loss", "muscle_gain", "endurance", "flexibility", "general_fitness"],
        required : [true,"Fitness goal is required"],
    },
    age : {
        type : Number,
    },
    weight : {
        type : Number,
    },
    height: {
        type: Number,
    },
    healthConditions: {
        type: String,
        default: "",
    },
    membershipPlan: {
        type: String,
        enum: ["monthly", "quarterly", "half_yearly", "yearly"],
        default: null,
    },
    membershipStart: {
        type: Date,
        default: null,
    },
    membershipEnd: {
        type: Date,
        default: null,
    },
    membershipStatus: {
        type: String,
        enum: ["pending", "active", "expired", "cancelled"],
        default: "active",
    },
    expiryAlertSent: {
        type: Boolean,
        default: false,
    },
}, { timestamps: true });

const Member = mongoose.model("Member", memberSchema);

export default Member;
