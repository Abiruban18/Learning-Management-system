export interface Course {
  _id: string;
  title: string;
  description: string;
  thumbnail?: string;
  teacher: { _id: string; name: string } | string;
  modules: CourseModule[];
  isPublished: boolean;
  tags: string[];
  totalDuration: number;
  createdAt: string;
}

export interface CourseMaterial {
  title: string;
  type: 'video' | 'pdf' | 'text' | 'link';
  url: string;
  duration?: number;
}

export interface CourseModule {
  _id?: string;
  title: string;
  description?: string;
  order: number;
  materials: CourseMaterial[];
  deadline?: string;
}

export interface Enrollment {
  _id: string;
  student: string;
  course: Course;
  status: 'active' | 'completed' | 'dropped';
  enrolledAt: string;
  completionPercent: number;
}

export interface TaskProgress {
  moduleTitle: string;
  materialTitle: string;
  isDone: boolean;
  completedAt?: string;
}

export interface CourseProgress {
  _id: string;
  student: string;
  course: string;
  tasks: TaskProgress[];
  totalXp: number;
  currentStreak: number;
  lastActivityAt: string;
}

export interface QuizQuestion {
  question: string;
  options: { text: string; isCorrect?: boolean }[];
  points: number;
  timeLimitSeconds: number;
  explanation?: string;
}

export interface Quiz {
  _id: string;
  course: string;
  module: string;
  title: string;
  questions: QuizQuestion[];
  passingScore: number;
  xpReward: number;
}

export interface QuizAttempt {
  _id: string;
  score: number;
  passed: boolean;
  xpEarned: number;
  timeTakenSeconds: number;
  attemptedAt: string;
}

export interface ActivityLog {
  _id: string;
  date: string;
  loginAt: string;
  timeSpentMinutes: number;
  xpGained: number;
  streak: number;
  coursesActive: string[];
}

export interface SiteSettings {
  siteName: string;
  logoUrl?: string;
  primaryColor: string;
  allowSelfRegistration: boolean;
  defaultXpPerLesson: number;
  streakFreezeEnabled: boolean;
  maintenanceMode: boolean;
}

export interface Badge {
  _id: string;
  type: string;
  label: string;
  icon: string;
  earnedAt: string;
}

export interface Certificate {
  _id: string;
  course: { _id: string; title: string; thumbnail?: string };
  issuedAt: string;
  certificateId: string;
}

export interface Notification {
  _id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  link?: string;
  createdAt: string;
}

export interface CourseReview {
  _id: string;
  student: { _id: string; name: string; avatar?: string };
  rating: number;
  comment: string;
  createdAt: string;
}

export interface LeaderboardEntry {
  studentId: string;
  name: string;
  avatar?: string;
  totalXp: number;
  rank: number;
  level: number;
  xpRank: string;
}
