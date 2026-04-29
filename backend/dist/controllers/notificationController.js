"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.markRead = exports.getNotifications = void 0;
const Notification_1 = __importDefault(require("../models/Notification"));
const getNotifications = async (req, res) => {
    try {
        const notifications = await Notification_1.default.find({ user: req.user.id })
            .sort({ createdAt: -1 })
            .limit(50);
        const unreadCount = await Notification_1.default.countDocuments({ user: req.user.id, isRead: false });
        res.json({ notifications, unreadCount });
    }
    catch (err) {
        res.status(500).json({ message: 'Fetch failed', error: err });
    }
};
exports.getNotifications = getNotifications;
const markRead = async (req, res) => {
    try {
        const { id } = req.params;
        if (id === 'all') {
            await Notification_1.default.updateMany({ user: req.user.id }, { isRead: true });
        }
        else {
            await Notification_1.default.findOneAndUpdate({ _id: id, user: req.user.id }, { isRead: true });
        }
        res.json({ message: 'Marked as read' });
    }
    catch (err) {
        res.status(500).json({ message: 'Update failed', error: err });
    }
};
exports.markRead = markRead;
