"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.downloadCertificate = exports.getMyCertificates = void 0;
exports.issueCertificate = issueCertificate;
const Certificate_1 = __importDefault(require("../models/Certificate"));
const Course_1 = __importDefault(require("../models/Course"));
const User_1 = __importDefault(require("../models/User"));
const certificateService_1 = require("../services/certificateService");
const emailService_1 = require("../services/emailService");
const nanoid_1 = require("../utils/nanoid");
const getMyCertificates = async (req, res) => {
    try {
        const certs = await Certificate_1.default.find({ student: req.user.id })
            .populate('course', 'title thumbnail')
            .sort({ issuedAt: -1 });
        res.json({ certificates: certs });
    }
    catch (err) {
        res.status(500).json({ message: 'Fetch failed', error: err });
    }
};
exports.getMyCertificates = getMyCertificates;
const downloadCertificate = async (req, res) => {
    try {
        const cert = await Certificate_1.default.findOne({ _id: req.params.id, student: req.user.id })
            .populate('course', 'title teacher')
            .populate('student', 'name email');
        if (!cert) {
            res.status(404).json({ message: 'Certificate not found' });
            return;
        }
        const course = await Course_1.default.findById(cert.course._id).populate('teacher', 'name');
        const student = await User_1.default.findById(req.user.id);
        if (!course || !student) {
            res.status(404).json({ message: 'Data not found' });
            return;
        }
        const pdfBuffer = await (0, certificateService_1.generateCertificatePDF)({
            studentName: student.name,
            courseTitle: course.title,
            teacherName: course.teacher.name,
            certId: cert.certificateId,
            issuedAt: cert.issuedAt,
        });
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="certificate-${cert.certificateId}.pdf"`);
        res.send(pdfBuffer);
    }
    catch (err) {
        res.status(500).json({ message: 'Generation failed', error: err });
    }
};
exports.downloadCertificate = downloadCertificate;
/** Called internally when a student completes a course */
async function issueCertificate(studentId, courseId) {
    const existing = await Certificate_1.default.findOne({ student: studentId, course: courseId });
    if (existing)
        return;
    const certId = `EQ-${(0, nanoid_1.nanoid)(8).toUpperCase()}`;
    await Certificate_1.default.create({ student: studentId, course: courseId, certificateId: certId });
    // Send email
    try {
        const [student, course] = await Promise.all([
            User_1.default.findById(studentId),
            Course_1.default.findById(courseId),
        ]);
        if (student && course) {
            await (0, emailService_1.sendCertificateEmail)(student.email, student.name, course.title, certId);
        }
    }
    catch { /* email failure should not block */ }
}
