import express from 'express';
import db from '../services/firebase.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// GET /api/members - Get all members (with pagination, search, filter)
router.get('/', async (req, res, next) => {
  try {
    const { search, role, year, limit = 500 } = req.query;
    let query = db.collection('members');

    // Apply filters
    if (role) {
      query = query.where('role', '==', role);
    }
    if (year) {
      query = query.where('year', '==', year);
    }

    // Get members (simple fetch to avoid index errors and missing results)
    let snapshot;
    try {
      snapshot = await query.limit(parseInt(limit)).get();
    } catch (err) {
      console.error('Error fetching members, falling back to full fetch:', err);
      snapshot = await db.collection('members').limit(500).get();
    }
    
    // Collect and deduplicate by normalized name to avoid duplicates from seeding
    const membersByName = new Map();
    snapshot.forEach(doc => {
      const data = { id: doc.id, ...doc.data() };
      const key = (data.name || '').trim().toLowerCase();
      if (!key) return;
      if (!membersByName.has(key)) {
        membersByName.set(key, data);
      }
    });
    let members = Array.from(membersByName.values());

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

    let snapshot;
    try {
      snapshot = await db.collection('posts')
        .where('authorId', '==', id)
        .orderBy('createdAt', 'desc')
        .limit(parseInt(limit))
        .get();
    } catch (err) {
      console.error('Error fetching posts with orderBy createdAt (falling back without sort):', err);
      snapshot = await db.collection('posts')
        .where('authorId', '==', id)
        .limit(parseInt(limit))
        .get();
    }

    const posts = [];
    snapshot.forEach(doc => {
      posts.push({ id: doc.id, ...doc.data() });
    });

    // If we fell back to unsorted fetch, sort by createdAt in memory
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

// POST /api/members/self - Create minimal profile for authenticated user
// (placed before the generic "/" route so /self does not get swallowed)
router.post('/self', requireAuth, async (req, res, next) => {
  try {
    const uid = req.user.uid;
    const existing = await db.collection('members').doc(uid).get();
    if (existing.exists) {
      return res.status(200).json({ success: true, data: { id: uid, ...existing.data() } });
    }
    const avatar =
      req.user.picture ||
      req.user.image ||
      req.user.photoURL ||
      '/default-avatar.jpg';

    const member = {
      name: req.user.name || 'New Member',
      email: req.user.email || '',
      profileImage: avatar,
      image: avatar,
      picture: avatar,
      locked: true, // newly created accounts require real auth
      completedProfile: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    await db.collection('members').doc(uid).set(member);
    res.status(201).json({ success: true, data: { id: uid, ...member } });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/members/self - Remove the authenticated user's profile and related edges
router.delete('/self', requireAuth, async (req, res, next) => {
  try {
    const uid = req.user.uid;

    const doc = await db.collection('members').doc(uid).get();
    if (!doc.exists) {
      return res.status(404).json({ success: false, error: { message: 'Member not found' } });
    }
    const data = doc.data() || {};
    // Only allow deletion of locked (user-created) accounts; seeded/demo profiles remain undeletable
    if (data.locked !== true) {
      return res.status(403).json({ success: false, error: { message: 'This profile cannot be deleted' } });
    }

    // Delete member document if it exists
    await doc.ref.delete();

    // Best-effort cleanup of edges (follow, likes, posts, comments)
    const cleanCollection = async (collection, field) => {
      const snap = await db.collection(collection).where(field, '==', uid).get();
      const deletions = [];
      snap.forEach((doc) => deletions.push(doc.ref.delete()));
      return Promise.all(deletions);
    };

    await Promise.all([
      cleanCollection('following', 'followerId'),
      cleanCollection('following', 'followingId'),
      cleanCollection('likes', 'userId'),
      cleanCollection('posts', 'authorId'),
      cleanCollection('comments', 'userId'),
    ]);

    res.json({ success: true, data: { id: uid, deleted: true } });
  } catch (error) {
    next(error);
  }
});

// POST /api/members - Create new member (for testing/seeding)
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

// PATCH /api/members/:id - Update member (profile fields)
router.patch('/:id', requireAuth, async (req, res, next) => {
  try {
    const { id } = req.params;

    if (req.user.uid !== id) {
      return res.status(403).json({
        success: false,
        error: { message: 'You can only update your own profile' },
      });
    }

    const updates = {};

    const allowedFields = [
      'name',
      'year',
      'major',
      'minor',
      'birthday',
      'home',
      'quote',
      'favoriteThing1',
      'favoriteThing2',
      'favoriteThing3',
      'favoriteDartmouthTradition',
      'funFact',
      'bio',
      'role',
      'dev',
      'des',
      'pm',
      'core',
      'mentor',
      'completedProfile',
      'profileImage',
      'image',
      'picture',
    ];
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        error: { message: 'No valid fields provided for update' },
      });
    }

    const memberRef = db.collection('members').doc(id);
    const memberDoc = await memberRef.get();

    if (!memberDoc.exists) {
      return res.status(404).json({
        success: false,
        error: { message: 'Member not found' },
      });
    }

    updates.updatedAt = new Date();
    await memberRef.update(updates);

    const updatedDoc = await memberRef.get();
    res.json({
      success: true,
      data: { id: updatedDoc.id, ...updatedDoc.data() },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
