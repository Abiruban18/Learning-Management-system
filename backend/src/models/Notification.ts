import mongoose, { Document, Schema, Types } from 'mongoose';

export type NotifType = 'new_quiz' | 'deadline' | 'leaderboard' | 'badge' | 'course_published' | 'streak_risk' | 'general';

export interface INotification extends Document {
  user: Types.ObjectId;
  type: NotifType;
  title: string;
  message: string;
  isRead: boolean;
  link?: string;
  createdAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    user:    { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type:    { type: String, required: true },
    title:   { type: String, required: true },
    message: { type: String, required: true },
    isRead:  { type: Boolean, default: false },
    link:    { type: String },
  },
  { timestamps: true }
);

NotificationSchema.index({ user: 1, createdAt: -1 });

export default mongoose.model<INotification>('Notification', NotificationSchema);
