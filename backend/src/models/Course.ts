import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IMaterial {
  title: string;
  type: 'video' | 'pdf' | 'text' | 'link';
  url: string;
  duration?: number; // minutes
}

export interface IModule {
  title: string;
  description?: string;
  order: number;
  materials: IMaterial[];
  deadline?: Date;
}

export interface ICourse extends Document {
  title: string;
  description: string;
  thumbnail?: string;
  teacher: Types.ObjectId;
  modules: IModule[];
  isPublished: boolean;
  tags: string[];
  totalDuration: number; // minutes
  createdAt: Date;
  updatedAt: Date;
}

const MaterialSchema = new Schema<IMaterial>({
  title:    { type: String, required: true },
  type:     { type: String, enum: ['video', 'pdf', 'text', 'link'], required: true },
  url:      { type: String, required: true },
  duration: { type: Number },
});

const ModuleSchema = new Schema<IModule>({
  title:       { type: String, required: true },
  description: { type: String },
  order:       { type: Number, required: true },
  materials:   [MaterialSchema],
  deadline:    { type: Date },
});

const CourseSchema = new Schema<ICourse>(
  {
    title:         { type: String, required: true, trim: true },
    description:   { type: String, required: true },
    thumbnail:     { type: String },
    teacher:       { type: Schema.Types.ObjectId, ref: 'User', required: true },
    modules:       [ModuleSchema],
    isPublished:   { type: Boolean, default: false },
    tags:          [{ type: String }],
    totalDuration: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.model<ICourse>('Course', CourseSchema);
