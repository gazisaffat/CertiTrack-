import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { ApiError } from './errorHandler.js';

/**
 * Reads `Authorization: Bearer <token>`, verifies our own JWT (not the Firebase
 * one — that is exchanged once at /api/auth/session) and attaches req.user.
 */
export function verifyToken(req, _res, next) {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) {
    return next(new ApiError(401, 'Missing bearer token'));
  }

  try {
    const payload = jwt.verify(header.slice(7), process.env.JWT_SECRET);
    req.user = { uid: payload.uid, email: payload.email, role: payload.role };
    next();
  } catch (err) {
    const expired = err.name === 'TokenExpiredError';
    next(new ApiError(401, expired ? 'Session expired, please sign in again' : 'Invalid token'));
  }
}

/** Must run after verifyToken. Re-reads the role from the DB so a demotion takes effect immediately. */
export async function verifyAdmin(req, _res, next) {
  try {
    const user = await User.findOne({ firebaseUid: req.user.uid }).select('role').lean();
    if (!user || user.role !== 'admin') {
      return next(new ApiError(403, 'Admin access required'));
    }
    next();
  } catch (err) {
    next(err);
  }
}
