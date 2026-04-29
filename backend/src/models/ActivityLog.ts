import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IActivityLog extends Document {
  student: Types.ObjectId;
  date: string;         // YYYY-MM-DD
  loginAt: Date;
  timeSpentMinutes: number;
  coursesActive: Types.ObjectId[];
  xpGained: number;
  streak: number;
}

const ActivityLogSchema = new Schema<IActivityLog>({
  student:          { type: Schema.Types.ObjectId, ref: 'User', required: true },
  date:             { type: String, required: true },  // "2024-01-15"
  loginAt:          { type: Date, default: Date.now },
  timeSpentMinutes: { type: Number, default: 0 },
  coursesActive:    [{ type: Schema.Types.ObjectId, ref: 'Course' }],
  xpGained:         { type: Number, default: 0 },
  streak:           { type: Number, default: 0 },
});

// One log per student per day
ActivityLogSchema.index({ student: 1, date: 1 }, { unique: true });

export default mongoose.model<IActivityLog>('ActivityLog', ActivityLogSchema);
