import Badge from '../models/Badge';
import Notification from '../models/Notification';
import { notifyUser } from './socketService';

interface BadgeDef {
  type: string;
  label: string;
  icon: string;
}

const BADGE_DEFS: BadgeDef[] = [
  { type: 'first_enroll',    label: 'First Step',      icon: '🚀' },
  { type: 'streak_3',        label: '3-Day Streak',    icon: '🔥' },
  { type: 'streak_7',        label: 'Week Warrior',    icon: '⚡' },
  { type: 'streak_30',       label: 'Monthly Master',  icon: '🏆' },
  { type: 'quiz_first',      label: 'Quiz Taker',      icon: '🧠' },
  { type: 'quiz_perfect',    label: 'Perfect Score',   icon: '💯' },
  { type: 'quiz_master',     label: 'Quiz Master',     icon: '🎯' },
  { type: 'course_complete', label: 'Course Graduate', icon: '🎓' },
  { type: 'xp_100',          label: 'XP Collector',    icon: '⭐' },
  { type: 'xp_500',          label: 'XP Hunter',       icon: '🌟' },
  { type: 'xp_1000',         label: 'XP Legend',       icon: '👑' },
];

export async function awardBadge(studentId: string, type: string): Promise<boolean> {
  const def = BADGE_DEFS.find(b => b.type === type);
  if (!def) return false;

  const existing = await Badge.findOne({ student: studentId, type });
  if (existing) return false;

  await Badge.create({ student: studentId, type, label: def.label, icon: def.icon });

  // Create in-app notification
  const notif = await Notification.create({
    user: studentId,
    type: 'badge',
    title: `Badge Unlocked: ${def.label}`,
    message: `You earned the "${def.label}" badge ${def.icon}`,
  });

  // Push via socket
  try {
    notifyUser(studentId, 'notification', notif);
  } catch { /* socket may not be ready */ }

  return true;
}

export async function checkAndAwardBadges(studentId: string, opts: {
  streak?: number;
  quizScore?: number;
  totalQuizAttempts?: number;
  courseCompleted?: boolean;
  totalXp?: number;
  firstEnroll?: boolean;
}) {
  const { streak, quizScore, totalQuizAttempts, courseCompleted, totalXp, firstEnroll } = opts;

  if (firstEnroll) await awardBadge(studentId, 'first_enroll');
  if (streak !== undefined) {
    if (streak >= 3)  await awardBadge(studentId, 'streak_3');
    if (streak >= 7)  await awardBadge(studentId, 'streak_7');
    if (streak >= 30) await awardBadge(studentId, 'streak_30');
  }
  if (totalQuizAttempts !== undefined && totalQuizAttempts >= 1) await awardBadge(studentId, 'quiz_first');
  if (quizScore !== undefined) {
    if (quizScore === 100) await awardBadge(studentId, 'quiz_perfect');
    if (quizScore >= 80 && (totalQuizAttempts ?? 0) >= 5) await awardBadge(studentId, 'quiz_master');
  }
  if (courseCompleted) await awardBadge(studentId, 'course_complete');
  if (totalXp !== undefined) {
    if (totalXp >= 100)  await awardBadge(studentId, 'xp_100');
    if (totalXp >= 500)  await awardBadge(studentId, 'xp_500');
    if (totalXp >= 1000) await awardBadge(studentId, 'xp_1000');
  }
}

export function getXpLevel(totalXp: number): { level: number; rank: string; nextLevelXp: number } {
  const thresholds = [0, 100, 300, 600, 1000, 1500, 2500, 4000, 6000, 10000];
  const ranks = ['Beginner', 'Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond', 'Master', 'Grandmaster', 'Legend', 'Mythic'];
  let level = 0;
  for (let i = thresholds.length - 1; i >= 0; i--) {
    if (totalXp >= thresholds[i]) { level = i; break; }
  }
  return {
    level: level + 1,
    rank: ranks[level],
    nextLevelXp: thresholds[level + 1] ?? thresholds[thresholds.length - 1],
  };
}
