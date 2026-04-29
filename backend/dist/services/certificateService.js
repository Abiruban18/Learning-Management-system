"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateCertificatePDF = generateCertificatePDF;
const pdf_lib_1 = require("pdf-lib");
async function generateCertificatePDF(opts) {
    const { studentName, courseTitle, teacherName, certId, issuedAt } = opts;
    const pdfDoc = await pdf_lib_1.PDFDocument.create();
    const page = pdfDoc.addPage([842, 595]); // A4 landscape
    const { width, height } = page.getSize();
    const boldFont = await pdfDoc.embedFont(pdf_lib_1.StandardFonts.HelveticaBold);
    const regularFont = await pdfDoc.embedFont(pdf_lib_1.StandardFonts.Helvetica);
    // Background gradient simulation — fill with light indigo
    page.drawRectangle({ x: 0, y: 0, width, height, color: (0, pdf_lib_1.rgb)(0.97, 0.97, 1) });
    // Decorative border
    page.drawRectangle({ x: 20, y: 20, width: width - 40, height: height - 40, borderColor: (0, pdf_lib_1.rgb)(0.31, 0.27, 0.9), borderWidth: 3, color: (0, pdf_lib_1.rgb)(1, 1, 1) });
    page.drawRectangle({ x: 30, y: 30, width: width - 60, height: height - 60, borderColor: (0, pdf_lib_1.rgb)(0.31, 0.27, 0.9), borderWidth: 1 });
    // Header
    page.drawText('EduQuest', { x: width / 2 - 80, y: height - 90, size: 36, font: boldFont, color: (0, pdf_lib_1.rgb)(0.31, 0.27, 0.9) });
    page.drawText('CERTIFICATE OF COMPLETION', { x: width / 2 - 175, y: height - 130, size: 18, font: boldFont, color: (0, pdf_lib_1.rgb)(0.4, 0.4, 0.5) });
    // Divider
    page.drawLine({ start: { x: 80, y: height - 150 }, end: { x: width - 80, y: height - 150 }, thickness: 1, color: (0, pdf_lib_1.rgb)(0.8, 0.8, 0.9) });
    // Body
    page.drawText('This is to certify that', { x: width / 2 - 90, y: height - 200, size: 14, font: regularFont, color: (0, pdf_lib_1.rgb)(0.4, 0.4, 0.5) });
    page.drawText(studentName, { x: width / 2 - (studentName.length * 14) / 2, y: height - 250, size: 40, font: boldFont, color: (0, pdf_lib_1.rgb)(0.2, 0.2, 0.3) });
    page.drawText('has successfully completed the course', { x: width / 2 - 145, y: height - 295, size: 14, font: regularFont, color: (0, pdf_lib_1.rgb)(0.4, 0.4, 0.5) });
    page.drawText(courseTitle, { x: width / 2 - (courseTitle.length * 10) / 2, y: height - 340, size: 24, font: boldFont, color: (0, pdf_lib_1.rgb)(0.31, 0.27, 0.9) });
    // Footer
    page.drawLine({ start: { x: 80, y: 120 }, end: { x: width - 80, y: 120 }, thickness: 1, color: (0, pdf_lib_1.rgb)(0.8, 0.8, 0.9) });
    page.drawText(`Instructor: ${teacherName}`, { x: 100, y: 90, size: 12, font: regularFont, color: (0, pdf_lib_1.rgb)(0.4, 0.4, 0.5) });
    page.drawText(`Issued: ${issuedAt.toDateString()}`, { x: width / 2 - 70, y: 90, size: 12, font: regularFont, color: (0, pdf_lib_1.rgb)(0.4, 0.4, 0.5) });
    page.drawText(`ID: ${certId}`, { x: width - 220, y: 90, size: 12, font: regularFont, color: (0, pdf_lib_1.rgb)(0.4, 0.4, 0.5) });
    const pdfBytes = await pdfDoc.save();
    return Buffer.from(pdfBytes);
}
