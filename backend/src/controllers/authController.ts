import { Request, Response } from 'express';
import { sign, verify } from 'jsonwebtoken';
import crypto from 'crypto';
import User from '../models/User';
import RefreshToken from '../models/RefreshToken';
import { AuthRequest } from '../middleware/auth';

const ACCESS_EXPIRES  = '15m';
const REFRESH_EXPIRES = 7 * 24 * 60 * 60 * 1000; // 7 days in ms

function signAccess(id: string, role: string, name: string) {
  return (sign as any)({ id, role, name }, process.env.JWT_SECRET!, { expiresIn: ACCESS_EXPIRES });
}

async function createRefreshToken(userId: string): Promise<string> {
  const token = crypto.randomBytes(40).toString('hex');
  const expiresAt = new Date(Date.now() + REFRESH_EXPIRES);
  await RefreshToken.create({ user: userId, token, expiresAt });
  return token;
}

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password, role } = req.body;
    if (!['student', 'teacher'].includes(role)) {
      res.status(400).json({ message: 'Role must be student or teacher' }); return;
    }
    const exists = await User.findOne({ email });
    if (exists) { res.status(409).json({ message: 'Email already in use' }); return; }

    const user = await User.create({ name, email, password, role });
    const accessToken  = signAccess(String(user._id), user.role, user.name);
    const refreshToken = await createRefreshToken(String(user._id));

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true, secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict', maxAge: REFRESH_EXPIRES,
    });
    res.status(201).json({ token: accessToken, user });
  } catch (err) {
    res.status(500).json({ message: 'Registration failed', error: err });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      res.status(401).json({ message: 'Invalid email or password' }); return;
    }
    const accessToken  = signAccess(String(user._id), user.role, user.name);
    const refreshToken = await createRefreshToken(String(user._id));

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true, secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict', maxAge: REFRESH_EXPIRES,
    });
    res.json({ token: accessToken, user });
  } catch (err) {
    res.status(500).json({ message: 'Login failed', error: err });
  }
};

export const refreshAccessToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const token = req.cookies?.refreshToken;
    if (!token) { res.status(401).json({ message: 'No refresh token' }); return; }

    const stored = await RefreshToken.findOne({ token }).populate<{ user: any }>('user');
    if (!stored || stored.expiresAt < new Date()) {
      res.status(401).json({ message: 'Refresh token expired or invalid' }); return;
    }

    // Rotate: delete old, issue new
    await RefreshToken.deleteOne({ _id: stored._id });
    const newRefresh = await createRefreshToken(String(stored.user._id));
    const newAccess  = signAccess(String(stored.user._id), stored.user.role, stored.user.name);

    res.cookie('refreshToken', newRefresh, {
      httpOnly: true, secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict', maxAge: REFRESH_EXPIRES,
    });
    res.json({ token: newAccess, user: stored.user });
  } catch (err) {
    res.status(500).json({ message: 'Token refresh failed', error: err });
  }
};

export const logout = async (req: Request, res: Response): Promise<void> => {
  try {
    const token = req.cookies?.refreshToken;
    if (token) await RefreshToken.deleteOne({ token });
    res.clearCookie('refreshToken');
    res.json({ message: 'Logged out' });
  } catch (err) {
    res.status(500).json({ message: 'Logout failed', error: err });
  }
};

export const getMe = async (req: AuthRequest, res: Response): Promise<void> => {
  const user = await User.findById(req.user!.id);
  res.json({ user });
};

/** Google OAuth callback — issues tokens same as login */
export const googleCallback = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = (req as any).user as any;
    if (!user) { res.redirect(`${process.env.FRONTEND_URL}/login?error=oauth`); return; }

    const accessToken  = signAccess(String(user._id), user.role, user.name);
    const refreshToken = await createRefreshToken(String(user._id));

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true, secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict', maxAge: REFRESH_EXPIRES,
    });
    res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${accessToken}`);
  } catch (err) {
    res.redirect(`${process.env.FRONTEND_URL}/login?error=oauth`);
  }
};
