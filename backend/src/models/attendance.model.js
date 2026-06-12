import mongoose from "mongoose";
import Member from "./member.model";

const attendanceSchema = new mongoose.Schema({
    member : {
        type : mongoose.Schema.Types.ObjectId,
        ref : "Member",
        required : true,
    },
    date : {
        type : Date,
        required : true,
    },
    checkIn : {
        type : Date,
        required : true,
    },
    checkOut : {
        type : Date,
        required : true,
    },
    status : {
        type : String,
        enum : ["present", "absent", "late"],
        default : "absent",
    },
    notes : {
        type : String,
        default : "",
    },
    missedAlertSent : {
        type : Boolean,
        default : false,
    }
}, { timestamps : true });

attendanceSchema.virtual("sessionDuration").get(function () {
  if (!this.checkIn || !this.checkOut) return null;
  const diff = this.checkOut - this.checkIn;
  return Math.round(diff / (1000 * 60));
});

const Attendance = mongoose.model("Attendance", attendanceSchema);

export default Attendance;