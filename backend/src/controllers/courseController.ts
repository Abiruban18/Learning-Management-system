import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import Course from '../models/Course';
import Enrollment from '../models/Enrollment';
import { CourseProgress, QuizAttempt } from '../models/Progress';
import { MaterialDownload } from '../models/MaterialDownload';

// ── Teacher ───────────────────────────────────────────────────────────────────

export const createCourse = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const course = await Course.create({ ...req.body, teacher: req.user!.id });
    res.status(201).json({ course });
  } catch (err) {
    res.status(500).json({ message: 'Could not create course', error: err });
  }
};

export const updateCourse = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const course = await Course.findOneAndUpdate(
      { _id: req.params.id, teacher: req.user!.id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!course) { res.status(404).json({ message: 'Course not found' }); return; }
    res.json({ course });
  } catch (err) {
    res.status(500).json({ message: 'Update failed', error: err });
  }
};

export const deleteCourse = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await Course.findOneAndDelete({ _id: req.params.id, teacher: req.user!.id });
    res.json({ message: 'Course deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Delete failed', error: err });
  }
};

export const addModule = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const course = await Course.findOneAndUpdate(
      { _id: req.params.id, teacher: req.user!.id },
      { $push: { modules: req.body } },
      { new: true }
    );
    res.json({ course });
  } catch (err) {
    res.status(500).json({ message: 'Could not add module', error: err });
  }
};

export const getEnrolledStudents = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const enrollments = await Enrollment.find({ course: req.params.id })
      .populate('student', 'name email avatar')
      .lean();

    const studentIds = enrollments.map((e: any) => e.student._id);
    const progresses = await CourseProgress.find({ course: req.params.id, student: { $in: studentIds } }).lean();
    const progressMap = new Map(progresses.map(p => [p.student.toString(), p.totalXp]));

    const enriched = enrollments.map((e: any) => ({
      ...e,
      totalXp: progressMap.get(e.student._id.toString()) || 0,
    }));

    enriched.sort((a, b) => b.totalXp - a.totalXp);
    
    res.json({ enrollments: enriched });
  } catch (err) {
    res.status(500).json({ message: 'Fetch failed', error: err });
  }
};

export const getMaterialDownloads = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const downloads = await MaterialDownload.find({ course: req.params.id })
      .populate('student', 'name email avatar')
      .sort({ downloadedAt: -1 })
      .lean();
    res.json({ downloads });
  } catch (err) {
    res.status(500).json({ message: 'Fetch failed', error: err });
  }
};

export const getQuizLeaderboard = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const attempts = await QuizAttempt.find({ quiz: req.params.quizId })
      .populate('student', 'name avatar')
      .sort({ score: -1, timeTakenSeconds: 1 })
      .lean();
    res.json({ attempts });
  } catch (err) {
    res.status(500).json({ message: 'Fetch failed', error: err });
  }
};

// ── Shared (teacher + student) ────────────────────────────────────────────────

export const listCourses = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const courses = await Course.find({ isPublished: true })
      .populate('teacher', 'name');
    res.json({ courses });
  } catch (err) {
    res.status(500).json({ message: 'Fetch failed', error: err });
  }
};

export const getCourseById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const course = await Course.findById(req.params.id).populate('teacher', 'name');
    if (!course) { res.status(404).json({ message: 'Not found' }); return; }
    res.json({ course });
  } catch (err) {
    res.status(500).json({ message: 'Fetch failed', error: err });
  }
};

export const getTeacherCourses = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const courses = await Course.find({ teacher: req.user!.id });
    res.json({ courses });
  } catch (err) {
    res.status(500).json({ message: 'Fetch failed', error: err });
  }
};
