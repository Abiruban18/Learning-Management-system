import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import Certificate from '../models/Certificate';
import Enrollment from '../models/Enrollment';
import Course from '../models/Course';
import User from '../models/User';
import { generateCertificatePDF } from '../services/certificateService';
import { sendCertificateEmail } from '../services/emailService';
import { nanoid } from '../utils/nanoid';

export const getMyCertificates = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const certs = await Certificate.find({ student: req.user!.id })
      .populate('course', 'title thumbnail')
      .sort({ issuedAt: -1 });
    res.json({ certificates: certs });
  } catch (err) {
    res.status(500).json({ message: 'Fetch failed', error: err });
  }
};

export const downloadCertificate = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const cert = await Certificate.findOne({ _id: req.params.id, student: req.user!.id })
      .populate<{ course: any }>('course', 'title teacher')
      .populate<{ student: any }>('student', 'name email');

    if (!cert) { res.status(404).json({ message: 'Certificate not found' }); return; }

    const course = await Course.findById(cert.course._id).populate<{ teacher: any }>('teacher', 'name');
    const student = await User.findById(req.user!.id);

    if (!course || !student) { res.status(404).json({ message: 'Data not found' }); return; }

    const pdfBuffer = await generateCertificatePDF({
      studentName: student.name,
      courseTitle: course.title,
      teacherName: (course.teacher as any).name,
      certId: cert.certificateId,
      issuedAt: cert.issuedAt,
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="certificate-${cert.certificateId}.pdf"`);
    res.send(pdfBuffer);
  } catch (err) {
    res.status(500).json({ message: 'Generation failed', error: err });
  }
};

/** Called internally when a student completes a course */
export async function issueCertificate(studentId: string, courseId: string): Promise<void> {
  const existing = await Certificate.findOne({ student: studentId, course: courseId });
  if (existing) return;

  const certId = `EQ-${nanoid(8).toUpperCase()}`;
  await Certificate.create({ student: studentId, course: courseId, certificateId: certId });

  // Send email
  try {
    const [student, course] = await Promise.all([
      User.findById(studentId),
      Course.findById(courseId),
    ]);
    if (student && course) {
      await sendCertificateEmail(student.email, student.name, course.title, certId);
    }
  } catch { /* email failure should not block */ }
}
