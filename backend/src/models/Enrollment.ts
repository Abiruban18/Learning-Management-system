import mongoose, { Document, Schema, Types } from 'mongoose';

export type EnrollmentStatus = 'active' | 'completed' | 'dropped';

export interface IEnrollment extends Document {
  student: Types.ObjectId;
  course: Types.ObjectId;
  status: EnrollmentStatus;
  enrolledAt: Date;
  completedAt?: Date;
  completionPercent: number; // 0-100
}

const EnrollmentSchema = new Schema<IEnrollment>(
  {
    student:           { type: Schema.Types.ObjectId, ref: 'User', required: true },
    course:            { type: Schema.Types.ObjectId, ref: 'Course', required: true },
    status:            { type: String, enum: ['active', 'completed', 'dropped'], default: 'active' },
    enrolledAt:        { type: Date, default: Date.now },
    completedAt:       { type: Date },
    completionPercent: { type: Number, default: 0, min: 0, max: 100 },
  },
  { timestamps: true }
);

// One enrollment per student per course
EnrollmentSchema.index({ student: 1, course: 1 }, { unique: true });

export default mongoose.model<IEnrollment>('Enrollment', EnrollmentSchema);
