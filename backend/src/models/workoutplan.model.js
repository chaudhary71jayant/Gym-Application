import mongoose from "mongoose";

const exerciseSchema = new mongoose.Schema({
    name : {
        type : String,
        required : true,
        trim : true,
    },
    sets : {
        type : Number,
        required : true,
    },
    reps : {
        type : Number,
        default : null,
    },
    duration : {
        type : Number,
        default : null,
    },
    restTime : {
        type : Number,
        default : 60
    },
    notes : {
        type : String,
        default : "",
    },

});

const workoutSchema = new mongoose.Schema({
    title : {
        type : String,
        required : true,
    },
    description : {
        type : String,
        default : ""
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Trainer",
      required: true,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Member",
      required: true,
    },
    weeklySchedule: {
      monday:    { type: [exerciseSchema], default: [] },
      tuesday:   { type: [exerciseSchema], default: [] },
      wednesday: { type: [exerciseSchema], default: [] },
      thursday:  { type: [exerciseSchema], default: [] },
      friday:    { type: [exerciseSchema], default: [] },
      saturday:  { type: [exerciseSchema], default: [] },
      sunday:    { type: [exerciseSchema], default: [] },
    },
    goal: {
      type: String,
      enum: ["weight_loss", "muscle_gain", "endurance", "flexibility", "general_fitness"],
    },
    durationWeeks: {
      type: Number,
      required: true,
      min: 1,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
}, {timestamps : true});

const WorkoutPlan = mongoose.model("WorkoutPlan", workoutSchema);

export default WorkoutPlan;
