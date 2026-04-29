import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import SiteSettings from '../models/SiteSettings';

export const getSettings = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    let settings = await SiteSettings.findOne();
    if (!settings) settings = await SiteSettings.create({});
    res.json({ settings });
  } catch (err) {
    res.status(500).json({ message: 'Fetch failed', error: err });
  }
};

export const updateSettings = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    let settings = await SiteSettings.findOne();
    if (!settings) {
      settings = await SiteSettings.create({ ...req.body, updatedBy: req.user!.name });
    } else {
      Object.assign(settings, req.body);
      settings.updatedBy = req.user!.name;
      await settings.save();
    }
    res.json({ settings });
  } catch (err) {
    res.status(500).json({ message: 'Update failed', error: err });
  }
};
