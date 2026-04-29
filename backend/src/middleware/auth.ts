import { Request, Response, NextFunction, RequestHandler } from 'express';
import { verify } from 'jsonwebtoken';
import { UserRole } from '../models/User';

// Augment Express Request to include our user payload
declare global {
  namespace Express {
    interface Request {
      user?: { id: string; role: UserRole; name: string };
    }
  }
}

// Re-export for controllers that still import it
export type AuthRequest = Request;

export const protect: RequestHandler = (req, res, next): void => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    res.status(401).json({ message: 'Not authenticated' });
    return;
  }
  try {
    const secret = process.env.JWT_SECRET!;
    const decoded = (verify as any)(token, secret) as { id: string; role: UserRole; name: string };
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ message: 'Invalid or expired token' });
  }
};

export const requireRole = (...roles: UserRole[]): RequestHandler =>
  (req, res, next): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({ message: 'Access forbidden' });
      return;
    }
    next();
  };
