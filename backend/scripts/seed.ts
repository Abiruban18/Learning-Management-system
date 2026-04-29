import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// Assuming running from backend folder via ts-node
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import User from '../src/models/User';
import Course from '../src/models/Course';
import Enrollment from '../src/models/Enrollment';
import Quiz from '../src/models/Quiz';
import { CourseProgress, QuizAttempt } from '../src/models/Progress';
import ActivityLog from '../src/models/ActivityLog';
import { realQuestionsMap } from './quizData';

const seed = async () => {
  try {
    const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/edtech';
    await mongoose.connect(uri);
    console.log('Connected to DB');

    // Create teacher
    const teacherEmail = 'teacher@example.com';
    const password = 'password123';
    
    await User.deleteMany({});
    await Course.deleteMany({});
    await Enrollment.deleteMany({});
    await Quiz.deleteMany({});
    await CourseProgress.deleteMany({});
    await QuizAttempt.deleteMany({});
    await ActivityLog.deleteMany({});
    const teacher = await User.create({
      name: 'John Teacher',
      email: teacherEmail,
      password,
      role: 'teacher'
    });

    // Create 5 students
    const students = await Promise.all([1, 2, 3, 4, 5].map(i => 
      User.create({
        name: `Student ${i}`,
        email: `student${i}@example.com`,
        password,
        role: 'student'
      })
    ));

    // Create Full Stack Course
    // Create Full Stack Course
    const course = await Course.create({
      title: 'Full Stack Development Masterclass',
      description: 'Learn everything from frontend to backend in this comprehensive course.',
      teacher: teacher._id,
      isPublished: true,
      tags: ['fullstack', 'react', 'node', 'express', 'mongodb'],
      totalDuration: 500,
      modules: [1, 2, 3, 4, 5].map(i => ({
        title: `Module ${i}: ${['HTML basics', 'CSS advanced', 'JavaScript Deep Dive', 'React Framework', 'Node Backend'][i-1]}`,
        description: `Learn the fundamentals of part ${i}`,
        order: i,
        materials: [
          {
            title: `Video Lesson ${i}`,
            type: 'video',
            url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
            duration: 10 + i
          }
        ]
      }))
    });

    // Create 5 Quizzes (one per module)
    // Create 5 Quizzes (one per module)
    await Promise.all(course.modules.map((m, i) => 
      Quiz.create({
        course: course._id,
        module: m.title,
        title: `Quiz for ${m.title}`,
        passingScore: 70,
        xpReward: 50,
        questions: realQuestionsMap[m.title] || realQuestionsMap['Module 1: HTML basics']
      })
    ));

    // Save Enrollments
    // Save Enrollments
    await Promise.all(students.map(student => 
      Enrollment.create({
        student: student._id,
        course: course._id,
        completionPercent: 0
      })
    ));

    console.log('--- SEEDING COMPLETED ---');
    console.log('Teacher details:');
    console.log('Email:', teacher.email);
    console.log('Password:', password);
    console.log('');
    console.log('Student details:');
    students.forEach((s) => {
      console.log('Email:', s.email);
      console.log('Password:', password);
    });

    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
};

seed();
