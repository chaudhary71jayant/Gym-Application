import Notification from "../models/notification.model.js";

const getMyNotifications = async (req, res, next) => {
    try {
        const filter = { recipient: req.user.id };
        if (req.query.unread === "true") filter.isRead = false;
        const notifications = await Notification.find(filter).sort({ createdAt: -1 });
        const unreadCount = await Notification.countDocuments({ recipient: req.user.id, isRead: false });
        res.status(200).json({ success: true, unreadCount, count: notifications.length, notifications });
    } catch (error) {
        next(error);
    }
};

const markAsRead = async (req, res, next) => {
    try {
        const notification = await Notification.findById(req.params.id);
        if (!notification) return res.status(404).json({ success: false, message: "Notification not found" });
        if (notification.recipient.toString() !== req.user.id) return res.status(403).json({ success: false, message: "Access denied" });
        notification.isRead = true;
        await notification.save();
        res.status(200).json({ success: true, notification });
    } catch (error) {
        next(error);
    }
};

const markAllAsRead = async (req, res, next) => {
    try {
        await Notification.updateMany({ recipient: req.user.id, isRead: false }, { isRead: true });
        res.status(200).json({ success: true, message: "All notifications are marked as read" });
    } catch (error) {
        next(error);
    }
};

const deleteNotification = async (req, res, next) => {
    try {
        const notification = await Notification.findById(req.params.id);
        if (!notification) return res.status(404).json({ success: false, message: "Notification not found" });
        if (notification.recipient.toString() !== req.user.id) return res.status(403).json({ success: false, message: "Access denied" });
        await notification.deleteOne();
        res.status(200).json({ success: true, message: "Notification deleted" });
    } catch (error) {
        next(error);
    }
};

export { markAllAsRead, markAsRead, getMyNotifications, deleteNotification };
