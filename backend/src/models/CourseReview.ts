import mongoose, { Document, Schema, Types } from 'mongoose';

export interface ICourseReview extends Document {
  course: Types.ObjectId;
  student: Types.ObjectId;
  rating: number;   // 1-5
  comment: string;
  createdAt: Date;
}

const CourseReviewSchema = new Schema<ICourseReview>(
  {
    course:  { type: Schema.Types.ObjectId, ref: 'Course', required: true },
    student: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    rating:  { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true, maxlength: 1000 },
  },
  { timestamps: true }
);

CourseReviewSchema.index({ course: 1, student: 1 }, { unique: true });

export default mongoose.model<ICourseReview>('CourseReview', CourseReviewSchema);
