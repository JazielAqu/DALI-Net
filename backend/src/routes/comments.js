import express from 'express';
import db from '../services/firebase.js';
import { createComment } from '../models/Comment.js';
import { createNotification } from '../models/Notification.js';

const router = express.Router();

// GET /api/comments/post/:postId - Get all comments for a post
router.get('/post/:postId', async (req, res, next) => {
  try {
    const { postId } = req.params;

    // Firestore requires a composite index for where+orderBy on different fields.
    // Read then sort in memory to avoid index errors.
    const snapshot = await db.collection('comments')
      .where('postId', '==', postId)
      .get();

    const comments = [];
    snapshot.forEach(doc => {
      comments.push({ id: doc.id, ...doc.data() });
    });

    comments.sort((a, b) => {
      const aTime = a.createdAt?.toMillis?.() || new Date(a.createdAt).getTime();
      const bTime = b.createdAt?.toMillis?.() || new Date(b.createdAt).getTime();
      return aTime - bTime;
    });

    res.json({
      success: true,
      data: comments,
      count: comments.length,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/comments - Create comment
router.post('/', async (req, res, next) => {
  try {
    const { userId, postId, content } = req.body;

    if (!userId || !postId || !content) {
      return res.status(400).json({
        success: false,
        error: { message: 'userId, postId, and content are required' },
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

    // Get user info
    const userDoc = await db.collection('members').doc(userId).get();
    if (!userDoc.exists) {
      return res.status(404).json({
        success: false,
        error: { message: 'User not found' },
      });
    }

    const userData = userDoc.data();
    const comment = createComment({
      userId,
      userName: userData.name,
      userImage: userData.profileImage || userData.image || '',
      postId,
      content,
    });

    const commentRef = db.collection('comments').doc();
    await commentRef.set(comment);

    // Create notification for post author (if not the same user)
    const postData = postDoc.data();
    if (postData.authorId !== userId) {
      const notifRef = db.collection('notifications').doc();
      await notifRef.set(createNotification({
        userId: postData.authorId,
        type: 'comment',
        content: `${userData.name} commented on your post`,
        postId,
        relatedUserId: userId,
      }));
    }

    res.status(201).json({
      success: true,
      data: { id: commentRef.id, ...comment },
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/comments/:id - Delete comment
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { userId } = req.body; // User ID to verify ownership

    const commentDoc = await db.collection('comments').doc(id).get();

    if (!commentDoc.exists) {
      return res.status(404).json({
        success: false,
        error: { message: 'Comment not found' },
      });
    }

    const commentData = commentDoc.data();
    
    // Verify ownership
    if (userId && commentData.userId !== userId) {
      return res.status(403).json({
        success: false,
        error: { message: 'Not authorized to delete this comment' },
      });
    }

    await commentDoc.ref.delete();

    res.json({
      success: true,
      message: 'Comment deleted successfully',
    });
  } catch (error) {
    next(error);
  }
});

export default router;
