import express from 'express';
import { demoLogin, guestLogin } from '../middleware/auth.js';

const router = express.Router();

// POST /api/auth/demo-login
router.post('/demo-login', async (req, res, next) => {
  try {
    if (process.env.DEMO_MODE !== 'true') {
      return res.status(403).json({ success: false, error: { message: 'Demo login disabled' } });
    }
    const { memberId } = req.body;
    if (!memberId) {
      return res.status(400).json({ success: false, error: { message: 'memberId is required' } });
    }
    const result = await demoLogin(memberId);
    if (!result) {
      return res.status(404).json({ success: false, error: { message: 'Member not found' } });
    }
    if (result.error) {
      return res.status(403).json({ success: false, error: { message: result.error } });
    }
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

// POST /api/auth/guest-login
router.post('/guest-login', guestLogin);

export default router;
