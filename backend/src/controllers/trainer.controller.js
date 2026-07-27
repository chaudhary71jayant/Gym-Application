import bcrypt from "bcrypt";
import User from "../models/user.model.js";
import Trainer from "../models/trainer.model.js";

const createTrainer = async (req, res, next) => {
    try {
        const { name, email, password, phone, experience, bio, maxCapacity } = req.body;
        const specialization = req.body.specialization ?? req.body.specializations;
        if (!name || !email || !password || !specialization || experience === undefined) {
            return res.status(400).json({ success: false, message: "name, email, password, specialization, and experience are required" });
        }
        if (await User.findOne({ email })) return res.status(409).json({ success: false, message: "Email already exists" });

        const user = await User.create({ name, email, password: await bcrypt.hash(password, 12), phone, role: "trainer" });
        const trainer = await Trainer.create({ user: user._id, specialization, experience, bio, maxCapacity });
        res.status(201).json({ success: true, trainer: { ...trainer.toObject(), user: { id: user._id, name: user.name, email: user.email, phone: user.phone } } });
    } catch (error) {
        next(error);
    }
};

const getAllTrainers = async (req, res, next) => {
    try {
        const trainers = await Trainer.find().populate("user", "name email phone profileImage isActive");
        res.status(200).json({ success: true, count: trainers.length, trainers });
    } catch (error) {
        next(error);
    }
};

const getTrainerById = async (req, res, next) => {
    try {
        const trainer = await Trainer.findById(req.params.id).populate("user", "name email phone profileImage isActive");
        if (!trainer) return res.status(404).json({ success: false, message: "Trainer not found" });
        res.status(200).json({ success: true, trainer });
    } catch (error) {
        next(error);
    }
};

const updateTrainer = async (req, res, next) => {
    try {
        const trainer = await Trainer.findById(req.params.id);
        if (!trainer) return res.status(404).json({ success: false, message: "Trainer not found" });

        const isSelf = trainer.user.toString() === req.user.id;
        const isAdmin = req.user.role === "admin" || req.user.role === "superAdmin";
        if (!isSelf && !isAdmin) return res.status(403).json({ success: false, message: "Not authorized to update this trainer" });

        for (const field of ["specialization", "experience", "bio", "isAvailable"]) {
            if (req.body[field] !== undefined) trainer[field] = req.body[field];
        }
        if (isAdmin && req.body.maxCapacity !== undefined) trainer.maxCapacity = req.body.maxCapacity;

        await trainer.save();
        res.status(200).json({ success: true, trainer });
    } catch (error) {
        next(error);
    }
};

const deleteTrainer = async (req, res, next) => {
    try {
        const trainer = await Trainer.findById(req.params.id);
        if (!trainer) return res.status(404).json({ success: false, message: "Trainer not found" });
        if (trainer.assignedMembers.length > 0) return res.status(400).json({ success: false, message: "Reassign members before deleting this trainer" });

        await User.findByIdAndDelete(trainer.user);
        await trainer.deleteOne();
        res.status(200).json({ success: true, message: "Trainer deleted successfully" });
    } catch (error) {
        next(error);
    }
};

const getAssignedMembers = async (req, res, next) => {
    try {
        const trainer = await Trainer.findById(req.params.id).populate({ path: "assignedMembers", populate: { path: "user", select: "name email phone" } });
        if (!trainer) return res.status(404).json({ success: false, message: "Trainer not found" });

        const isSelf = trainer.user.toString() === req.user.id;
        const isAdmin = req.user.role === "admin" || req.user.role === "superAdmin";
        if (!isSelf && !isAdmin) return res.status(403).json({ success: false, message: "Not authorized to view these members" });

        res.status(200).json({ success: true, count: trainer.assignedMembers.length, members: trainer.assignedMembers });
    } catch (error) {
        next(error);
    }
};

export { createTrainer, getAllTrainers, getTrainerById, getAssignedMembers, deleteTrainer, updateTrainer };
