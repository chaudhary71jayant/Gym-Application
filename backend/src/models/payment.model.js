import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema({
    member : {
        type : mongoose.Schema.Types.ObjectId,
        ref : "Member",
        required : true,
    },
    amount : {
        type : Number,
        required : [true, "Payment amount is required"],
        min : 0,
    },
    currency : {
        type : String,
        default : "INR",
    },
    paymentMethod : {
        type : String,
        enum : ["cash", "upi", "card", "net_banking","razropay","stripe"],
        required : true
    },
    paymentStatus : {
        type : String,
        enum : ["success","failed","pending","refunded"],
        default : "pending"
    },
    transactionID : {
        type : String,
        default : null
    },
    membershipPlan : {
        type : String,
        enum : ["monthly", "quarterly", "half_yearly", "yearly"],
        required : true,
    },
    membershipStart : {
        type : Date,
        required : true,
    },
    membershipEnd : {
        type : Date,
        required : true,
    },
    paidAt : {
        type : Date,
        required: function () {
            return this.paymentStatus === "success";
        },
    },
    notes : {
        type : String,
        default : "",
    },

}, { timestamps : true });

paymentSchema.pre("save", function() {
    if(this.isModified("paymentStatus") && this.paymentStatus === "success") {
        this.paidAt = new Date();
    }
});

const Payment = mongoose.model("Payment", paymentSchema);

export default Payment;
