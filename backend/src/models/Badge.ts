import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IBadge extends Document {
  student: Types.ObjectId;
  type: string;       // e.g. 'streak_7', 'quiz_master', 'first_enroll', 'course_complete'
  label: string;
  icon: string;
  earnedAt: Date;
}

const BadgeSchema = new Schema<IBadge>({
  student:  { type: Schema.Types.ObjectId, ref: 'User', required: true },
  type:     { type: String, required: true },
  label:    { type: String, required: true },
  icon:     { type: String, required: true },
  earnedAt: { type: Date, default: Date.now },
});

BadgeSchema.index({ student: 1, type: 1 }, { unique: true });

export default mongoose.model<IBadge>('Badge', BadgeSchema);
