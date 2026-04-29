"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCourseReviews = exports.addReview = void 0;
const CourseReview_1 = __importDefault(require("../models/CourseReview"));
const Enrollment_1 = __importDefault(require("../models/Enrollment"));
const addReview = async (req, res) => {
    try {
        const { courseId } = req.params;
        const { rating, comment } = req.body;
        // Only enrolled students can review
        const enrollment = await Enrollment_1.default.findOne({ student: req.user.id, course: courseId });
        if (!enrollment) {
            res.status(403).json({ message: 'You must be enrolled to review' });
            return;
        }
        const existing = await CourseReview_1.default.findOne({ course: courseId, student: req.user.id });
        if (existing) {
            res.status(409).json({ message: 'You already reviewed this course' });
            return;
        }
        const review = await CourseReview_1.default.create({
            course: courseId,
            student: req.user.id,
            rating,
            comment,
        });
        res.status(201).json({ review });
    }
    catch (err) {
        res.status(500).json({ message: 'Review failed', error: err });
    }
};
exports.addReview = addReview;
const getCourseReviews = async (req, res) => {
    try {
        const reviews = await CourseReview_1.default.find({ course: req.params.courseId })
            .populate('student', 'name avatar')
            .sort({ createdAt: -1 });
        const avg = reviews.length
            ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
            : 0;
        res.json({ reviews, averageRating: Math.round(avg * 10) / 10, totalReviews: reviews.length });
    }
    catch (err) {
        res.status(500).json({ message: 'Fetch failed', error: err });
    }
};
exports.getCourseReviews = getCourseReviews;
