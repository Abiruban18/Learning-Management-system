import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { checkAndAwardBadges } from '../services/badgeService';

import ActivityLog from '../models/ActivityLog';

export const awardGameXp = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { xp = 10, gameType = 'game' } = req.body;
    const capped = Math.min(Math.max(1, xp), 200);
    const today = new Date().toISOString().split('T')[0];
    const log = await ActivityLog.findOneAndUpdate(
      { student: req.user!.id, date: today },
      { $inc: { xpGained: capped, timeSpentMinutes: 2 }, $setOnInsert: { streak: 1, coursesActive: [] } },
      { upsert: true, new: true }
    );
    await checkAndAwardBadges(req.user!.id, { totalXp: log.xpGained });
    res.json({ xpAwarded: capped, gameType, totalXpToday: log.xpGained });
  } catch (err: any) {
    res.status(500).json({ message: 'XP award failed', error: err.message });
  }
};
