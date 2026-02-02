import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { errorHandler, notFound } from './middleware/errorHandler.js';
import membersRoutes from './routes/members.js';
import postsRoutes from './routes/posts.js';
import followingRoutes from './routes/following.js';
import likesRoutes from './routes/likes.js';
import commentsRoutes from './routes/comments.js';
import notificationsRoutes from './routes/notifications.js';
import authRoutes from './routes/auth.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:5173',
].filter(Boolean);

const corsOptions = {
  origin: (origin, cb) => {
    if (!origin) return cb(null, true); // allow non-browser tools
    if (allowedOrigins.includes(origin)) return cb(null, true);
    return cb(new Error(`CORS blocked for origin: ${origin}`), false);
  },
  credentials: true,
};

app.use(cors(corsOptions));

app.use(express.json({ limit: '8mb' }));
app.use(express.urlencoded({ extended: true, limit: '8mb' }));

app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'DALI Net API is running' });
});

// API Routes
app.use('/api/members', membersRoutes);
app.use('/api/posts', postsRoutes);
app.use('/api/following', followingRoutes);
app.use('/api/likes', likesRoutes);
app.use('/api/comments', commentsRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/auth', authRoutes);

// Error handling
app.use(notFound);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/health`);
});
