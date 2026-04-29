import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import Enrollment from '../models/Enrollment';
import { CourseProgress, QuizAttempt } from '../models/Progress';
import ActivityLog from '../models/ActivityLog';
import Course from '../models/Course';
import Quiz from '../models/Quiz';
import { MaterialDownload } from '../models/MaterialDownload';
import { checkAndAwardBadges } from '../services/badgeService';
import { issueCertificate } from './certificateController';

export const enrollCourse = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { courseId } = req.body;
    const existing = await Enrollment.findOne({ student: req.user!.id, course: courseId });
    if (existing) { res.status(409).json({ message: 'Already enrolled' }); return; }
    const enrollment = await Enrollment.create({ student: req.user!.id, course: courseId });
    const course = await Course.findById(courseId);
    if (course) {
      const tasks = course.modules.flatMap(mod =>
        mod.materials.map(mat => ({ moduleTitle: mod.title, materialTitle: mat.title, isDone: false }))
      );
      await CourseProgress.create({ student: req.user!.id, course: courseId, tasks });
    }
    const enrollCount = await Enrollment.countDocuments({ student: req.user!.id });
    await checkAndAwardBadges(req.user!.id, { firstEnroll: enrollCount === 1 });
    res.status(201).json({ enrollment });
  } catch (err) {
    res.status(500).json({ message: 'Enrollment failed', error: err });
  }
};

export const getMyEnrollments = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const enrollments = await Enrollment.find({ student: req.user!.id })
      .populate('course', 'title thumbnail description teacher').lean();
    res.json({ enrollments });
  } catch (err) {
    res.status(500).json({ message: 'Fetch failed', error: err });
  }
};

export const getCourseProgress = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    let progress = await CourseProgress.findOne({ student: req.user!.id, course: req.params.courseId });
    if (!progress) {
      const course = await Course.findById(req.params.courseId);
      if (course) {
        const tasks = course.modules.flatMap(mod =>
          mod.materials.map(mat => ({ moduleTitle: mod.title, materialTitle: mat.title, isDone: false }))
        );
        progress = await CourseProgress.create({ student: req.user!.id, course: req.params.courseId, tasks });
      }
    }
    res.json({ progress });
  } catch (err) {
    res.status(500).json({ message: 'Fetch failed', error: err });
  }
};

export const completeTask = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { courseId, moduleTitle, materialTitle } = req.body;
    let progress = await CourseProgress.findOne({ student: req.user!.id, course: courseId });
    if (!progress) {
      const course = await Course.findById(courseId);
      if (!course) { res.status(404).json({ message: 'Course not found' }); return; }
      const tasks = course.modules.flatMap(mod =>
        mod.materials.map(mat => ({ moduleTitle: mod.title, materialTitle: mat.title, isDone: false }))
      );
      progress = await CourseProgress.create({ student: req.user!.id, course: courseId, tasks });
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
      await Enrollment.findOneAndUpdate(
        { student: req.user!.id, course: courseId },
        { completionPercent: pct, ...(pct === 100 ? { status: 'completed', completedAt: new Date() } : {}) }
      );
      if (pct === 100) {
        await issueCertificate(req.user!.id, courseId);
        await checkAndAwardBadges(req.user!.id, { courseCompleted: true });
      }
      await checkAndAwardBadges(req.user!.id, { totalXp: progress.totalXp });
    }
    res.json({ progress });
  } catch (err) {
    res.status(500).json({ message: 'Update failed', error: err });
  }
};

export const logActivity = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const { minutesSpent, courseId } = req.body;
    let log = await ActivityLog.findOne({ student: req.user!.id, date: today });
    if (!log) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yDate = yesterday.toISOString().split('T')[0];
      const yLog = await ActivityLog.findOne({ student: req.user!.id, date: yDate });
      const streak = yLog ? yLog.streak + 1 : 1;
      log = await ActivityLog.create({ student: req.user!.id, date: today, streak });
      await checkAndAwardBadges(req.user!.id, { streak });
    }
    if (minutesSpent) log.timeSpentMinutes += minutesSpent;
    if (courseId && !log.coursesActive.some(c => c.toString() === courseId)) {
      log.coursesActive.push(courseId);
    }
    await log.save();
    res.json({ log });
  } catch (err) {
    res.status(500).json({ message: 'Log failed', error: err });
  }
};

export const getActivitySummary = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const logs = await ActivityLog.find({ student: req.user!.id }).sort({ date: -1 }).limit(30);
    res.json({ logs });
  } catch (err) {
    res.status(500).json({ message: 'Fetch failed', error: err });
  }
};

export const submitQuiz = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { quizId, answers, timeTakenSeconds } = req.body;
    const quiz = await Quiz.findById(quizId);
    if (!quiz) { res.status(404).json({ message: 'Quiz not found' }); return; }

    let earned = 0;
    const total = quiz.questions.reduce((s, q) => s + q.points, 0);
    quiz.questions.forEach((q, i) => {
      const chosen = q.options[answers[i]];
      if (chosen?.isCorrect) earned += q.points;
    });

    const scorePercent = Math.round((earned / total) * 100);
    const passed = scorePercent >= quiz.passingScore;
    const xpEarned = passed ? quiz.xpReward : Math.round(quiz.xpReward * 0.3);

    const attempt = await QuizAttempt.create({
      student: req.user!.id, quiz: quizId, course: quiz.course,
      answers, score: scorePercent, xpEarned, timeTakenSeconds, passed,
    });

    await CourseProgress.findOneAndUpdate(
      { student: req.user!.id, course: quiz.course },
      { $inc: { totalXp: xpEarned } }
    );

    const totalAttempts = await QuizAttempt.countDocuments({ student: req.user!.id });
    const progress = await CourseProgress.findOne({ student: req.user!.id, course: quiz.course });
    await checkAndAwardBadges(req.user!.id, {
      quizScore: scorePercent,
      totalQuizAttempts: totalAttempts,
      totalXp: progress?.totalXp,
    });

    res.json({ attempt, scorePercent, passed, xpEarned });
  } catch (err) {
    res.status(500).json({ message: 'Submission failed', error: err });
  }
};

export const logMaterialDownload = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { courseId, materialTitle } = req.body;
    await MaterialDownload.create({ materialTitle, course: courseId, student: req.user!.id });
    res.json({ message: 'Download logged' });
  } catch (err) {
    res.status(500).json({ message: 'Log failed', error: err });
  }
};
