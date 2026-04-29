import { Router } from 'express';
import { register, login, getMe, refreshAccessToken, logout, googleCallback } from '../controllers/authController';
import {
  createCourse, updateCourse, deleteCourse, addModule,
  listCourses, getCourseById, getTeacherCourses, getEnrolledStudents,
  getMaterialDownloads, getQuizLeaderboard
} from '../controllers/courseController';
import {
  enrollCourse, getMyEnrollments, getCourseProgress, completeTask,
  logActivity, getActivitySummary, submitQuiz, logMaterialDownload
} from '../controllers/studentController';
import { getSettings, updateSettings } from '../controllers/settingsController';
import { getMyBadges, getGlobalLeaderboard } from '../controllers/badgeController';
import { getMyCertificates, downloadCertificate } from '../controllers/certificateController';
import { getNotifications, markRead } from '../controllers/notificationController';
import { addReview, getCourseReviews } from '../controllers/reviewController';
import { aiGenerateQuiz, aiSmartFeedback, aiLearningPath } from '../controllers/aiController';
import { awardGameXp } from '../controllers/gameController';
import { getTeacherAnalytics, getStudentWeeklyReport } from '../controllers/analyticsController';
import { getDailyChallenge, submitDailyChallenge } from '../controllers/dailyChallengeController';
import { protect, requireRole } from '../middleware/auth';
import Quiz from '../models/Quiz';
import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import passport from 'passport';
import '../config/passport';

const router = Router();

router.post('/auth/register', register);
router.post('/auth/login', login);
router.post('/auth/refresh', refreshAccessToken);
router.post('/auth/logout', logout);
router.get('/auth/me', protect, getMe);
router.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'], session: false }));
router.get('/auth/google/callback', passport.authenticate('google', { session: false, failureRedirect: '/login' }), googleCallback);

router.get('/courses', protect, listCourses);
router.get('/courses/:id', protect, getCourseById);
router.get('/teacher/courses', protect, requireRole('teacher'), getTeacherCourses);
router.post('/courses', protect, requireRole('teacher'), createCourse);
router.put('/courses/:id', protect, requireRole('teacher'), updateCourse);
router.delete('/courses/:id', protect, requireRole('teacher'), deleteCourse);
router.post('/courses/:id/modules', protect, requireRole('teacher'), addModule);
router.get('/courses/:id/students', protect, requireRole('teacher'), getEnrolledStudents);
router.get('/courses/:id/downloads', protect, requireRole('teacher'), getMaterialDownloads);
router.get('/courses/:courseId/reviews', protect, getCourseReviews);
router.post('/courses/:courseId/reviews', protect, requireRole('student'), addReview);

router.post('/quizzes', protect, requireRole('teacher'), async (req: AuthRequest, res: Response) => {
  try { const quiz = await Quiz.create(req.body); res.status(201).json({ quiz }); }
  catch (err) { res.status(500).json({ message: 'Failed', error: err }); }
});

router.get('/quizzes/:id', protect, async (req: AuthRequest, res: Response) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) { res.status(404).json({ message: 'Not found' }); return; }
    res.json({ quiz });
  } catch (err) { res.status(500).json({ message: 'Failed', error: err }); }
});

router.get('/quizzes/:quizId/leaderboard', protect, requireRole('teacher'), getQuizLeaderboard);
router.get('/quizzes/course/:courseId', protect, async (req: AuthRequest, res: Response) => {
  try {
    const quizzes = await Quiz.find({ course: req.params.courseId }).select('title module questions passingScore xpReward');
    res.json({ quizzes });
  } catch (err) { res.status(500).json({ message: 'Failed', error: err }); }
});
router.post('/quizzes/submit', protect, requireRole('student'), submitQuiz);

router.post('/enrollments', protect, requireRole('student'), enrollCourse);
router.get('/enrollments/mine', protect, requireRole('student'), getMyEnrollments);
router.get('/progress/:courseId', protect, requireRole('student'), getCourseProgress);
router.post('/progress/complete', protect, requireRole('student'), completeTask);
router.post('/activity/log', protect, requireRole('student'), logActivity);
router.get('/activity/summary', protect, requireRole('student'), getActivitySummary);
router.post('/courses/:id/materials/download', protect, requireRole('student'), logMaterialDownload);

router.get('/badges', protect, requireRole('student'), getMyBadges);
router.get('/leaderboard/global', protect, getGlobalLeaderboard);

router.get('/certificates', protect, requireRole('student'), getMyCertificates);
router.get('/certificates/:id/download', protect, requireRole('student'), downloadCertificate);

router.get('/notifications', protect, getNotifications);
router.patch('/notifications/all/read', protect, markRead);
router.patch('/notifications/:id/read', protect, markRead);

router.post('/ai/generate-quiz', protect, requireRole('teacher'), aiGenerateQuiz);
router.get('/ai/feedback/:attemptId', protect, requireRole('student'), aiSmartFeedback);
router.get('/ai/learning-path', protect, requireRole('student'), aiLearningPath);

router.post('/games/award-xp', protect, requireRole('student'), awardGameXp);

// ── Analytics ─────────────────────────────────────────────────────────────────
router.get('/analytics/teacher',        protect, requireRole('teacher'), getTeacherAnalytics);
router.get('/analytics/weekly-report',  protect, requireRole('student'), getStudentWeeklyReport);

// ── Daily Challenge ───────────────────────────────────────────────────────────
router.get('/daily-challenge',         protect, requireRole('student'), getDailyChallenge);
router.post('/daily-challenge/submit', protect, requireRole('student'), submitDailyChallenge);

// ── Course Leaderboard ────────────────────────────────────────────────────────
router.get('/leaderboard/course/:courseId', protect, async (req: AuthRequest, res: Response) => {
  try {
    const { CourseProgress } = await import('../models/Progress');
    const User = (await import('../models/User')).default;
    const progresses = await CourseProgress.find({ course: req.params.courseId })
      .sort({ totalXp: -1 }).limit(20).populate('student', 'name avatar');
    const leaderboard = progresses.map((p, i) => ({
      rank: i + 1,
      studentId: (p.student as any)._id,
      name: (p.student as any).name,
      avatar: (p.student as any).avatar,
      totalXp: p.totalXp,
    }));
    res.json({ leaderboard });
  } catch (err) { res.status(500).json({ message: 'Leaderboard failed', error: err }); }
});

router.get('/settings', protect, requireRole('teacher'), getSettings);
router.put('/settings', protect, requireRole('teacher'), updateSettings);

// ── Profile ───────────────────────────────────────────────────────────────────
router.get('/profile', protect, async (req: AuthRequest, res: Response) => {
  try {
    const User = (await import('../models/User')).default;
    const user = await User.findById(req.user!.id).select('-password');
    if (!user) { res.status(404).json({ message: 'User not found' }); return; }
    res.json({ user });
  } catch (err) { res.status(500).json({ message: 'Fetch failed', error: err }); }
});

router.put('/profile', protect, async (req: AuthRequest, res: Response) => {
  try {
    const User = (await import('../models/User')).default;
    const { name, avatar } = req.body;
    const user = await User.findByIdAndUpdate(req.user!.id, { name, avatar }, { new: true }).select('-password');
    res.json({ user });
  } catch (err) { res.status(500).json({ message: 'Update failed', error: err }); }
});

export default router;
