import express from 'express';
import db from '../services/firebase.js';
import { createLike } from '../models/Like.js';
import { createNotification } from '../models/Notification.js';

const router = express.Router();

// POST /api/likes - Like a post
router.post('/', async (req, res, next) => {
  try {
    const { userId, postId } = req.body;

    if (!userId || !postId) {
      return res.status(400).json({
        success: false,
        error: { message: 'userId and postId are required' },
      });
    }

    // Check if already liked
    const existingSnapshot = await db.collection('likes')
      .where('userId', '==', userId)
      .where('postId', '==', postId)
      .get();

    if (!existingSnapshot.empty) {
      return res.status(400).json({
        success: false,
        error: { message: 'Post already liked' },
      });
    }

    // Verify post exists
    const postDoc = await db.collection('posts').doc(postId).get();
    if (!postDoc.exists) {
      return res.status(404).json({
        success: false,
        error: { message: 'Post not found' },
      });
    }

    // Create like
    const likeRef = db.collection('likes').doc();
    await likeRef.set(createLike(userId, postId));

    // Create notification for post author (if not the same user)
    const postData = postDoc.data();
    if (postData.authorId !== userId) {
      const userDoc = await db.collection('members').doc(userId).get();
      const userName = userDoc.exists ? userDoc.data().name : 'Someone';

      const notifRef = db.collection('notifications').doc();
      await notifRef.set(createNotification({
        userId: postData.authorId,
        type: 'like',
        content: `${userName} liked your post`,
        postId,
        relatedUserId: userId,
      }));
    }

    res.status(201).json({
      success: true,
      message: 'Post liked successfully',
      data: { id: likeRef.id, userId, postId },
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/likes/:userId/:postId - Unlike a post
router.delete('/:userId/:postId', async (req, res, next) => {
  try {
    const { userId, postId } = req.params;

    const snapshot = await db.collection('likes')
      .where('userId', '==', userId)
      .where('postId', '==', postId)
      .get();

    if (snapshot.empty) {
      return res.status(404).json({
        success: false,
        error: { message: 'Like not found' },
      });
    }

    // Delete like
    const batch = db.batch();
    snapshot.forEach(doc => batch.delete(doc.ref));
    await batch.commit();

    res.json({
      success: true,
      message: 'Post unliked successfully',
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/likes/post/:postId - Get all likes for a post
router.get('/post/:postId', async (req, res, next) => {
  try {
    const { postId } = req.params;

    const snapshot = await db.collection('likes')
      .where('postId', '==', postId)
      .get();

    const likes = [];
    snapshot.forEach(doc => {
      likes.push({ id: doc.id, ...doc.data() });
    });

    res.json({
      success: true,
      data: likes,
      count: likes.length,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/likes/user/:userId - Get all posts liked by user
router.get('/user/:userId', async (req, res, next) => {
  try {
    const { userId } = req.params;

    const snapshot = await db.collection('likes')
      .where('userId', '==', userId)
      .get();

    const postIds = [];
    snapshot.forEach(doc => {
      postIds.push(doc.data().postId);
    });

    // Get post details
    const posts = [];
    for (const postId of postIds) {
      const postDoc = await db.collection('posts').doc(postId).get();
      if (postDoc.exists) {
        posts.push({ id: postDoc.id, ...postDoc.data() });
      }
    }

    // Sort by createdAt
    posts.sort((a, b) => {
      const aTime = a.createdAt?.toMillis?.() || new Date(a.createdAt).getTime();
      const bTime = b.createdAt?.toMillis?.() || new Date(b.createdAt).getTime();
      return bTime - aTime;
    });

    res.json({
      success: true,
      data: posts,
      count: posts.length,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
