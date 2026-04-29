"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendDeadlineReminder = sendDeadlineReminder;
exports.sendStreakRiskEmail = sendStreakRiskEmail;
exports.sendCertificateEmail = sendCertificateEmail;
exports.sendNewCourseEmail = sendNewCourseEmail;
const nodemailer_1 = __importDefault(require("nodemailer"));
const transporter = nodemailer_1.default.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});
const from = `"EduQuest" <${process.env.SMTP_USER}>`;
async function sendDeadlineReminder(to, name, courseTitle, moduleTitle, deadline) {
    await transporter.sendMail({
        from,
        to,
        subject: `⏰ Deadline Reminder: ${moduleTitle}`,
        html: `
      <div style="font-family:sans-serif;max-width:500px;margin:auto">
        <h2 style="color:#4f46e5">Hi ${name}!</h2>
        <p>Your module <strong>${moduleTitle}</strong> in <strong>${courseTitle}</strong> is due on <strong>${deadline.toDateString()}</strong>.</p>
        <a href="${process.env.FRONTEND_URL}/student/my-learning" style="display:inline-block;padding:12px 24px;background:#4f46e5;color:white;border-radius:8px;text-decoration:none;margin-top:16px">Go to course →</a>
      </div>
    `,
    });
}
async function sendStreakRiskEmail(to, name, streak) {
    await transporter.sendMail({
        from,
        to,
        subject: `🔥 Don't lose your ${streak}-day streak!`,
        html: `
      <div style="font-family:sans-serif;max-width:500px;margin:auto">
        <h2 style="color:#ea580c">Hey ${name}, your streak is at risk!</h2>
        <p>You have a <strong>${streak}-day streak</strong> on EduQuest. Log in today to keep it alive!</p>
        <a href="${process.env.FRONTEND_URL}/student/dashboard" style="display:inline-block;padding:12px 24px;background:#ea580c;color:white;border-radius:8px;text-decoration:none;margin-top:16px">Keep my streak 🔥</a>
      </div>
    `,
    });
}
async function sendCertificateEmail(to, name, courseTitle, certId) {
    await transporter.sendMail({
        from,
        to,
        subject: `🎓 Certificate of Completion — ${courseTitle}`,
        html: `
      <div style="font-family:sans-serif;max-width:500px;margin:auto">
        <h2 style="color:#16a34a">Congratulations, ${name}!</h2>
        <p>You've completed <strong>${courseTitle}</strong> on EduQuest.</p>
        <p>Your certificate ID: <code style="background:#f1f5f9;padding:4px 8px;border-radius:4px">${certId}</code></p>
        <a href="${process.env.FRONTEND_URL}/student/certificates" style="display:inline-block;padding:12px 24px;background:#16a34a;color:white;border-radius:8px;text-decoration:none;margin-top:16px">View Certificate 🎓</a>
      </div>
    `,
    });
}
async function sendNewCourseEmail(to, name, courseTitle, courseId) {
    await transporter.sendMail({
        from,
        to,
        subject: `📚 New course available: ${courseTitle}`,
        html: `
      <div style="font-family:sans-serif;max-width:500px;margin:auto">
        <h2 style="color:#4f46e5">Hi ${name}!</h2>
        <p>A new course <strong>${courseTitle}</strong> is now available on EduQuest.</p>
        <a href="${process.env.FRONTEND_URL}/student/courses" style="display:inline-block;padding:12px 24px;background:#4f46e5;color:white;border-radius:8px;text-decoration:none;margin-top:16px">Explore now →</a>
      </div>
    `,
    });
}
