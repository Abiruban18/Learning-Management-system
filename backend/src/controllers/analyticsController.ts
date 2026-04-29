import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import Course from '../models/Course';
import Enrollment from '../models/Enrollment';
import { CourseProgress, QuizAttempt } from '../models/Progress';
import ActivityLog from '../models/ActivityLog';

export const getTeacherAnalytics = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const courses = await Course.find({ teacher: req.user!.id });
    const ids = courses.map(c => c._id);

    const totalEnrollments = await Enrollment.countDocuments({ course: { $in: ids } });
    const completed        = await Enrollment.countDocuments({ course: { $in: ids }, status: 'completed' });
    const totalAttempts    = await QuizAttempt.countDocuments({ course: { $in: ids } });
    const passedAttempts   = await QuizAttempt.countDocuments({ course: { $in: ids }, passed: true });

    // Enrollment trend last 30 days
    const trend: { date: string; count: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const count = await Enrollment.countDocuments({
        course: { $in: ids },
        enrolledAt: { $gte: new Date(dateStr), $lt: new Date(new Date(dateStr).getTime() + 86400000) },
      });
      trend.push({ date: dateStr, count });
    }

    // Per-course stats
    const courseStats = await Promise.all(courses.map(async c => {
      const enrolled  = await Enrollment.countDocuments({ course: c._id });
      const done      = await Enrollment.countDocuments({ course: c._id, status: 'completed' });
      const attempts  = await QuizAttempt.countDocuments({ course: c._id });
      const passed    = await QuizAttempt.countDocuments({ course: c._id, passed: true });
      return {
        _id: c._id, title: c.title,
        enrolled, completed: done,
        completionRate: enrolled ? Math.round((done / enrolled) * 100) : 0,
        quizPassRate:   attempts ? Math.round((passed / attempts) * 100) : 0,
      };
    }));

    res.json({
      totalCourses: courses.length,
      totalEnrollments,
      completionRate: totalEnrollments ? Math.round((completed / totalEnrollments) * 100) : 0,
      quizPassRate:   totalAttempts    ? Math.round((passedAttempts / totalAttempts) * 100) : 0,
      trend,
      courseStats,
    });
  } catch (err) { res.status(500).json({ message: 'Analytics failed', error: err }); }
};

export const getStudentWeeklyReport = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);
    const logs = await ActivityLog.find({
      student: req.user!.id,
      createdAt: { $gte: weekAgo },
    });
    const totalMins = logs.reduce((s, l) => s + l.timeSpentMinutes, 0);
    const totalXp   = logs.reduce((s, l) => s + l.xpGained, 0);
    const activeDays = logs.length;

    const completedThisWeek = await Enrollment.countDocuments({
      student: req.user!.id, status: 'completed',
      completedAt: { $gte: weekAgo },
    });

    const quizzesThisWeek = await QuizAttempt.countDocuments({
      student: req.user!.id,
      attemptedAt: { $gte: weekAgo },
    });

    res.json({ totalMins, totalXp, activeDays, completedThisWeek, quizzesThisWeek });
  } catch (err) { res.status(500).json({ message: 'Report failed', error: err }); }
};
