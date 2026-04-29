/**
 * Seed a rich demo student account WITHOUT wiping existing data.
 * Run: npx ts-node scripts/seed-demo-student.ts
 *
 * Creates:
 *   - 1 teacher (or reuses existing)
 *   - 4 published courses with 3 modules each
 *   - 1 demo student with:
 *       • All 4 courses 100% completed
 *       • Certificates for all 4 courses
 *       • Quiz attempts (passed) for every module quiz
 *       • 21-day activity streak with XP
 *       • Badges: streak, XP milestones, course complete, quiz master
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import User from '../src/models/User';
import Course from '../src/models/Course';
import Enrollment from '../src/models/Enrollment';
import Quiz from '../src/models/Quiz';
import { CourseProgress, QuizAttempt } from '../src/models/Progress';
import ActivityLog from '../src/models/ActivityLog';
import Certificate from '../src/models/Certificate';
import Badge from '../src/models/Badge';

// ── helpers ──────────────────────────────────────────────────────────────────
const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const daysAgo = (n: number) => new Date(Date.now() - n * 86_400_000);

const COURSE_DATA = [
  {
    title: 'Full Stack Web Development',
    description: 'Master HTML, CSS, JavaScript, React, Node.js and MongoDB from scratch to production.',
    tags: ['javascript', 'react', 'nodejs', 'fullstack'],
    modules: [
      { title: 'HTML & CSS Fundamentals', materials: ['Intro Video', 'Box Model PDF', 'Flexbox Exercise'] },
      { title: 'JavaScript Deep Dive',    materials: ['ES6+ Video', 'Async/Await PDF', 'DOM Project'] },
      { title: 'React & Node Backend',    materials: ['React Hooks Video', 'Express API PDF', 'Full App Project'] },
    ],
  },
  {
    title: 'Python for Data Science',
    description: 'Learn Python, NumPy, Pandas, Matplotlib and build real ML models with scikit-learn.',
    tags: ['python', 'data-science', 'machine-learning'],
    modules: [
      { title: 'Python Basics',        materials: ['Variables Video', 'Functions PDF', 'OOP Exercise'] },
      { title: 'Data Analysis',        materials: ['Pandas Video', 'NumPy PDF', 'EDA Project'] },
      { title: 'Machine Learning 101', materials: ['Regression Video', 'Classification PDF', 'Model Project'] },
    ],
  },
  {
    title: 'UI/UX Design Masterclass',
    description: 'Design beautiful interfaces using Figma, understand user psychology and build design systems.',
    tags: ['design', 'figma', 'ux', 'ui'],
    modules: [
      { title: 'Design Principles',  materials: ['Color Theory Video', 'Typography PDF', 'Wireframe Exercise'] },
      { title: 'Figma Essentials',   materials: ['Components Video', 'Auto Layout PDF', 'Design System Project'] },
      { title: 'User Research',      materials: ['Interviews Video', 'Usability Testing PDF', 'Case Study'] },
    ],
  },
  {
    title: 'Cloud & DevOps Fundamentals',
    description: 'Deploy apps on AWS, automate with Docker & Kubernetes, and set up CI/CD pipelines.',
    tags: ['aws', 'docker', 'devops', 'cloud'],
    modules: [
      { title: 'Linux & Networking',  materials: ['Shell Basics Video', 'Networking PDF', 'SSH Exercise'] },
      { title: 'Docker & Containers', materials: ['Docker Intro Video', 'Compose PDF', 'Container Project'] },
      { title: 'AWS & CI/CD',         materials: ['EC2 & S3 Video', 'GitHub Actions PDF', 'Deploy Project'] },
    ],
  },
];

const QUIZ_QUESTIONS = [
  {
    question: 'What does HTML stand for?',
    options: [
      { text: 'HyperText Markup Language', isCorrect: true },
      { text: 'High Tech Modern Language', isCorrect: false },
      { text: 'HyperText Modern Links',    isCorrect: false },
      { text: 'Home Tool Markup Language', isCorrect: false },
    ],
    points: 10, timeLimitSeconds: 30, explanation: 'HTML = HyperText Markup Language',
  },
  {
    question: 'Which keyword declares a constant in JavaScript?',
    options: [
      { text: 'var',   isCorrect: false },
      { text: 'let',   isCorrect: false },
      { text: 'const', isCorrect: true  },
      { text: 'def',   isCorrect: false },
    ],
    points: 10, timeLimitSeconds: 30, explanation: 'const declares a block-scoped constant.',
  },
  {
    question: 'What is a DataFrame in Pandas?',
    options: [
      { text: 'A 2D labeled data structure', isCorrect: true  },
      { text: 'A type of neural network',    isCorrect: false },
      { text: 'A Python list',               isCorrect: false },
      { text: 'A database table',            isCorrect: false },
    ],
    points: 10, timeLimitSeconds: 30, explanation: 'DataFrame is Pandas\' core 2D data structure.',
  },
];

// ── main ─────────────────────────────────────────────────────────────────────
async function main() {
  const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/edtech';
  await mongoose.connect(uri);
  console.log('✅ Connected to MongoDB');

  // ── 1. Teacher ──────────────────────────────────────────────────────────────
  let teacher = await User.findOne({ email: 'demo.teacher@eduquest.com' });
  if (!teacher) {
    teacher = await User.create({
      name: 'Alex Rivera',
      email: 'demo.teacher@eduquest.com',
      password: 'password123',
      role: 'teacher',
    });
    console.log('👨‍🏫 Created teacher: demo.teacher@eduquest.com');
  } else {
    console.log('👨‍🏫 Reusing teacher: demo.teacher@eduquest.com');
  }

  // ── 2. Demo student ─────────────────────────────────────────────────────────
  await User.deleteOne({ email: 'demo.student@eduquest.com' });
  const student = await User.create({
    name: 'Jordan Lee',
    email: 'demo.student@eduquest.com',
    password: 'password123',
    role: 'student',
  });
  console.log('🎓 Created student: demo.student@eduquest.com');

  // Clean up any leftover data for this student
  await Promise.all([
    Enrollment.deleteMany({ student: student._id }),
    CourseProgress.deleteMany({ student: student._id }),
    QuizAttempt.deleteMany({ student: student._id }),
    ActivityLog.deleteMany({ student: student._id }),
    Certificate.deleteMany({ student: student._id }),
    Badge.deleteMany({ student: student._id }),
  ]);

  // ── 3. Courses ──────────────────────────────────────────────────────────────
  const createdCourses = [];
  for (const cd of COURSE_DATA) {
    let course = await Course.findOne({ title: cd.title, teacher: teacher._id });
    if (!course) {
      course = await Course.create({
        title: cd.title,
        description: cd.description,
        teacher: teacher._id,
        isPublished: true,
        tags: cd.tags,
        totalDuration: rand(300, 600),
        modules: cd.modules.map((m, mi) => ({
          title: m.title,
          description: `In-depth coverage of ${m.title}`,
          order: mi + 1,
          materials: m.materials.map((mat, mati) => ({
            title: mat,
            type: mati === 0 ? 'video' : mati === 1 ? 'pdf' : 'link',
            url: 'https://example.com/material',
            duration: rand(10, 30),
          })),
        })),
      });
      console.log(`📚 Created course: ${cd.title}`);
    } else {
      console.log(`📚 Reusing course: ${cd.title}`);
    }
    createdCourses.push(course);
  }

  // ── 4. Per-course: enroll, progress, quizzes, certificate ──────────────────
  let totalXpAll = 0;

  for (let ci = 0; ci < createdCourses.length; ci++) {
    const course = createdCourses[ci];
    const enrolledAt = daysAgo(rand(25, 40));
    const completedAt = daysAgo(rand(2, 10));

    // Enrollment
    await Enrollment.create({
      student: student._id,
      course: course._id,
      status: 'completed',
      enrolledAt,
      completedAt,
      completionPercent: 100,
    });

    // All tasks done
    const tasks = course.modules.flatMap((mod: any) =>
      mod.materials.map((mat: any) => ({
        moduleTitle: mod.title,
        materialTitle: mat.title,
        isDone: true,
        completedAt: daysAgo(rand(3, 20)),
      }))
    );

    // Quizzes — one per module
    const quizzes = [];
    for (const mod of course.modules as any[]) {
      let quiz = await Quiz.findOne({ course: course._id, module: mod.title });
      if (!quiz) {
        quiz = await Quiz.create({
          course: course._id,
          module: mod.title,
          title: `${mod.title} Quiz`,
          passingScore: 70,
          xpReward: 100,
          questions: QUIZ_QUESTIONS,
        });
      }
      quizzes.push(quiz);
    }

    const quizXp = quizzes.length * 100;
    const taskXp = tasks.length * 20;
    const courseXp = quizXp + taskXp;
    totalXpAll += courseXp;

    await CourseProgress.create({
      student: student._id,
      course: course._id,
      tasks,
      totalXp: courseXp,
      lastActivityAt: completedAt,
    });

    // Quiz attempts (all passed, 90–100%)
    for (const quiz of quizzes) {
      const score = rand(85, 100);
      await QuizAttempt.create({
        student: student._id,
        quiz: quiz._id,
        course: course._id,
        answers: quiz.questions.map((_: any, i: number) => 0), // first option = correct in our seed
        score,
        xpEarned: quiz.xpReward,
        timeTakenSeconds: rand(30, 90),
        passed: true,
        attemptedAt: daysAgo(rand(2, 15)),
      });
    }

    // Certificate
    const certId = `EQ-${Date.now().toString(36).toUpperCase()}-${ci}`;
    await Certificate.create({
      student: student._id,
      course: course._id,
      issuedAt: completedAt,
      certificateId: certId,
    });
    console.log(`🎓 Certificate issued: ${certId} for "${course.title}"`);
  }

  // ── 5. Activity logs — 21-day streak ───────────────────────────────────────
  for (let i = 20; i >= 0; i--) {
    const d = daysAgo(i);
    const dateStr = d.toISOString().split('T')[0];
    await ActivityLog.create({
      student: student._id,
      date: dateStr,
      streak: 21 - i,
      timeSpentMinutes: rand(45, 120),
      xpGained: rand(50, 150),
      coursesActive: createdCourses.map(c => c._id),
    });
  }
  console.log('📅 Created 21-day activity streak');

  // ── 6. Badges ───────────────────────────────────────────────────────────────
  const badges = [
    { type: 'first_enroll',    label: 'First Step',      icon: '🚀' },
    { type: 'streak_3',        label: '3-Day Streak',    icon: '🔥' },
    { type: 'streak_7',        label: 'Week Warrior',    icon: '⚡' },
    { type: 'streak_30',       label: 'Monthly Master',  icon: '🏆' },
    { type: 'quiz_first',      label: 'Quiz Taker',      icon: '🧠' },
    { type: 'quiz_perfect',    label: 'Perfect Score',   icon: '💯' },
    { type: 'quiz_master',     label: 'Quiz Master',     icon: '🎯' },
    { type: 'course_complete', label: 'Course Graduate', icon: '🎓' },
    { type: 'xp_100',          label: 'XP Collector',    icon: '⭐' },
    { type: 'xp_500',          label: 'XP Hunter',       icon: '🌟' },
    { type: 'xp_1000',         label: 'XP Legend',       icon: '👑' },
  ];
  for (const b of badges) {
    await Badge.create({ student: student._id, ...b, earnedAt: daysAgo(rand(1, 15)) });
  }
  console.log(`🏅 Awarded ${badges.length} badges`);

  // ── Summary ─────────────────────────────────────────────────────────────────
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  DEMO STUDENT SEEDED SUCCESSFULLY');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  Email    : demo.student@eduquest.com');
  console.log('  Password : password123');
  console.log('  Courses  : 4 completed');
  console.log('  Certs    : 4 certificates');
  console.log('  Badges   : 11 badges');
  console.log('  Streak   : 21 days');
  console.log(`  Total XP : ~${totalXpAll}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  await mongoose.disconnect();
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
