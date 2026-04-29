import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IMaterialDownload extends Document {
  materialTitle: string;
  course: Types.ObjectId;
  student: Types.ObjectId;
  downloadedAt: Date;
}

const MaterialDownloadSchema = new Schema<IMaterialDownload>(
  {
    materialTitle:   { type: String, required: true },
    course:          { type: Schema.Types.ObjectId, ref: 'Course', required: true },
    student:         { type: Schema.Types.ObjectId, ref: 'User', required: true },
    downloadedAt:    { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const MaterialDownload = mongoose.model<IMaterialDownload>('MaterialDownload', MaterialDownloadSchema);
