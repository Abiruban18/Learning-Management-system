import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IQuizOption {
  text: string;
  isCorrect: boolean;
}

export interface IQuizQuestion {
  question: string;
  options: IQuizOption[];
  points: number;
  timeLimitSeconds: number;
  explanation?: string;
}

export interface IQuiz extends Document {
  course: Types.ObjectId;
  module: string; // module title reference
  title: string;
  questions: IQuizQuestion[];
  passingScore: number; // percentage
  xpReward: number;
  createdAt: Date;
}

const QuizQuestionSchema = new Schema<IQuizQuestion>({
  question:         { type: String, required: true },
  options:          [{ text: String, isCorrect: Boolean }],
  points:           { type: Number, default: 10 },
  timeLimitSeconds: { type: Number, default: 30 },
  explanation:      { type: String },
});

const QuizSchema = new Schema<IQuiz>(
  {
    course:       { type: Schema.Types.ObjectId, ref: 'Course', required: true },
    module:       { type: String, required: true },
    title:        { type: String, required: true },
    questions:    [QuizQuestionSchema],
    passingScore: { type: Number, default: 70 },
    xpReward:     { type: Number, default: 50 },
  },
  { timestamps: true }
);

export default mongoose.model<IQuiz>('Quiz', QuizSchema);
