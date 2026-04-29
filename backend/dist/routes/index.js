"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authController_1 = require("../controllers/authController");
const courseController_1 = require("../controllers/courseController");
const studentController_1 = require("../controllers/studentController");
const settingsController_1 = require("../controllers/settingsController");
const badgeController_1 = require("../controllers/badgeController");
const certificateController_1 = require("../controllers/certificateController");
const notificationController_1 = require("../controllers/notificationController");
const reviewController_1 = require("../controllers/reviewController");
const aiController_1 = require("../controllers/aiController");
const auth_1 = require("../middleware/auth");
const Quiz_1 = __importDefault(require("../models/Quiz"));
const passport_1 = __importDefault(require("passport"));
require("../config/passport");
const router = (0, express_1.Router)();
router.post('/auth/register', authController_1.register);
router.post('/auth/login', authController_1.login);
router.post('/auth/refresh', authController_1.refreshAccessToken);
router.post('/auth/logout', authController_1.logout);
router.get('/auth/me', auth_1.protect, authController_1.getMe);
router.get('/auth/google', passport_1.default.authenticate('google', { scope: ['profile', 'email'], session: false }));
router.get('/auth/google/callback', passport_1.default.authenticate('google', { session: false, failureRedirect: '/login' }), authController_1.googleCallback);
router.get('/courses', auth_1.protect, courseController_1.listCourses);
router.get('/courses/:id', auth_1.protect, courseController_1.getCourseById);
router.get('/teacher/courses', auth_1.protect, (0, auth_1.requireRole)('teacher'), courseController_1.getTeacherCourses);
router.post('/courses', auth_1.protect, (0, auth_1.requireRole)('teacher'), courseController_1.createCourse);
router.put('/courses/:id', auth_1.protect, (0, auth_1.requireRole)('teacher'), courseController_1.updateCourse);
router.delete('/courses/:id', auth_1.protect, (0, auth_1.requireRole)('teacher'), courseController_1.deleteCourse);
router.post('/courses/:id/modules', auth_1.protect, (0, auth_1.requireRole)('teacher'), courseController_1.addModule);
router.get('/courses/:id/students', auth_1.protect, (0, auth_1.requireRole)('teacher'), courseController_1.getEnrolledStudents);
router.get('/courses/:id/downloads', auth_1.protect, (0, auth_1.requireRole)('teacher'), courseController_1.getMaterialDownloads);
router.get('/courses/:courseId/reviews', auth_1.protect, reviewController_1.getCourseReviews);
router.post('/courses/:courseId/reviews', auth_1.protect, (0, auth_1.requireRole)('student'), reviewController_1.addReview);
router.post('/quizzes', auth_1.protect, (0, auth_1.requireRole)('teacher'), async (req, res) => {
    try {
        const quiz = await Quiz_1.default.create(req.body);
        res.status(201).json({ quiz });
    }
    catch (err) {
        res.status(500).json({ message: 'Failed', error: err });
    }
});
router.get('/quizzes/:id', auth_1.protect, async (req, res) => {
    try {
        const quiz = await Quiz_1.default.findById(req.params.id);
        if (!quiz) {
            res.status(404).json({ message: 'Not found' });
            return;
        }
        if (req.user?.role === 'student') {
            const quizObj = quiz.toObject();
            const sanitized = { ...quizObj, questions: quizObj.questions.map((q) => ({ ...q, options: q.options.map((o) => ({ text: o.text })) })) };
            res.json({ quiz: sanitized });
            return;
        }
        res.json({ quiz });
    }
    catch (err) {
        res.status(500).json({ message: 'Failed', error: err });
    }
});
router.get('/quizzes/:quizId/leaderboard', auth_1.protect, (0, auth_1.requireRole)('teacher'), courseController_1.getQuizLeaderboard);
router.get('/quizzes/course/:courseId', auth_1.protect, async (req, res) => {
    try {
        const quizzes = await Quiz_1.default.find({ course: req.params.courseId }).select('title module questions passingScore xpReward');
        res.json({ quizzes });
    }
    catch (err) {
        res.status(500).json({ message: 'Failed', error: err });
    }
});
router.post('/quizzes/submit', auth_1.protect, (0, auth_1.requireRole)('student'), studentController_1.submitQuiz);
router.post('/enrollments', auth_1.protect, (0, auth_1.requireRole)('student'), studentController_1.enrollCourse);
router.get('/enrollments/mine', auth_1.protect, (0, auth_1.requireRole)('student'), studentController_1.getMyEnrollments);
router.get('/progress/:courseId', auth_1.protect, (0, auth_1.requireRole)('student'), studentController_1.getCourseProgress);
router.post('/progress/complete', auth_1.protect, (0, auth_1.requireRole)('student'), studentController_1.completeTask);
router.post('/activity/log', auth_1.protect, (0, auth_1.requireRole)('student'), studentController_1.logActivity);
router.get('/activity/summary', auth_1.protect, (0, auth_1.requireRole)('student'), studentController_1.getActivitySummary);
router.post('/courses/:id/materials/download', auth_1.protect, (0, auth_1.requireRole)('student'), studentController_1.logMaterialDownload);
router.get('/badges', auth_1.protect, (0, auth_1.requireRole)('student'), badgeController_1.getMyBadges);
router.get('/leaderboard/global', auth_1.protect, badgeController_1.getGlobalLeaderboard);
router.get('/certificates', auth_1.protect, (0, auth_1.requireRole)('student'), certificateController_1.getMyCertificates);
router.get('/certificates/:id/download', auth_1.protect, (0, auth_1.requireRole)('student'), certificateController_1.downloadCertificate);
router.get('/notifications', auth_1.protect, notificationController_1.getNotifications);
router.patch('/notifications/:id/read', auth_1.protect, notificationController_1.markRead);
router.post('/ai/generate-quiz', auth_1.protect, (0, auth_1.requireRole)('teacher'), aiController_1.aiGenerateQuiz);
router.get('/ai/feedback/:attemptId', auth_1.protect, (0, auth_1.requireRole)('student'), aiController_1.aiSmartFeedback);
router.get('/ai/learning-path', auth_1.protect, (0, auth_1.requireRole)('student'), aiController_1.aiLearningPath);
router.get('/settings', auth_1.protect, (0, auth_1.requireRole)('teacher'), settingsController_1.getSettings);
router.put('/settings', auth_1.protect, (0, auth_1.requireRole)('teacher'), settingsController_1.updateSettings);
exports.default = router;
