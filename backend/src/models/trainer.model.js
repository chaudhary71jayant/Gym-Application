import mongoose from "mongoose";

const trainerSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true,
  },
  specialization: {
    type: String,
    enum: [
      "weight_training",
      "cardio",
      "yoga",
      "crossfit",
      "nutrition",
      "rehabilitaion",
      "flexibility",
    ],
    required: [true, "At least one specialization is required"],
  },
  experience: {
    type: Number,
    required: [true, "Exerience is requried"],
    min: 0,
  },
  bio: {
    type: String,
    maxlength: 500,
  },
  assignedMembers: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Member",
    },
  ],
  maxCapacity : {
    type : Number,
    default : 30,
  },
  isAvailable : {
    type : Boolean,
    default : true,
  },
}, { timestamps : true });

trainerSchema.virtual("currentLoad").get(function() {
    return this.assignedMembers.length;
});

trainerSchema.virtual("isFull").get( function () {
    return this.assignedMembers.length >= this.maxCapacity;
});

const Trainer = mongoose.model("Trainer", trainerSchema);

export default Trainer;
