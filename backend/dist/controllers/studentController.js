"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logMaterialDownload = exports.submitQuiz = exports.getActivitySummary = exports.logActivity = exports.completeTask = exports.getCourseProgress = exports.getMyEnrollments = exports.enrollCourse = void 0;
const Enrollment_1 = __importDefault(require("../models/Enrollment"));
const Progress_1 = require("../models/Progress");
const ActivityLog_1 = __importDefault(require("../models/ActivityLog"));
const Course_1 = __importDefault(require("../models/Course"));
const Quiz_1 = __importDefault(require("../models/Quiz"));
const MaterialDownload_1 = require("../models/MaterialDownload");
const badgeService_1 = require("../services/badgeService");
const certificateController_1 = require("./certificateController");
const enrollCourse = async (req, res) => {
    try {
        const { courseId } = req.body;
        const existing = await Enrollment_1.default.findOne({ student: req.user.id, course: courseId });
        if (existing) {
            res.status(409).json({ message: 'Already enrolled' });
            return;
        }
        const enrollment = await Enrollment_1.default.create({ student: req.user.id, course: courseId });
        const course = await Course_1.default.findById(courseId);
        if (course) {
            const tasks = course.modules.flatMap(mod => mod.materials.map(mat => ({ moduleTitle: mod.title, materialTitle: mat.title, isDone: false })));
            await Progress_1.CourseProgress.create({ student: req.user.id, course: courseId, tasks });
        }
        const enrollCount = await Enrollment_1.default.countDocuments({ student: req.user.id });
        await (0, badgeService_1.checkAndAwardBadges)(req.user.id, { firstEnroll: enrollCount === 1 });
        res.status(201).json({ enrollment });
    }
    catch (err) {
        res.status(500).json({ message: 'Enrollment failed', error: err });
    }
};
exports.enrollCourse = enrollCourse;
const getMyEnrollments = async (req, res) => {
    try {
        const enrollments = await Enrollment_1.default.find({ student: req.user.id })
            .populate('course', 'title thumbnail description teacher').lean();
        res.json({ enrollments });
    }
    catch (err) {
        res.status(500).json({ message: 'Fetch failed', error: err });
    }
};
exports.getMyEnrollments = getMyEnrollments;
const getCourseProgress = async (req, res) => {
    try {
        let progress = await Progress_1.CourseProgress.findOne({ student: req.user.id, course: req.params.courseId });
        if (!progress) {
            const course = await Course_1.default.findById(req.params.courseId);
            if (course) {
                const tasks = course.modules.flatMap(mod => mod.materials.map(mat => ({ moduleTitle: mod.title, materialTitle: mat.title, isDone: false })));
                progress = await Progress_1.CourseProgress.create({ student: req.user.id, course: req.params.courseId, tasks });
            }
        }
        res.json({ progress });
    }
    catch (err) {
        res.status(500).json({ message: 'Fetch failed', error: err });
    }
};
exports.getCourseProgress = getCourseProgress;
const completeTask = async (req, res) => {
    try {
        const { courseId, moduleTitle, materialTitle } = req.body;
        let progress = await Progress_1.CourseProgress.findOne({ student: req.user.id, course: courseId });
        if (!progress) {
            const course = await Course_1.default.findById(courseId);
            if (!course) {
                res.status(404).json({ message: 'Course not found' });
                return;
            }
            const tasks = course.modules.flatMap(mod => mod.materials.map(mat => ({ moduleTitle: mod.title, materialTitle: mat.title, isDone: false })));
            progress = await Progress_1.CourseProgress.create({ student: req.user.id, course: courseId, tasks });
        }
        const task = progress.tasks.find(t => t.moduleTitle === moduleTitle && t.materialTitle === materialTitle);
        if (task && !task.isDone) {
            task.isDone = true;
            task.completedAt = new Date();
            progress.totalXp += 20;
            progress.lastActivityAt = new Date();
            await progress.save();
            const done = progress.tasks.filter(t => t.isDone).length;
            const total = progress.tasks.length;
            const pct = Math.round((done / total) * 100);
            await Enrollment_1.default.findOneAndUpdate({ student: req.user.id, course: courseId }, { completionPercent: pct, ...(pct === 100 ? { status: 'completed', completedAt: new Date() } : {}) });
            if (pct === 100) {
                await (0, certificateController_1.issueCertificate)(req.user.id, courseId);
                await (0, badgeService_1.checkAndAwardBadges)(req.user.id, { courseCompleted: true });
            }
            await (0, badgeService_1.checkAndAwardBadges)(req.user.id, { totalXp: progress.totalXp });
        }
        res.json({ progress });
    }
    catch (err) {
        res.status(500).json({ message: 'Update failed', error: err });
    }
};
exports.completeTask = completeTask;
const logActivity = async (req, res) => {
    try {
        const today = new Date().toISOString().split('T')[0];
        const { minutesSpent, courseId } = req.body;
        let log = await ActivityLog_1.default.findOne({ student: req.user.id, date: today });
        if (!log) {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const yDate = yesterday.toISOString().split('T')[0];
            const yLog = await ActivityLog_1.default.findOne({ student: req.user.id, date: yDate });
            const streak = yLog ? yLog.streak + 1 : 1;
            log = await ActivityLog_1.default.create({ student: req.user.id, date: today, streak });
            await (0, badgeService_1.checkAndAwardBadges)(req.user.id, { streak });
        }
        if (minutesSpent)
            log.timeSpentMinutes += minutesSpent;
        if (courseId && !log.coursesActive.some(c => c.toString() === courseId)) {
            log.coursesActive.push(courseId);
        }
        await log.save();
        res.json({ log });
    }
    catch (err) {
        res.status(500).json({ message: 'Log failed', error: err });
    }
};
exports.logActivity = logActivity;
const getActivitySummary = async (req, res) => {
    try {
        const logs = await ActivityLog_1.default.find({ student: req.user.id }).sort({ date: -1 }).limit(30);
        res.json({ logs });
    }
    catch (err) {
        res.status(500).json({ message: 'Fetch failed', error: err });
    }
};
exports.getActivitySummary = getActivitySummary;
const submitQuiz = async (req, res) => {
    try {
        const { quizId, answers, timeTakenSeconds } = req.body;
        const quiz = await Quiz_1.default.findById(quizId);
        if (!quiz) {
            res.status(404).json({ message: 'Quiz not found' });
            return;
        }
        let earned = 0;
        const total = quiz.questions.reduce((s, q) => s + q.points, 0);
        quiz.questions.forEach((q, i) => {
            const chosen = q.options[answers[i]];
            if (chosen?.isCorrect)
                earned += q.points;
        });
        const scorePercent = Math.round((earned / total) * 100);
        const passed = scorePercent >= quiz.passingScore;
        const xpEarned = passed ? quiz.xpReward : Math.round(quiz.xpReward * 0.3);
        const attempt = await Progress_1.QuizAttempt.create({
            student: req.user.id, quiz: quizId, course: quiz.course,
            answers, score: scorePercent, xpEarned, timeTakenSeconds, passed,
        });
        await Progress_1.CourseProgress.findOneAndUpdate({ student: req.user.id, course: quiz.course }, { $inc: { totalXp: xpEarned } });
        const totalAttempts = await Progress_1.QuizAttempt.countDocuments({ student: req.user.id });
        const progress = await Progress_1.CourseProgress.findOne({ student: req.user.id, course: quiz.course });
        await (0, badgeService_1.checkAndAwardBadges)(req.user.id, {
            quizScore: scorePercent,
            totalQuizAttempts: totalAttempts,
            totalXp: progress?.totalXp,
        });
        res.json({ attempt, scorePercent, passed, xpEarned });
    }
    catch (err) {
        res.status(500).json({ message: 'Submission failed', error: err });
    }
};
exports.submitQuiz = submitQuiz;
const logMaterialDownload = async (req, res) => {
    try {
        const { courseId, materialTitle } = req.body;
        await MaterialDownload_1.MaterialDownload.create({ materialTitle, course: courseId, student: req.user.id });
        res.json({ message: 'Download logged' });
    }
    catch (err) {
        res.status(500).json({ message: 'Log failed', error: err });
    }
};
exports.logMaterialDownload = logMaterialDownload;
