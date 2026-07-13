import Payment from "../models/payment.model.js";
import Member from "../models/member.model.js";
import Notification from "../models/notification.model.js";

const createPayment = async (req, res, next) => {
    try {
        const { memberId, amount, paymentMethod, membershipPlan, membershipStart, membershipEnd, notes } = req.body;

        const member = await Member.findById(memberId);

        if (!member) {
            return res.status(404).json({
                success: false,
                message: "Member not found."
            });
        }

        const payment = await Payment.create({
            member : memberId,
            amount,
            paymentMethod,
            membershipEnd,
            membershipStart,
            membershipPlan,
            notes,
            paymentStatus : "Pending"
        });

        res.status(200).json({success : true, payment});

    } catch (error) {
        next(error);
    }
}

const updatePaymentStatus = async( req,res,next) => {
    try {
        const { paymentStatus } = req.body;

        const payment = await Payment.findById(req.params.id);

        if(!payment){
            return res.status(404).json({
                success : false,
                message : "Payment not found."
            });
        }

        payment.paymentStatus = paymentStatus;
        await payment.save();

        if(paymentStatus === "completed") {
            const member = await Member.findById(payment.member);

            member.membershipPlan = payment.membershipPlan;
            member.membershipStart = payment.membershipStart;
            member.membershipEnd = payment.membershipEnd;
            member.membershipStatus = "active";
            member.expiryAlertSent = false;
            await member.save();

            await Notification.create({
                recipient : member.user,
                type : "payment_success",
                title : "Payment Confirmed",
                message : `Your ${payment.membershipPlan} membership has been activated. Valid till ${payment.membershipEnd.toDateString()}.`,
            });
        }

        if(paymentStatus === "failed"){
            const member = await Member.findById(payment.member);
            await Notification.create({
                recipient : member.user,
                type : "payment_failed",
                title : "Payment Failed",
                message : "You membership payment could not be processed. Please contact the gym.",
            });
        }

        res.status(200).json({success : true, payment});
    } catch (error) {
        next(error);
    }
}

const getMemberPayments = async( req,res,next) => {
    try {
        const payment = await Payment.find({ member : req.params.id })
            .sort({ createdAt : -1});
        
        res.status(200).json({
            success : true,
            count : payment.length,
            payment,
        });
    } catch (error) {
        next(error);
    }
}

const getPaymentById = async ( req, res, next) => {
    try {
        const payment = await Payment.findById(req.params.id)
        .populate({
            path : "member",
            populate : { path : "user", select :"name email phone"},
        });

        if(!payment){
            return res.status(404).json({
                success : false,
                message : "Payment not found.",
            });
        }

        res.status(200).json({ success : true, payment});
    } catch (error) {
        next(error);
    }
}


const getAllPayments = async (req, res, next) => {
    try {
        const { status } = req.query;
        const filter = status ? { paymentStatus : status } : {};

        const payment = await Payment.find(filter)
        .populate({
            path : "member",
            populate : { path : "user", select : "name email"},
        })
        .sort({ createdAt : -1});

        res.status(200).json({
            success :true,
            count : payments.length,
            payment,
        });
    } catch (error) {
        next(error);
    }
}

export { createPayment, updatePaymentStatus, getMemberPayments , getAllPayments, getPaymentById }