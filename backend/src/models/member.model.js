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
        type : "String",
        enum : ["Weight_loss","muscle_gain","endurance","flexiblity","general_fitness"],
        required : [true,"Fitness goal is required"],
    },
    age : {
        type : Number,
    },
    weight : {
        type : Number,
    },
    
});

const Member = mongoose.model("Member", memberSchema);

export default Member;