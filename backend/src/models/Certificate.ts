import mongoose, { Document, Schema, Types } from 'mongoose';

export interface ICertificate extends Document {
  student: Types.ObjectId;
  course: Types.ObjectId;
  issuedAt: Date;
  certificateId: string;  // unique human-readable ID
}

const CertificateSchema = new Schema<ICertificate>(
  {
    student:       { type: Schema.Types.ObjectId, ref: 'User', required: true },
    course:        { type: Schema.Types.ObjectId, ref: 'Course', required: true },
    issuedAt:      { type: Date, default: Date.now },
    certificateId: { type: String, required: true, unique: true },
  },
  { timestamps: true }
);

CertificateSchema.index({ student: 1, course: 1 }, { unique: true });

export default mongoose.model<ICertificate>('Certificate', CertificateSchema);
