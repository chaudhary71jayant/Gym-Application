import Member from "../models/member.model.js";
import Trainer from "../models/trainer.model.js";
import Attendance from "../models/attendance.model.js";
import Payment from "../models/payment.model.js";

const getAdminStats = async ( req, res, next) => {
    try {
        const today = new Date();
        today.setHours(0,0,0,0);

        const sevenDaysLater = new Date(today);
        sevenDaysLater.setDate(today.getDate() + 7);


        const [
            totalMembers,
            activeMembers,
            expiredMembers,
            totalTrainers,
            todayAttendance,
            expiringMembers,
            recentPayments,
            monthlyRevenue
        ] = await Promise.all([
            Member.countDocuments(),
            Member.countDocuments({ membershipStatus : "active"}),
            Member.countDocuments({ membershipStatus : "expired"}),
            Trainer.countDocuments(),
            Attendance.countDocuments({ date : today}),
            Member.find({
                membershipEnd : { $gte : today, $lte : sevenDaysLater},
                membershipStatus : "active",
            })
            .populate("user","name email phone")
            .limit(10)
            .sort({ membershipEnd : 1 }),

            Payment.find()
                .populate({
                    path : "member",
                    populate : { path : "user", select : "name email"}
                })
                .sort({ createdAt : -1 })
                .limit(5),
            
            Payment.aggregate([
                {
                    $match : {
                        paymentStatus : "success",
                        paidAt : {
                            $gte : new Date(today.getFullYear(), today.getMonth(), 1),
                        },
                    },
                },
                {
                    $group : {
                        _id : null,
                        total : { $sum : "$amount"},
                    },
                },
            ]),
        ]);

        res.status(200).json({
            success : true,
            stats : {
                totalMembers,
                activeMembers,
                expiredMembers,
                totalTrainers,
                todayAttendance,
                monthlyRevenue : monthlyRevenue[0]?.total || 0,
                expiringMembers,
                recentPayments,
            },
        });
    } catch (error) {
        next(error);
    }
}

export { getAdminStats };