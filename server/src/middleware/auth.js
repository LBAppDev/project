import jwt from 'jsonwebtoken';
import { getUserById } from '../db/database.js';
import { appConfig } from '../config.js';

export function signToken(user) {
  return jwt.sign({ userId: user.id, role: user.role }, appConfig.jwtSecret, { expiresIn: '12h' });
}

export async function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  const token = header?.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const payload = jwt.verify(token, appConfig.jwtSecret);
    const user = await getUserById(payload.userId);

    if (!user || user.status !== 'active') {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    req.user = user;
    return next();
  } catch (error) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
}

export function requireRole(roles) {
  const allowed = Array.isArray(roles) ? roles : [roles];

  return (req, res, next) => {
    if (!req.user || !allowed.includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    return next();
  };
}
