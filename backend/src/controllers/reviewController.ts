import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import CourseReview from '../models/CourseReview';
import Enrollment from '../models/Enrollment';

export const addReview = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { courseId } = req.params;
    const { rating, comment } = req.body;

    // Only enrolled students can review
    const enrollment = await Enrollment.findOne({ student: req.user!.id, course: courseId });
    if (!enrollment) { res.status(403).json({ message: 'You must be enrolled to review' }); return; }

    const existing = await CourseReview.findOne({ course: courseId, student: req.user!.id });
    if (existing) { res.status(409).json({ message: 'You already reviewed this course' }); return; }

    const review = await CourseReview.create({
      course: courseId,
      student: req.user!.id,
      rating,
      comment,
    });

    res.status(201).json({ review });
  } catch (err) {
    res.status(500).json({ message: 'Review failed', error: err });
  }
};

export const getCourseReviews = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const reviews = await CourseReview.find({ course: req.params.courseId })
      .populate('student', 'name avatar')
      .sort({ createdAt: -1 });

    const avg = reviews.length
      ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
      : 0;

    res.json({ reviews, averageRating: Math.round(avg * 10) / 10, totalReviews: reviews.length });
  } catch (err) {
    res.status(500).json({ message: 'Fetch failed', error: err });
  }
};
