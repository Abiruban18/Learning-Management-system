"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.aiLearningPath = exports.aiSmartFeedback = exports.aiGenerateQuiz = void 0;
const aiService_1 = require("../services/aiService");
const Progress_1 = require("../models/Progress");
const Enrollment_1 = __importDefault(require("../models/Enrollment"));
const Quiz_1 = __importDefault(require("../models/Quiz"));
const aiGenerateQuiz = async (req, res) => {
    try {
        const { topic, count = 5, difficulty = 'medium' } = req.body;
        if (!topic) {
            res.status(400).json({ message: 'Topic is required' });
            return;
        }
        if (!process.env.OPENAI_API_KEY) {
            res.status(503).json({ message: 'AI service not configured' });
            return;
        }
        const questions = await (0, aiService_1.generateQuizQuestions)(topic, Math.min(count, 10), difficulty);
        res.json({ questions });
    }
    catch (err) {
        res.status(500).json({ message: 'AI generation failed', error: err.message });
    }
};
exports.aiGenerateQuiz = aiGenerateQuiz;
const aiSmartFeedback = async (req, res) => {
    try {
        const { attemptId } = req.params;
        if (!process.env.OPENAI_API_KEY) {
            res.status(503).json({ message: 'AI service not configured' });
            return;
        }
        const attempt = await Progress_1.QuizAttempt.findOne({ _id: attemptId, student: req.user.id });
        if (!attempt) {
            res.status(404).json({ message: 'Attempt not found' });
            return;
        }
        const quiz = await Quiz_1.default.findById(attempt.quiz);
        if (!quiz) {
            res.status(404).json({ message: 'Quiz not found' });
            return;
        }
        const questionResults = quiz.questions.map((q, i) => ({
            question: q.question,
            correct: q.options[attempt.answers[i]]?.isCorrect ?? false,
            explanation: q.explanation,
        }));
        const feedback = await (0, aiService_1.generateSmartFeedback)(quiz.title, questionResults);
        res.json({ feedback });
    }
    catch (err) {
        res.status(500).json({ message: 'Feedback generation failed', error: err.message });
    }
};
exports.aiSmartFeedback = aiSmartFeedback;
const aiLearningPath = async (req, res) => {
    try {
        if (!process.env.OPENAI_API_KEY) {
            res.status(503).json({ message: 'AI service not configured' });
            return;
        }
        const enrollments = await Enrollment_1.default.find({ student: req.user.id }).populate('course', 'title');
        const enrolled = enrollments.map(e => e.course?.title ?? '').filter(Boolean);
        const completed = enrollments.filter(e => e.status === 'completed').map(e => e.course?.title ?? '');
        // Find weak topics from failed quiz attempts
        const failedAttempts = await Progress_1.QuizAttempt.find({ student: req.user.id, passed: false }).populate('quiz', 'title');
        const weakTopics = [...new Set(failedAttempts.map(a => a.quiz?.title ?? '').filter(Boolean))];
        const suggestion = await (0, aiService_1.generateLearningPath)(enrolled, completed, weakTopics);
        res.json({ suggestion });
    }
    catch (err) {
        res.status(500).json({ message: 'Learning path generation failed', error: err.message });
    }
};
exports.aiLearningPath = aiLearningPath;
