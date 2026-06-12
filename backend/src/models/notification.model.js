import mongoose from "mongoose";

const notificatinSchema = new mongoose.Schema({
    recipient : {
        type : mongoose.Schema.Types.ObjectId,
        ref : "User",
        required : true,
    },
    type : {
        type : String,
        enum : [
            "membership_expiry",
            "membership_expired",
            "missed_session",
            "plan_assigned",
            "trainer_assigned",
            "payment_success",
            "payment_failed",
            "general",
        ],
        required : true,
    },
    title : {
        type : String,
        required : true,
    },
    message : {
       type : String,
       required : true, 
    },
    isRead : {
        type : Boolean,
        required : true,
    },
    link : {
        type : String,
        default : "",
    }
}, { timestamps : true });

notificatinSchema.index({ recipient : 1, isRead : 1});

const Notification = mongoose.Model("Notification", notificatinSchema);

export default Notification;