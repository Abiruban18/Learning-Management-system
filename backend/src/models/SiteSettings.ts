import mongoose, { Document, Schema } from 'mongoose';

export interface ISiteSettings extends Document {
  siteName: string;
  logoUrl?: string;
  primaryColor: string;
  allowSelfRegistration: boolean;
  defaultXpPerLesson: number;
  streakFreezeEnabled: boolean;
  maintenanceMode: boolean;
  updatedBy?: string;
}

const SiteSettingsSchema = new Schema<ISiteSettings>(
  {
    siteName:               { type: String, default: 'EduQuest' },
    logoUrl:                { type: String },
    primaryColor:           { type: String, default: '#6C63FF' },
    allowSelfRegistration:  { type: Boolean, default: true },
    defaultXpPerLesson:     { type: Number, default: 20 },
    streakFreezeEnabled:    { type: Boolean, default: true },
    maintenanceMode:        { type: Boolean, default: false },
    updatedBy:              { type: String },
  },
  { timestamps: true }
);

export default mongoose.model<ISiteSettings>('SiteSettings', SiteSettingsSchema);
