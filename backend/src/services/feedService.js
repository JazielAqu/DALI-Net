import db from './firebase.js';

/**
 * Generate personalized feed for a user
 * Returns posts from users that the current user follows, ordered by date
 */
export const generateFeed = async (userId, limit = 20) => {
  try {
    // Get list of users that the current user follows
    const followingSnapshot = await db.collection('following')
      .where('followerId', '==', userId)
      .get();

    const followingIds = [];
    followingSnapshot.forEach(doc => {
      followingIds.push(doc.data().followingId);
    });

    // If user doesn't follow anyone, return empty feed or all posts
    if (followingIds.length === 0) {
      // Return recent posts from all users
      const allPostsSnapshot = await db.collection('posts')
        .orderBy('createdAt', 'desc')
        .limit(limit)
        .get();

      const posts = [];
      allPostsSnapshot.forEach(doc => {
        posts.push({ id: doc.id, ...doc.data() });
      });
      return posts;
    }

    // Get posts from followed users
    const posts = [];
    
    // Firestore 'in' query limit is 10, so we need to batch
    const batchSize = 10;
    for (let i = 0; i < followingIds.length; i += batchSize) {
      const batch = followingIds.slice(i, i + batchSize);
      
      // Avoid Firestore composite index issues: fetch the batch without orderBy and sort in memory.
      const postsSnapshot = await db.collection('posts')
        .where('authorId', 'in', batch)
        .get();

      postsSnapshot.forEach(doc => {
        posts.push({ id: doc.id, ...doc.data() });
      });
    }

    // Sort by createdAt and limit
    posts.sort((a, b) => {
      const aTime = a.createdAt?.toMillis?.() || new Date(a.createdAt).getTime();
      const bTime = b.createdAt?.toMillis?.() || new Date(b.createdAt).getTime();
      return bTime - aTime;
    });

    return posts.slice(0, limit);
  } catch (error) {
    console.error('Error generating feed:', error);
    throw error;
  }
};
