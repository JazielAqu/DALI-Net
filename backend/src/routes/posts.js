import express from 'express';
import db from '../services/firebase.js';
import { generateFeed } from '../services/feedService.js';
import { createPost } from '../models/Post.js';

const router = express.Router();

// GET /api/posts - Get all posts (with pagination)
router.get('/', async (req, res, next) => {
  try {
    const { limit = 20, offset = 0 } = req.query;

    const snapshot = await db.collection('posts')
      .orderBy('createdAt', 'desc')
      .limit(parseInt(limit))
      .offset(parseInt(offset))
      .get();

    const posts = [];
    snapshot.forEach(doc => {
      posts.push({ id: doc.id, ...doc.data() });
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

// GET /api/posts/:id - Get post by ID
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const doc = await db.collection('posts').doc(id).get();

    if (!doc.exists) {
      return res.status(404).json({
        success: false,
        error: { message: 'Post not found' },
      });
    }

    res.json({
      success: true,
      data: { id: doc.id, ...doc.data() },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/posts/feed/:userId - Get personalized feed
router.get('/feed/:userId', async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { limit = 20 } = req.query;

    const posts = await generateFeed(userId, parseInt(limit));

    res.json({
      success: true,
      data: posts,
      count: posts.length,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/posts - Create new post
router.post('/', async (req, res, next) => {
  try {
    const { authorId, content, imageUrl } = req.body;

    if (!authorId || !content) {
      return res.status(400).json({
        success: false,
        error: { message: 'authorId and content are required' },
      });
    }

    // Get author info
    const authorDoc = await db.collection('members').doc(authorId).get();
    if (!authorDoc.exists) {
      return res.status(404).json({
        success: false,
        error: { message: 'Author not found' },
      });
    }

    const authorData = authorDoc.data();
    const post = createPost({
      authorId,
      authorName: authorData.name,
      authorImage: authorData.profileImage || authorData.image || '',
      content,
      imageUrl: imageUrl || '',
    });

    const postRef = db.collection('posts').doc();
    await postRef.set(post);

    // Create notifications for followers
    const followersSnapshot = await db.collection('following')
      .where('followingId', '==', authorId)
      .get();

    const notificationBatch = db.batch();
    followersSnapshot.forEach(doc => {
      const followerId = doc.data().followerId;
      const notifRef = db.collection('notifications').doc();
      notificationBatch.set(notifRef, {
        userId: followerId,
        type: 'post',
        content: `${authorData.name} created a new post`,
        postId: postRef.id,
        relatedUserId: authorId,
        read: false,
        createdAt: new Date(),
      });
    });

    if (followersSnapshot.size > 0) {
      await notificationBatch.commit();
    }

    res.status(201).json({
      success: true,
      data: { id: postRef.id, ...post },
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/posts/:id - Delete post
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { userId } = req.body; // User ID to verify ownership

    const postDoc = await db.collection('posts').doc(id).get();

    if (!postDoc.exists) {
      return res.status(404).json({
        success: false,
        error: { message: 'Post not found' },
      });
    }

    const postData = postDoc.data();
    
    // Verify ownership (in production, use proper authentication)
    if (userId && postData.authorId !== userId) {
      return res.status(403).json({
        success: false,
        error: { message: 'Not authorized to delete this post' },
      });
    }

    // Delete related likes and comments
    const batch = db.batch();
    
    // Delete likes
    const likesSnapshot = await db.collection('likes')
      .where('postId', '==', id)
      .get();
    likesSnapshot.forEach(doc => batch.delete(doc.ref));

    // Delete comments
    const commentsSnapshot = await db.collection('comments')
      .where('postId', '==', id)
      .get();
    commentsSnapshot.forEach(doc => batch.delete(doc.ref));

    // Delete post
    batch.delete(postDoc.ref);
    await batch.commit();

    res.json({
      success: true,
      message: 'Post deleted successfully',
    });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/posts/:id - Update post
router.patch('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { userId, content, imageUrl } = req.body;

    const postDoc = await db.collection('posts').doc(id);
    const post = await postDoc.get();

    if (!post.exists) {
      return res.status(404).json({
        success: false,
        error: { message: 'Post not found' },
      });
    }

    const postData = post.data();
    
    // Verify ownership
    if (userId && postData.authorId !== userId) {
      return res.status(403).json({
        success: false,
        error: { message: 'Not authorized to update this post' },
      });
    }

    const updates = {
      updatedAt: new Date(),
    };

    if (content !== undefined) updates.content = content;
    if (imageUrl !== undefined) updates.imageUrl = imageUrl;

    await postDoc.update(updates);

    const updatedPost = await postDoc.get();

    res.json({
      success: true,
      data: { id: updatedPost.id, ...updatedPost.data() },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
