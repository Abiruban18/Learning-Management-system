import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { generateQuizQuestions, generateSmartFeedback, generateLearningPath } from '../services/aiService';
import { QuizAttempt, CourseProgress } from '../models/Progress';
import Enrollment from '../models/Enrollment';
import Course from '../models/Course';
import Quiz from '../models/Quiz';

export const aiGenerateQuiz = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { topic, count = 5, difficulty = 'medium' } = req.body;
    if (!topic) { res.status(400).json({ message: 'Topic is required' }); return; }
    if (!process.env.OPENAI_API_KEY) { res.status(503).json({ message: 'AI service not configured' }); return; }

    const questions = await generateQuizQuestions(topic, Math.min(count, 10), difficulty);
    res.json({ questions });
  } catch (err: any) {
    res.status(500).json({ message: 'AI generation failed', error: err.message });
  }
};

export const aiSmartFeedback = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { attemptId } = req.params;
    if (!process.env.OPENAI_API_KEY) { res.status(503).json({ message: 'AI service not configured' }); return; }

    const attempt = await QuizAttempt.findOne({ _id: attemptId, student: req.user!.id });
    if (!attempt) { res.status(404).json({ message: 'Attempt not found' }); return; }

    const quiz = await Quiz.findById(attempt.quiz);
    if (!quiz) { res.status(404).json({ message: 'Quiz not found' }); return; }

    const questionResults = quiz.questions.map((q, i) => ({
      question: q.question,
      correct: q.options[attempt.answers[i]]?.isCorrect ?? false,
      explanation: q.explanation,
    }));

    const feedback = await generateSmartFeedback(quiz.title, questionResults);
    res.json({ feedback });
  } catch (err: any) {
    res.status(500).json({ message: 'Feedback generation failed', error: err.message });
  }
};

export const aiLearningPath = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!process.env.OPENAI_API_KEY) { res.status(503).json({ message: 'AI service not configured' }); return; }

    const enrollments = await Enrollment.find({ student: req.user!.id }).populate<{ course: any }>('course', 'title');
    const enrolled = enrollments.map(e => e.course?.title ?? '').filter(Boolean);
    const completed = enrollments.filter(e => e.status === 'completed').map(e => (e.course as any)?.title ?? '');

    // Find weak topics from failed quiz attempts
    const failedAttempts = await QuizAttempt.find({ student: req.user!.id, passed: false }).populate<{ quiz: any }>('quiz', 'title');
    const weakTopics = [...new Set(failedAttempts.map(a => a.quiz?.title ?? '').filter(Boolean))];

    const suggestion = await generateLearningPath(enrolled, completed, weakTopics);
    res.json({ suggestion });
  } catch (err: any) {
    res.status(500).json({ message: 'Learning path generation failed', error: err.message });
  }
};
