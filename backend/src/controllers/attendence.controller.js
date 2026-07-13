
import Member from "../models/member.model.js";
import Attendance from "../models/attendance.model.js";

const checkIn = async (req, res, next) => {
    try {
        const member = await Member.findById(req.params.id);

        if (!member) {
            return res.status(404).json({
                success: false,
                message: "Member not found"
            });
        }

        if (member.membershipStatus !== "active") {
            return res.status(403).json({
                success: false,
                message: "You membership is not active you can't check in."
            });
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const exsitingRecord = await Attendance.findOne({
            member: member._id,
            date: today,
        });

        if (exsitingRecord) {
            return res.status(400).json({
                success: false,
                message: "You have already checked in today"
            });
        }

        const attendance = await Attendance.create({
            member: member._id;
            date: today,
            checkIn: new Date(),
            status: "present"
        });

        res.status(201).json({ success: true, attendance });
    } catch (error) {
        next(error);
    }
}

const checkOut = async (req, res, next) => {
    try {
        const member = await Member.findOne({ user: req.user._id });

        if (!member) {
            return res.status(404).json({
                success: false,
                message: "Member not found"
            });
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const attendance = await Attendance.findOne({
            member: member._id,
            date: today
        });

        if (!attendance) {
            return res.status(400).json({
                success: false,
                message: "No checIn found so there is no check-out"
            });
        }

        if (attendance.checkOut) {
            return res.status(400).json({
                success: false,
                message: "You have already checked out today."
            });
        }

        attendance.checkOut = new Data();
        await attendance.save();

        res.status(200).json({
            success: true,
            attendance,
            sessionDuration: attendance.sessionDuration,
        });
    } catch (error) {
        next(error);
    }
}

const getMemberAttendance = async (req, res, next) => {
    try {
        const { month, year } = req.query;

        let filter = { member: req.user._id };

        if (month && year) {
            const startDate = new Date(year, month - 1, 1);
            const endDate = new Date(year, month, 0);
            filter.date = { $gte: startDate, $lte: endDate };
        }

        const attendance = await Attendance.find(filter).sort({ date: -1 });

        const totalDays = attendance.length;
        const presentDays = attendance.filter((a) => a.status === "present").length;
        const absentDays = attendance.filter((a) => a.status === "absent").length;
        const lateDays = attendance.filter((a) => a.status === "late").length;


        res.status(200).json({
            success: true,
            summary: { totalDays, presentDays, absentDays, lateDays },
            attendance,
        });
    } catch (error) {
        next(error);
    }
}

const getTodayAttendance = async ( req, res, nex) => {
    try {
        const today = new Date();
        today.getHours(0,0,0,0);

        const attendance = await Attendance.find({ date : today })
            .populate({
                path : "member",
                populate : { path : "user", select : "name email phone"},
            })
            .sort({ checkIn : 1 });

        res.status(200).json({
            success : true,
            count : attendance.length,
            attendance,
        })    
    } catch (error) {
        next(error);
    }
}

export { checkIn, checkOut, getMemberAttendance, getTodayAttendance };


