"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runDeadlineReminders = runDeadlineReminders;
exports.runStreakRiskCheck = runStreakRiskCheck;
const Enrollment_1 = __importDefault(require("../models/Enrollment"));
const ActivityLog_1 = __importDefault(require("../models/ActivityLog"));
const Course_1 = __importDefault(require("../models/Course"));
const Notification_1 = __importDefault(require("../models/Notification"));
const emailService_1 = require("../services/emailService");
async function runDeadlineReminders() {
    try {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const dayAfter = new Date(tomorrow);
        dayAfter.setDate(dayAfter.getDate() + 1);
        const courses = await Course_1.default.find({ isPublished: true });
        for (const course of courses) {
            for (const mod of course.modules) {
                if (!mod.deadline)
                    continue;
                const dl = new Date(mod.deadline);
                if (dl >= tomorrow && dl < dayAfter) {
                    const enrollments = await Enrollment_1.default.find({ course: course._id, status: 'active' })
                        .populate('student', 'name email');
                    for (const enr of enrollments) {
                        const student = enr.student;
                        if (!student?.email)
                            continue;
                        try {
                            await (0, emailService_1.sendDeadlineReminder)(student.email, student.name, course.title, mod.title, dl);
                            await Notification_1.default.create({
                                user: student._id,
                                type: 'deadline',
                                title: `Deadline Tomorrow: ${mod.title}`,
                                message: `Module "${mod.title}" in ${course.title} is due tomorrow.`,
                                link: `/student/my-learning/${course._id}`,
                            });
                        }
                        catch { /* skip individual failures */ }
                    }
                }
            }
        }
        console.log('[CRON] Deadline reminders sent');
    }
    catch (err) {
        console.error('[CRON] Deadline reminder error:', err);
    }
}
async function runStreakRiskCheck() {
    try {
        const today = new Date().toISOString().split('T')[0];
        // Find students who had a streak yesterday but haven't logged in today
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yDate = yesterday.toISOString().split('T')[0];
        const yesterdayLogs = await ActivityLog_1.default.find({ date: yDate, streak: { $gte: 3 } })
            .populate('student', 'name email');
        for (const log of yesterdayLogs) {
            const todayLog = await ActivityLog_1.default.findOne({ student: log.student._id, date: today });
            if (!todayLog) {
                const student = log.student;
                if (!student?.email)
                    continue;
                try {
                    await (0, emailService_1.sendStreakRiskEmail)(student.email, student.name, log.streak);
                    await Notification_1.default.create({
                        user: student._id,
                        type: 'streak_risk',
                        title: `Your ${log.streak}-day streak is at risk!`,
                        message: 'Log in today to keep your streak alive.',
                        link: '/student/dashboard',
                    });
                }
                catch { /* skip */ }
            }
        }
        console.log('[CRON] Streak risk check done');
    }
    catch (err) {
        console.error('[CRON] Streak risk error:', err);
    }
}
