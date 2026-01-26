import express from 'express';
import db from '../services/firebase.js';
import { createNotification } from '../models/Notification.js';

const router = express.Router();

// POST /api/following - Follow a user
router.post('/', async (req, res, next) => {
  try {
    const { followerId, followingId } = req.body;

    if (!followerId || !followingId) {
      return res.status(400).json({
        success: false,
        error: { message: 'followerId and followingId are required' },
      });
    }

    if (followerId === followingId) {
      return res.status(400).json({
        success: false,
        error: { message: 'Cannot follow yourself' },
      });
    }

    // Check if already following
    const existingSnapshot = await db.collection('following')
      .where('followerId', '==', followerId)
      .where('followingId', '==', followingId)
      .get();

    if (!existingSnapshot.empty) {
      return res.status(400).json({
        success: false,
        error: { message: 'Already following this user' },
      });
    }

    // Create follow relationship
    const followRef = db.collection('following').doc();
    await followRef.set({
      followerId,
      followingId,
      createdAt: new Date(),
    });

    // Create notification for the user being followed
    const followerDoc = await db.collection('members').doc(followerId).get();
    const followerName = followerDoc.exists ? followerDoc.data().name : 'Someone';

    const notifRef = db.collection('notifications').doc();
    await notifRef.set(createNotification({
      userId: followingId,
      type: 'follow',
      content: `${followerName} started following you`,
      relatedUserId: followerId,
    }));

    res.status(201).json({
      success: true,
      message: 'Successfully followed user',
      data: { id: followRef.id, followerId, followingId },
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/following/:followerId/:followingId - Unfollow a user
router.delete('/:followerId/:followingId', async (req, res, next) => {
  try {
    const { followerId, followingId } = req.params;

    const snapshot = await db.collection('following')
      .where('followerId', '==', followerId)
      .where('followingId', '==', followingId)
      .get();

    if (snapshot.empty) {
      return res.status(404).json({
        success: false,
        error: { message: 'Follow relationship not found' },
      });
    }

    // Delete follow relationship
    const batch = db.batch();
    snapshot.forEach(doc => batch.delete(doc.ref));
    await batch.commit();

    res.json({
      success: true,
      message: 'Successfully unfollowed user',
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/following/:userId/followers - Get user's followers
router.get('/:userId/followers', async (req, res, next) => {
  try {
    const { userId } = req.params;

    const snapshot = await db.collection('following')
      .where('followingId', '==', userId)
      .get();

    const followerIds = [];
    snapshot.forEach(doc => {
      followerIds.push(doc.data().followerId);
    });

    // Get member details
    const followers = [];
    for (const followerId of followerIds) {
      const memberDoc = await db.collection('members').doc(followerId).get();
      if (memberDoc.exists) {
        followers.push({ id: memberDoc.id, ...memberDoc.data() });
      }
    }

    res.json({
      success: true,
      data: followers,
      count: followers.length,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/following/:userId/following - Get users that userId follows
router.get('/:userId/following', async (req, res, next) => {
  try {
    const { userId } = req.params;

    const snapshot = await db.collection('following')
      .where('followerId', '==', userId)
      .get();

    const followingIds = [];
    snapshot.forEach(doc => {
      followingIds.push(doc.data().followingId);
    });

    // Get member details
    const following = [];
    for (const followingId of followingIds) {
      const memberDoc = await db.collection('members').doc(followingId).get();
      if (memberDoc.exists) {
        following.push({ id: memberDoc.id, ...memberDoc.data() });
      }
    }

    res.json({
      success: true,
      data: following,
      count: following.length,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
