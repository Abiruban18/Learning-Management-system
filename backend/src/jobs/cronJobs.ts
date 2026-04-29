import Enrollment from '../models/Enrollment';
import ActivityLog from '../models/ActivityLog';
import Course from '../models/Course';
import User from '../models/User';
import Notification from '../models/Notification';
import { sendDeadlineReminder, sendStreakRiskEmail } from '../services/emailService';

export async function runDeadlineReminders(): Promise<void> {
  try {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayAfter = new Date(tomorrow);
    dayAfter.setDate(dayAfter.getDate() + 1);

    const courses = await Course.find({ isPublished: true });
    for (const course of courses) {
      for (const mod of course.modules) {
        if (!mod.deadline) continue;
        const dl = new Date(mod.deadline);
        if (dl >= tomorrow && dl < dayAfter) {
          const enrollments = await Enrollment.find({ course: course._id, status: 'active' })
            .populate<{ student: any }>('student', 'name email');
          for (const enr of enrollments) {
            const student = enr.student as any;
            if (!student?.email) continue;
            try {
              await sendDeadlineReminder(student.email, student.name, course.title, mod.title, dl);
              await Notification.create({
                user: student._id,
                type: 'deadline',
                title: `Deadline Tomorrow: ${mod.title}`,
                message: `Module "${mod.title}" in ${course.title} is due tomorrow.`,
                link: `/student/my-learning/${course._id}`,
              });
            } catch { /* skip individual failures */ }
          }
        }
      }
    }
    console.log('[CRON] Deadline reminders sent');
  } catch (err) {
    console.error('[CRON] Deadline reminder error:', err);
  }
}

export async function runStreakRiskCheck(): Promise<void> {
  try {
    const today = new Date().toISOString().split('T')[0];
    // Find students who had a streak yesterday but haven't logged in today
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yDate = yesterday.toISOString().split('T')[0];

    const yesterdayLogs = await ActivityLog.find({ date: yDate, streak: { $gte: 3 } })
      .populate<{ student: any }>('student', 'name email');

    for (const log of yesterdayLogs) {
      const todayLog = await ActivityLog.findOne({ student: log.student._id, date: today });
      if (!todayLog) {
        const student = log.student as any;
        if (!student?.email) continue;
        try {
          await sendStreakRiskEmail(student.email, student.name, log.streak);
          await Notification.create({
            user: student._id,
            type: 'streak_risk',
            title: `Your ${log.streak}-day streak is at risk!`,
            message: 'Log in today to keep your streak alive.',
            link: '/student/dashboard',
          });
        } catch { /* skip */ }
      }
    }
    console.log('[CRON] Streak risk check done');
  } catch (err) {
    console.error('[CRON] Streak risk error:', err);
  }
}
