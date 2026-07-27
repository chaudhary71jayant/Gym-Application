import Member from "../models/member.model.js";
import Trainer from "../models/trainer.model.js";
import Attendance from "../models/attendance.model.js";

const startOfToday = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
};

const checkIn = async (req, res, next) => {
    try {
        const member = await Member.findOne({ user: req.user.id });
        if (!member) return res.status(404).json({ success: false, message: "Member profile not found" });
        if (member.membershipStatus !== "active") return res.status(403).json({ success: false, message: "An active membership is required to check in" });

        const date = startOfToday();
        if (await Attendance.findOne({ member: member._id, date })) {
            return res.status(400).json({ success: false, message: "You have already checked in today" });
        }

        const attendance = await Attendance.create({ member: member._id, date, checkIn: new Date(), status: "present" });
        res.status(201).json({ success: true, attendance });
    } catch (error) {
        next(error);
    }
};

const checkOut = async (req, res, next) => {
    try {
        const member = await Member.findOne({ user: req.user.id });
        if (!member) return res.status(404).json({ success: false, message: "Member profile not found" });

        const attendance = await Attendance.findOne({ member: member._id, date: startOfToday() });
        if (!attendance) return res.status(400).json({ success: false, message: "No check-in found for today" });
        if (attendance.checkOut) return res.status(400).json({ success: false, message: "You have already checked out today" });

        attendance.checkOut = new Date();
        await attendance.save();
        res.status(200).json({ success: true, attendance, sessionDuration: attendance.sessionDuration });
    } catch (error) {
        next(error);
    }
};

const getMemberAttendance = async (req, res, next) => {
    try {
        const member = await Member.findById(req.params.id);
        if (!member) return res.status(404).json({ success: false, message: "Member not found" });

        const isSelf = member.user.toString() === req.user.id;
        const isAdmin = ["admin", "superAdmin"].includes(req.user.role);
        const trainer = req.user.role === "trainer" ? await Trainer.findOne({ user: req.user.id, assignedMembers: member._id }) : null;
        if (!isSelf && !isAdmin && !trainer) return res.status(403).json({ success: false, message: "Not authorized to view this attendance" });

        const filter = { member: member._id };
        if (req.query.month && req.query.year) {
            const startDate = new Date(Number(req.query.year), Number(req.query.month) - 1, 1);
            const endDate = new Date(Number(req.query.year), Number(req.query.month), 1);
            filter.date = { $gte: startDate, $lt: endDate };
        }
        const attendance = await Attendance.find(filter).sort({ date: -1 });
        const summary = attendance.reduce((counts, record) => ({ ...counts, [`${record.status}Days`]: counts[`${record.status}Days`] + 1 }), { totalDays: attendance.length, presentDays: 0, absentDays: 0, lateDays: 0 });
        res.status(200).json({ success: true, summary, attendance });
    } catch (error) {
        next(error);
    }
};

const getTodayAttendance = async (req, res, next) => {
    try {
        const attendance = await Attendance.find({ date: startOfToday() })
            .populate({ path: "member", populate: { path: "user", select: "name email phone" } })
            .sort({ checkIn: 1 });
        res.status(200).json({ success: true, count: attendance.length, attendance });
    } catch (error) {
        next(error);
    }
};

export { checkIn, checkOut, getMemberAttendance, getTodayAttendance };
