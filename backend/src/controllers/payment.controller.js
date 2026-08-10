import Payment from "../models/payment.model.js";
import Member from "../models/member.model.js";
import Notification from "../models/notification.model.js";

const ensureMemberAccess = async (memberId, user) => {
    const member = await Member.findById(memberId);
    if (!member) return { member: null, allowed: false };
    const allowed = ["admin", "superAdmin"].includes(user.role) || member.user.toString() === user.id;
    return { member, allowed };
};

const createPayment = async (req, res, next) => {
    try {
        const { memberId, amount, paymentMethod, membershipPlan, membershipStart, membershipEnd, notes } = req.body;
        const member = await Member.findById(memberId);
        if (!member) return res.status(404).json({ success: false, message: "Member not found" });

        const payment = await Payment.create({ member: memberId, amount, paymentMethod, membershipPlan, membershipStart, membershipEnd, notes, paymentStatus: "pending" });
        res.status(201).json({ success: true, payment });
    } catch (error) {
        next(error);
    }
};

const updatePaymentStatus = async (req, res, next) => {
    try {
        const { paymentStatus } = req.body;

        const payment = await Payment.findById(req.params.id);

        if (!payment) {
            return res.status(404).json({ success: false, message: "Payment not found" });
        }

        if (!Payment.schema.path("paymentStatus").enumValues.includes(paymentStatus)) {
            return res.status(400).json({ success: false, message: "Invalid payment status" });
        }

        payment.paymentStatus = paymentStatus;

        if(paymentStatus === "success"){
            payment.paidAt = new Date();
        }

        await payment.save();

        const member = await Member.findById(payment.member);

        if(!member){
            return res.status(404).json({
                success : false,
                message : "Member not found."
            });
        }

        if (paymentStatus === "success") {
            member.membershipPlan = payment.membershipPlan;
            member.membershipStart = payment.membershipStart;
            member.membershipEnd = payment.membershipEnd;
            member.membershipStatus = "active";
            member.expiryAlertSent = false;

            await member.save();

            await Notification.create({ 
                recipient: member.user,
                type: "payment_success",
                title: "Payment confirmed", message: `Your ${payment.membershipPlan} membership is active until ${payment.membershipEnd.toDateString()}.`
             });

        } else if (paymentStatus === "failed") {
            await Notification.create({ 
                recipient: member.user, 
                type: "payment_failed", 
                title: "Payment failed", 
                message: "Your membership payment could not be processed. Please contact the gym." 
            });
        }

        res.status(200).json({
            success: true, 
            payment 
        });
    } catch (error) {
        next(error);
    }
};

const getMemberPayments = async (req, res, next) => {
    try {
        const { member, allowed } = await ensureMemberAccess(req.params.id, req.user);
        if (!member) return res.status(404).json({ success: false, message: "Member not found" });
        if (!allowed) return res.status(403).json({ success: false, message: "Access denied" });
        const payments = await Payment.find({ member: member._id }).sort({ createdAt: -1 });
        res.status(200).json({ success: true, count: payments.length, payments });
    } catch (error) {
        next(error);
    }
};

const getPaymentById = async (req, res, next) => {
    try {
        const payment = await Payment.findById(req.params.id).populate({ path: "member", populate: { path: "user", select: "name email phone" } });
        if (!payment) return res.status(404).json({ success: false, message: "Payment not found" });
        const isAdmin = ["admin", "superAdmin"].includes(req.user.role);
        if (!isAdmin && payment.member.user._id.toString() !== req.user.id) return res.status(403).json({ success: false, message: "Access denied" });
        res.status(200).json({ success: true, payment });
    } catch (error) {
        next(error);
    }
};

const getAllPayments = async (req, res, next) => {
    try {
        const filter = req.query.status ? { paymentStatus: req.query.status } : {};
        const payments = await Payment.find(filter)
            .populate({ path: "member", populate: { path: "user", select: "name email" } })
            .sort({ createdAt: -1 });
        res.status(200).json({ success: true, count: payments.length, payments });
    } catch (error) {
        next(error);
    }
};

export { createPayment, updatePaymentStatus, getMemberPayments, getAllPayments, getPaymentById };
