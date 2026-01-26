import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import db from '../services/firebase.js';
import { createMember } from '../models/Member.js';

const slugify = (str) => str
  .toString()
  .trim()
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/(^-|-$)+/g, '');
import { createPost } from '../models/Post.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read and parse JSON data
const loadData = () => {
  try {
    const dataPath = path.join(__dirname, '../../../data/dali_social_media.json');
    const rawData = fs.readFileSync(dataPath, 'utf8');
    const parsed = JSON.parse(rawData);

    // Deduplicate by name (case-insensitive, trimmed)
    const seen = new Set();
    const deduped = [];
    for (const entry of parsed) {
      const key = (entry.name || '').trim().toLowerCase();
      if (!key) continue;
      if (seen.has(key)) {
        console.warn(`Skipping duplicate entry for ${entry.name}`);
        continue;
      }
      seen.add(key);
      deduped.push(entry);
    }
    return deduped;
  } catch (error) {
    console.error('Error loading data file:', error);
    return [];
  }
};

// Seed members
const seedMembers = async () => {
  const members = loadData();
  console.log(`Seeding ${members.length} members...`);

  if (members.length === 0) {
    console.log('⚠️  No members found in data file');
    return 0;
  }

  let batch = db.batch();
  let count = 0;
  let batchCount = 0;

  for (const memberData of members) {
    const idFromName = slugify(memberData.name || '');
    const memberRef = db.collection('members').doc(idFromName || undefined);
    const member = createMember(memberData);
    batch.set(memberRef, member, { merge: true });
    count++;
    batchCount++;

    // Commit in batches of 500 (Firestore limit)
    if (batchCount >= 500) {
      await batch.commit();
      console.log(`Committed ${count} members...`);
      batch = db.batch(); // Create new batch
      batchCount = 0;
    }
  }

  // Commit remaining members
  if (batchCount > 0) {
    await batch.commit();
  }

  console.log(`✅ Successfully seeded ${count} members`);
  return count;
};

// Generate sample posts
const generateSamplePosts = async () => {
  console.log('Generating sample posts...');
  
  const membersSnapshot = await db.collection('members').limit(20).get();
  const members = membersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  const samplePosts = [
    "Just finished an amazing project! 🚀",
    "Excited to share my latest work with the DALI lab!",
    "Working on something cool, stay tuned!",
    "Great meeting today! Love collaborating with this team.",
    "New design system is looking fantastic!",
    "Code review session was super helpful.",
    "Just shipped a new feature! 🎉",
    "Learning so much from this community!",
  ];

  const batch = db.batch();
  let count = 0;

  for (const member of members) {
    // Each member gets 1-3 random posts
    const numPosts = Math.floor(Math.random() * 3) + 1;
    
    for (let i = 0; i < numPosts; i++) {
      const postRef = db.collection('posts').doc();
      const post = createPost({
        authorId: member.id,
        authorName: member.name,
        authorImage: member.profileImage || member.image || '',
        content: samplePosts[Math.floor(Math.random() * samplePosts.length)],
        createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000), // Random time in last 7 days
      });
      batch.set(postRef, post);
      count++;
    }
  }

  await batch.commit();
  console.log(`✅ Successfully generated ${count} sample posts`);
  return count;
};

// Main seeder function
const seed = async () => {
  try {
    console.log('🌱 Starting data seeding...\n');

    const memberCount = await seedMembers();
    const postCount = await generateSamplePosts();

    console.log('\n✨ Seeding complete!');
    console.log(`   - Members: ${memberCount}`);
    console.log(`   - Posts: ${postCount}`);
  } catch (error) {
    console.error('❌ Error seeding data:', error);
    process.exit(1);
  }
};

// Run seeder
seed();
