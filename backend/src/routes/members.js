import express from 'express';
import db from '../services/firebase.js';

const router = express.Router();

// GET /api/members - Get all members (with pagination, search, filter)
router.get('/', async (req, res, next) => {
  try {
    const { search, role, year, limit = 50, offset = 0 } = req.query;
    let query = db.collection('members');

    // Apply filters
    if (role) {
      query = query.where('role', '==', role);
    }
    if (year) {
      query = query.where('year', '==', year);
    }

    // Get members
    let snapshot = await query.limit(parseInt(limit)).offset(parseInt(offset)).get();
    
    let members = [];
    snapshot.forEach(doc => {
      members.push({ id: doc.id, ...doc.data() });
    });

    // Apply search filter (client-side for simplicity, can be optimized with Algolia)
    if (search) {
      const searchLower = search.toLowerCase();
      members = members.filter(member => 
        member.name?.toLowerCase().includes(searchLower) ||
        member.bio?.toLowerCase().includes(searchLower)
      );
    }

    res.json({
      success: true,
      data: members,
      count: members.length,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/members/:id - Get member by ID
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const doc = await db.collection('members').doc(id).get();

    if (!doc.exists) {
      return res.status(404).json({
        success: false,
        error: { message: 'Member not found' },
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

// GET /api/members/:id/posts - Get all posts by a member
router.get('/:id/posts', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { limit = 20 } = req.query;

    const snapshot = await db.collection('posts')
      .where('authorId', '==', id)
      .orderBy('createdAt', 'desc')
      .limit(parseInt(limit))
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

// GET /api/members/:id/followers - Get followers list
router.get('/:id/followers', async (req, res, next) => {
  try {
    const { id } = req.params;

    const snapshot = await db.collection('following')
      .where('followingId', '==', id)
      .get();

    const followerIds = [];
    snapshot.forEach(doc => {
      followerIds.push(doc.data().followerId);
    });

    // Get member details for each follower
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

// GET /api/members/:id/following - Get following list
router.get('/:id/following', async (req, res, next) => {
  try {
    const { id } = req.params;

    const snapshot = await db.collection('following')
      .where('followerId', '==', id)
      .get();

    const followingIds = [];
    snapshot.forEach(doc => {
      followingIds.push(doc.data().followingId);
    });

    // Get member details for each followed user
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

// POST /api/members - Create new member (for testing)
router.post('/', async (req, res, next) => {
  try {
    const memberData = req.body;
    const memberRef = db.collection('members').doc();
    
    const member = {
      ...memberData,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await memberRef.set(member);

    res.status(201).json({
      success: true,
      data: { id: memberRef.id, ...member },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
