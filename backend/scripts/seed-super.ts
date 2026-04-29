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
import { realQuestionsMap } from './quizData';

const seedSuper = async () => {
  try {
    const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/edtech';
    await mongoose.connect(uri);
    console.log('Connected to DB');

    await User.deleteMany({});
    await Course.deleteMany({});
    await Enrollment.deleteMany({});
    await Quiz.deleteMany({});
    await CourseProgress.deleteMany({});
    await QuizAttempt.deleteMany({});
    await ActivityLog.deleteMany({});
    
    // 1. Create Teacher
    const teacher = await User.create({
      email: 'superteacher@example.com',
      name: 'Super Teacher',
      password: 'password123',
      role: 'teacher'
    });

    // 2. Create Student
    const student = await User.create({
      email: 'superstudent@example.com',
      name: 'Max Superstudent',
      password: 'password123',
      role: 'student'
    });

    // Activity Logs for 15 days
    // Activity Logs for 15 days
    const today = new Date();
    for (let i = 14; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      await ActivityLog.create({
        student: student._id,
        date: dateStr,
        streak: 15 - i,
        timeSpentMinutes: 60 + Math.floor(Math.random() * 60),
        coursesActive: []
      });
    }

    // Prepare arrays
    const courses = [];

    for (let c = 1; c <= 4; c++) {
      // 3. Create Courses
      const course = await Course.create({
        title: `Advanced Masterclass ${c}`,
        description: `This is an intensive course covering level ${c} skills in modern tech.`,
        teacher: teacher._id,
        isPublished: true,
        tags: ['advanced', 'masterclass', `topic${c}`],
        totalDuration: 500 + c * 50,
        modules: [1, 2, 3].map(m => ({
          title: `Module ${m} of Course ${c}`,
          description: `Deep dive into part ${m}`,
          order: m,
          materials: [
            { title: `Video Lesson ${m}.1`, type: 'video', url: 'https://youtube.com', duration: 15 },
            { title: `Reading ${m}.2`, type: 'pdf', url: 'https://example.com/doc', duration: 20 },
          ]
        }))
      });
      courses.push(course);

      // Create Quizzes for Course
      const quizzes = await Promise.all(course.modules.map((mod, i) =>
        Quiz.create({
          course: course._id,
          module: mod.title,
          title: `Quiz for ${mod.title}`,
          passingScore: 70,
          xpReward: 100,
          questions: realQuestionsMap[mod.title] || realQuestionsMap['Module 1: HTML basics']
        })
      ));

      // 4. Enroll Student
      const enrollment = await Enrollment.create({
        student: student._id,
        course: course._id,
        completionPercent: 100,
        status: 'completed',
        enrolledAt: new Date(today.getTime() - 10 * 24 * 60 * 60 * 1000),
        completedAt: new Date()
      });

      // 5. Create Progress
      const tasks = course.modules.flatMap(mod =>
        mod.materials.map(mat => ({
          moduleTitle: mod.title,
          materialTitle: mat.title,
          isDone: true,
          completedAt: new Date(today.getTime() - Math.random() * 5 * 24 * 60 * 60 * 1000)
        }))
      );
      
      const totalXp = quizzes.reduce((sum, q) => sum + q.xpReward, 0) + tasks.length * 20;

      await CourseProgress.create({
        student: student._id,
        course: course._id,
        tasks,
        totalXp,
        lastActivityAt: new Date()
      });

      // 6. Create Quiz Attempts
      await Promise.all(quizzes.map(q => 
        QuizAttempt.create({
          student: student._id,
          quiz: q._id,
          course: q.course,
          answers: [0, 0], // Assuming 0 is correct based on the creation logic above
          score: 100,
          xpEarned: q.xpReward,
          timeTakenSeconds: 45,
          passed: true
        })
      ));
    }

    console.log('--- SUPER DEMO SEEDING COMPLETED ---');
    console.log('Teacher Login:');
    console.log('Email:', teacher.email);
    console.log('Password: password123');
    console.log('---');
    console.log('Student Login:');
    console.log('Email:', student.email);
    console.log('Password: password123');

    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
};

seedSuper();
