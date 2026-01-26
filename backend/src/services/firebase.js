import admin from 'firebase-admin';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  try {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n').replace(/^"|"$/g, '');
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;

    // Validate required environment variables
    if (!projectId || !privateKey || !clientEmail) {
      throw new Error(
        'Missing required Firebase environment variables. ' +
        `Project ID: ${projectId ? '✓' : '✗'}, ` +
        `Private Key: ${privateKey ? '✓' : '✗'}, ` +
        `Client Email: ${clientEmail ? '✓' : '✗'}`
      );
    }

    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        privateKey,
        clientEmail,
      }),
    });
    console.log('Firebase Admin initialized successfully');
  } catch (error) {
    console.error('Error initializing Firebase Admin:', error);
    throw error;
  }
}

const db = admin.firestore();
export default db;
