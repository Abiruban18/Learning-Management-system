import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import Badge from '../models/Badge';
import { CourseProgress } from '../models/Progress';
import { getXpLevel } from '../services/badgeService';

export const getMyBadges = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const badges = await Badge.find({ student: req.user!.id }).sort({ earnedAt: -1 });
    const progresses = await CourseProgress.find({ student: req.user!.id });
    const totalXp = progresses.reduce((s, p) => s + p.totalXp, 0);
    const levelInfo = getXpLevel(totalXp);
    res.json({ badges, totalXp, ...levelInfo });
  } catch (err) {
    res.status(500).json({ message: 'Fetch failed', error: err });
  }
};

export const getGlobalLeaderboard = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result: any[] = await CourseProgress.aggregate([
      { $group: { _id: '$student', totalXp: { $sum: '$totalXp' } } },
      { $sort: { totalXp: -1 } },
      { $limit: 50 },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'student' } },
      { $unwind: '$student' },
      { $project: { _id: 0, studentId: '$_id', name: '$student.name', avatar: '$student.avatar', totalXp: 1 } },
    ]);

    const leaderboard = result.map((r, i) => {
      const { level, rank: xpRank, nextLevelXp } = getXpLevel(r.totalXp);
      return { ...r, rank: i + 1, level, xpRank, nextLevelXp };
    });

    res.json({ leaderboard });
  } catch (err) {
    res.status(500).json({ message: 'Fetch failed', error: err });
  }
};
