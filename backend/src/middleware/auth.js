import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';
import admin from 'firebase-admin';
import db from '../services/firebase.js';

const { DEMO_MODE, DEMO_JWT_SECRET } = process.env;
const DEMO_SECRET = DEMO_JWT_SECRET || 'demo-secret-key';

export const requireAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization || '';
  const [, token] = authHeader.split(' ');

  if (!token) {
    return res.status(401).json({ success: false, error: { message: 'Unauthorized' } });
  }

  const setUser = (decoded, role = 'member') => {
    req.user = {
      id: decoded.uid || decoded.id,
      uid: decoded.uid || decoded.id,
      role: decoded.role || role,
      name: decoded.name || decoded.displayName || '',
      picture: decoded.picture || decoded.photoURL || '',
      email: decoded.email || '',
    };
  };

  try {
    const decoded = await admin.auth().verifyIdToken(token);
    setUser(decoded, decoded.firebase?.sign_in_provider === 'anonymous' ? 'guest' : 'user');
    return next();
  } catch (fbErr) {
    try {
      const decoded = jwt.verify(token, DEMO_SECRET);
      setUser(decoded, decoded.role || 'member');
      return next();
    } catch (err) {
      return res.status(401).json({ success: false, error: { message: 'Invalid token' } });
    }
  }
};

export const rejectGuest = (res, message = 'Guest accounts cannot perform this action') => {
  return res.status(403).json({ success: false, error: { message } });
};

export const ensureSelf = (req, res, next) => {
  if (!req.user?.id || req.user.id !== req.body.userId && req.user.id !== req.params.userId) {
    return res.status(403).json({ success: false, error: { message: 'Forbidden' } });
  }
  next();
};

export const demoLogin = async (memberId) => {
  const doc = await db.collection('members').doc(memberId).get();
  if (!doc.exists) return null;
  const data = doc.data() || {};
  if (data.locked) {
    return { error: 'This profile requires real sign-in' };
  }
  const token = jwt.sign({ id: memberId }, DEMO_SECRET, { expiresIn: '2h' });
  return { token, user: { id: memberId, ...data } };
};

export const guestLogin = (req, res) => {
  if (DEMO_MODE !== 'true') {
    return res.status(403).json({ success: false, error: { message: 'Demo login disabled' } });
  }

  const guestId = `guest-${randomUUID()}`;
  const token = jwt.sign(
    { id: guestId, role: 'guest' },
    DEMO_SECRET,
    { expiresIn: '8h' }
  );

  return res.json({
    success: true,
    data: {
      token,
      user: { id: guestId, role: 'guest', name: 'Guest' },
    },
  });
};
