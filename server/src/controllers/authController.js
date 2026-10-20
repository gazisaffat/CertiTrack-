import jwt from 'jsonwebtoken';
import { verifyFirebaseIdToken } from '../config/firebaseAdmin.js';
import { User } from '../models/User.js';
import { ApiError } from '../middleware/errorHandler.js';

function signAppToken(user) {
  return jwt.sign(
    { uid: user.firebaseUid, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

/**
 * POST /api/auth/session
 * Body: { idToken }
 *
 * The client authenticates with Firebase, then trades the Firebase ID token for
 * our own JWT. The ID token is verified server-side with firebase-admin, so the
 * client never gets to assert its own identity or role.
 */
export async function createSession(req, res, next) {
  try {
    const { idToken } = req.body;
    if (!idToken) throw new ApiError(400, 'idToken is required');

    let decoded;
    try {
      decoded = await verifyFirebaseIdToken(idToken);
    } catch {
      throw new ApiError(401, 'Firebase ID token could not be verified');
    }

    const user = await User.findOneAndUpdate(
      { firebaseUid: decoded.uid },
      {
        $set: {
          email: decoded.email,
          name: decoded.name || decoded.email?.split('@')[0] || '',
          photoURL: decoded.picture || '',
          lastLoginAt: new Date()
        },
        $setOnInsert: { firebaseUid: decoded.uid, role: 'user' }
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.json({
      token: signAppToken(user),
      user: {
        uid: user.firebaseUid,
        email: user.email,
        name: user.name,
        photoURL: user.photoURL,
        role: user.role
      }
    });
  } catch (err) {
    next(err);
  }
}

/** GET /api/auth/me — used on refresh to re-hydrate the role without trusting localStorage. */
export async function getMe(req, res, next) {
  try {
    const user = await User.findOne({ firebaseUid: req.user.uid }).lean();
    if (!user) throw new ApiError(404, 'User not found');

    res.json({
      uid: user.firebaseUid,
      email: user.email,
      name: user.name,
      photoURL: user.photoURL,
      role: user.role
    });
  } catch (err) {
    next(err);
  }
}
