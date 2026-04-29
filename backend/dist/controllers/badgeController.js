"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getGlobalLeaderboard = exports.getMyBadges = void 0;
const Badge_1 = __importDefault(require("../models/Badge"));
const Progress_1 = require("../models/Progress");
const badgeService_1 = require("../services/badgeService");
const getMyBadges = async (req, res) => {
    try {
        const badges = await Badge_1.default.find({ student: req.user.id }).sort({ earnedAt: -1 });
        const progresses = await Progress_1.CourseProgress.find({ student: req.user.id });
        const totalXp = progresses.reduce((s, p) => s + p.totalXp, 0);
        const levelInfo = (0, badgeService_1.getXpLevel)(totalXp);
        res.json({ badges, totalXp, ...levelInfo });
    }
    catch (err) {
        res.status(500).json({ message: 'Fetch failed', error: err });
    }
};
exports.getMyBadges = getMyBadges;
const getGlobalLeaderboard = async (_req, res) => {
    try {
        const result = await Progress_1.CourseProgress.aggregate([
            { $group: { _id: '$student', totalXp: { $sum: '$totalXp' } } },
            { $sort: { totalXp: -1 } },
            { $limit: 50 },
            { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'student' } },
            { $unwind: '$student' },
            { $project: { _id: 0, studentId: '$_id', name: '$student.name', avatar: '$student.avatar', totalXp: 1 } },
        ]);
        const leaderboard = result.map((r, i) => {
            const { level, rank: xpRank, nextLevelXp } = (0, badgeService_1.getXpLevel)(r.totalXp);
            return { ...r, rank: i + 1, level, xpRank, nextLevelXp };
        });
        res.json({ leaderboard });
    }
    catch (err) {
        res.status(500).json({ message: 'Fetch failed', error: err });
    }
};
exports.getGlobalLeaderboard = getGlobalLeaderboard;
