import mongoose, { Document, Schema, Types } from 'mongoose';

// ── Quiz Attempt ──────────────────────────────────────────────────────────────
export interface IQuizAttempt extends Document {
  student: Types.ObjectId;
  quiz: Types.ObjectId;
  course: Types.ObjectId;
  answers: number[];        // index of chosen option per question
  score: number;            // percentage
  xpEarned: number;
  timeTakenSeconds: number;
  passed: boolean;
  attemptedAt: Date;
}

const QuizAttemptSchema = new Schema<IQuizAttempt>({
  student:          { type: Schema.Types.ObjectId, ref: 'User', required: true },
  quiz:             { type: Schema.Types.ObjectId, ref: 'Quiz', required: true },
  course:           { type: Schema.Types.ObjectId, ref: 'Course', required: true },
  answers:          [{ type: Number }],
  score:            { type: Number, required: true },
  xpEarned:         { type: Number, default: 0 },
  timeTakenSeconds: { type: Number },
  passed:           { type: Boolean, default: false },
  attemptedAt:      { type: Date, default: Date.now },
});

export const QuizAttempt = mongoose.model<IQuizAttempt>('QuizAttempt', QuizAttemptSchema);

// ── Course Progress ────────────────────────────────────────────────────────────
export interface ITaskProgress {
  moduleTitle: string;
  materialTitle: string;
  completedAt?: Date;
  isDone: boolean;
}

export interface ICourseProgress extends Document {
  student: Types.ObjectId;
  course: Types.ObjectId;
  tasks: ITaskProgress[];
  totalXp: number;
  currentStreak: number;
  lastActivityAt: Date;
}

const TaskProgressSchema = new Schema<ITaskProgress>({
  moduleTitle:    { type: String, required: true },
  materialTitle:  { type: String, required: true },
  completedAt:    { type: Date },
  isDone:         { type: Boolean, default: false },
});

const CourseProgressSchema = new Schema<ICourseProgress>(
  {
    student:         { type: Schema.Types.ObjectId, ref: 'User', required: true },
    course:          { type: Schema.Types.ObjectId, ref: 'Course', required: true },
    tasks:           [TaskProgressSchema],
    totalXp:         { type: Number, default: 0 },
    currentStreak:   { type: Number, default: 0 },
    lastActivityAt:  { type: Date, default: Date.now },
  },
  { timestamps: true }
);

CourseProgressSchema.index({ student: 1, course: 1 }, { unique: true });

export const CourseProgress = mongoose.model<ICourseProgress>('CourseProgress', CourseProgressSchema);
