"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTeacherCourses = exports.getCourseById = exports.listCourses = exports.getQuizLeaderboard = exports.getMaterialDownloads = exports.getEnrolledStudents = exports.addModule = exports.deleteCourse = exports.updateCourse = exports.createCourse = void 0;
const Course_1 = __importDefault(require("../models/Course"));
const Enrollment_1 = __importDefault(require("../models/Enrollment"));
const Progress_1 = require("../models/Progress");
const MaterialDownload_1 = require("../models/MaterialDownload");
// ── Teacher ───────────────────────────────────────────────────────────────────
const createCourse = async (req, res) => {
    try {
        const course = await Course_1.default.create({ ...req.body, teacher: req.user.id });
        res.status(201).json({ course });
    }
    catch (err) {
        res.status(500).json({ message: 'Could not create course', error: err });
    }
};
exports.createCourse = createCourse;
const updateCourse = async (req, res) => {
    try {
        const course = await Course_1.default.findOneAndUpdate({ _id: req.params.id, teacher: req.user.id }, req.body, { new: true, runValidators: true });
        if (!course) {
            res.status(404).json({ message: 'Course not found' });
            return;
        }
        res.json({ course });
    }
    catch (err) {
        res.status(500).json({ message: 'Update failed', error: err });
    }
};
exports.updateCourse = updateCourse;
const deleteCourse = async (req, res) => {
    try {
        await Course_1.default.findOneAndDelete({ _id: req.params.id, teacher: req.user.id });
        res.json({ message: 'Course deleted' });
    }
    catch (err) {
        res.status(500).json({ message: 'Delete failed', error: err });
    }
};
exports.deleteCourse = deleteCourse;
const addModule = async (req, res) => {
    try {
        const course = await Course_1.default.findOneAndUpdate({ _id: req.params.id, teacher: req.user.id }, { $push: { modules: req.body } }, { new: true });
        res.json({ course });
    }
    catch (err) {
        res.status(500).json({ message: 'Could not add module', error: err });
    }
};
exports.addModule = addModule;
const getEnrolledStudents = async (req, res) => {
    try {
        const enrollments = await Enrollment_1.default.find({ course: req.params.id })
            .populate('student', 'name email avatar')
            .lean();
        const studentIds = enrollments.map((e) => e.student._id);
        const progresses = await Progress_1.CourseProgress.find({ course: req.params.id, student: { $in: studentIds } }).lean();
        const progressMap = new Map(progresses.map(p => [p.student.toString(), p.totalXp]));
        const enriched = enrollments.map((e) => ({
            ...e,
            totalXp: progressMap.get(e.student._id.toString()) || 0,
        }));
        enriched.sort((a, b) => b.totalXp - a.totalXp);
        res.json({ enrollments: enriched });
    }
    catch (err) {
        res.status(500).json({ message: 'Fetch failed', error: err });
    }
};
exports.getEnrolledStudents = getEnrolledStudents;
const getMaterialDownloads = async (req, res) => {
    try {
        const downloads = await MaterialDownload_1.MaterialDownload.find({ course: req.params.id })
            .populate('student', 'name email avatar')
            .sort({ downloadedAt: -1 })
            .lean();
        res.json({ downloads });
    }
    catch (err) {
        res.status(500).json({ message: 'Fetch failed', error: err });
    }
};
exports.getMaterialDownloads = getMaterialDownloads;
const getQuizLeaderboard = async (req, res) => {
    try {
        const attempts = await Progress_1.QuizAttempt.find({ quiz: req.params.quizId })
            .populate('student', 'name avatar')
            .sort({ score: -1, timeTakenSeconds: 1 })
            .lean();
        res.json({ attempts });
    }
    catch (err) {
        res.status(500).json({ message: 'Fetch failed', error: err });
    }
};
exports.getQuizLeaderboard = getQuizLeaderboard;
// ── Shared (teacher + student) ────────────────────────────────────────────────
const listCourses = async (_req, res) => {
    try {
        const courses = await Course_1.default.find({ isPublished: true })
            .populate('teacher', 'name');
        res.json({ courses });
    }
    catch (err) {
        res.status(500).json({ message: 'Fetch failed', error: err });
    }
};
exports.listCourses = listCourses;
const getCourseById = async (req, res) => {
    try {
        const course = await Course_1.default.findById(req.params.id).populate('teacher', 'name');
        if (!course) {
            res.status(404).json({ message: 'Not found' });
            return;
        }
        res.json({ course });
    }
    catch (err) {
        res.status(500).json({ message: 'Fetch failed', error: err });
    }
};
exports.getCourseById = getCourseById;
const getTeacherCourses = async (req, res) => {
    try {
        const courses = await Course_1.default.find({ teacher: req.user.id });
        res.json({ courses });
    }
    catch (err) {
        res.status(500).json({ message: 'Fetch failed', error: err });
    }
};
exports.getTeacherCourses = getTeacherCourses;
