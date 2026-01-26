import express from 'express';
import db from '../services/firebase.js';
import { createNotification } from '../models/Notification.js';

const router = express.Router();

// GET /api/notifications/:userId - Get all notifications for user
router.get('/:userId', async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { limit = 50, unreadOnly = false } = req.query;

    let query = db.collection('notifications')
      .where('userId', '==', userId);

    if (unreadOnly === 'true') {
      query = query.where('read', '==', false);
    }

    const snapshot = await query
      .orderBy('createdAt', 'desc')
      .limit(parseInt(limit))
      .get();

    const notifications = [];
    snapshot.forEach(doc => {
      notifications.push({ id: doc.id, ...doc.data() });
    });

    // Get unread count
    const unreadSnapshot = await db.collection('notifications')
      .where('userId', '==', userId)
      .where('read', '==', false)
      .get();

    res.json({
      success: true,
      data: notifications,
      count: notifications.length,
      unreadCount: unreadSnapshot.size,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/notifications - Create notification
router.post('/', async (req, res, next) => {
  try {
    const { userId, type, content, postId, relatedUserId } = req.body;

    if (!userId || !type || !content) {
      return res.status(400).json({
        success: false,
        error: { message: 'userId, type, and content are required' },
      });
    }

    const notification = createNotification({
      userId,
      type,
      content,
      postId,
      relatedUserId,
    });

    const notifRef = db.collection('notifications').doc();
    await notifRef.set(notification);

    res.status(201).json({
      success: true,
      data: { id: notifRef.id, ...notification },
    });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/notifications/:id/read - Mark notification as read
router.patch('/:id/read', async (req, res, next) => {
  try {
    const { id } = req.params;

    const notifDoc = await db.collection('notifications').doc(id).get();

    if (!notifDoc.exists) {
      return res.status(404).json({
        success: false,
        error: { message: 'Notification not found' },
      });
    }

    await notifDoc.ref.update({ read: true });

    res.json({
      success: true,
      message: 'Notification marked as read',
    });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/notifications/:userId/read-all - Mark all notifications as read
router.patch('/:userId/read-all', async (req, res, next) => {
  try {
    const { userId } = req.params;

    const snapshot = await db.collection('notifications')
      .where('userId', '==', userId)
      .where('read', '==', false)
      .get();

    const batch = db.batch();
    snapshot.forEach(doc => {
      batch.update(doc.ref, { read: true });
    });

    await batch.commit();

    res.json({
      success: true,
      message: `Marked ${snapshot.size} notifications as read`,
      count: snapshot.size,
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/notifications/:id - Delete notification
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    const notifDoc = await db.collection('notifications').doc(id).get();

    if (!notifDoc.exists) {
      return res.status(404).json({
        success: false,
        error: { message: 'Notification not found' },
      });
    }

    await notifDoc.ref.delete();

    res.json({
      success: true,
      message: 'Notification deleted successfully',
    });
  } catch (error) {
    next(error);
  }
});

export default router;
