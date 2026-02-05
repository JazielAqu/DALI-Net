import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Uploads folder at project root
const uploadsRoot = path.resolve(__dirname, '../../uploads');
const profileDir = path.join(uploadsRoot, 'profile-images');

// Ensure folders exist
if (!fs.existsSync(uploadsRoot)) fs.mkdirSync(uploadsRoot, { recursive: true });
if (!fs.existsSync(profileDir)) fs.mkdirSync(profileDir, { recursive: true });

const MAX_BYTES = 5 * 1024 * 1024; // 5MB raw buffer

router.post('/profile-image', requireAuth, async (req, res) => {
  try {
    const { dataUrl, fileName = 'upload' } = req.body || {};
    if (!dataUrl || typeof dataUrl !== 'string') {
      return res.status(400).json({ success: false, error: { message: 'Missing dataUrl' } });
    }

    const [meta, base64] = dataUrl.split(',');
    if (!base64) {
      return res.status(400).json({ success: false, error: { message: 'Invalid dataUrl' } });
    }

    const match = /data:(.*);base64/.exec(meta || '');
    const contentType = match ? match[1] : 'application/octet-stream';
    const ext = (contentType.split('/')[1] || 'bin').split('+')[0];

    const buffer = Buffer.from(base64, 'base64');
    if (buffer.length > MAX_BYTES) {
      return res.status(413).json({ success: false, error: { message: 'Image must be under 5MB' } });
    }

    const safeName = fileName.replace(/[^\w.-]/g, '_');
    const filePath = path.join(profileDir, `${req.user.id}-${Date.now()}-${safeName}.${ext}`);

    await fs.promises.writeFile(filePath, buffer);

    const publicPath = `/uploads/profile-images/${path.basename(filePath)}`;
    return res.json({ success: true, url: publicPath });
  } catch (error) {
    console.error('Local upload failed', error);
    return res.status(500).json({ success: false, error: { message: 'Upload failed' } });
  }
});

export default router;
