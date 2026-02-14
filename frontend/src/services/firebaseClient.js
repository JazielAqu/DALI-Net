import { initializeApp, getApps } from 'firebase/app';
import {
  getAuth,
  onAuthStateChanged,
  signInAnonymously,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  EmailAuthProvider,
  linkWithCredential,
  updatePassword,
  fetchSignInMethodsForEmail,
} from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const initFirebase = () => {
  if (!getApps().length) {
    initializeApp(firebaseConfig);
  }
  const auth = getAuth();
  auth.languageCode = 'en';
  return auth;
};

export const auth = initFirebase();
export const onAuthChange = (cb) => onAuthStateChanged(auth, cb);
export const loginAnonymous = () => signInAnonymously(auth);
export const loginGoogle = () => signInWithPopup(auth, new GoogleAuthProvider());
export const logoutFirebase = () => signOut(auth);
export { fetchSignInMethodsForEmail };
export const signUpEmail = async (name, email, password) => {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  if (name) {
    await updateProfile(cred.user, { displayName: name });
  }
  return cred.user;
};
export const signInEmail = (email, password) => signInWithEmailAndPassword(auth, email, password);

// Link a password to the currently signed-in user (e.g., after Google login)
export const linkPassword = async (email, password) => {
  if (!auth.currentUser) throw new Error('No authenticated user to link');
  const credential = EmailAuthProvider.credential(email, password);
  const result = await linkWithCredential(auth.currentUser, credential);
  return result.user;
};

// Change password for a user who already has email/password linked
export const changePassword = async (newPassword) => {
  if (!auth.currentUser) throw new Error('No authenticated user');
  await updatePassword(auth.currentUser, newPassword);
  return auth.currentUser;
};

const estimateDataUrlBytes = (dataUrl) => {
  const base64 = dataUrl.split(',')[1] || '';
  return Math.ceil((base64.length * 3) / 4);
};

const fileToImage = (file) =>
  new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Could not read image file'));
    };
    img.src = url;
  });

const compressToDataUrl = async (file, maxBytes = 950 * 1024) => {
  const img = await fileToImage(file);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not initialize image processing');

  let scale = 1;
  let quality = 0.9;
  let dataUrl = '';

  for (let i = 0; i < 12; i += 1) {
    const width = Math.max(1, Math.round(img.width * scale));
    const height = Math.max(1, Math.round(img.height * scale));
    canvas.width = width;
    canvas.height = height;
    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(img, 0, 0, width, height);
    dataUrl = canvas.toDataURL('image/jpeg', quality);

    if (estimateDataUrlBytes(dataUrl) <= maxBytes) return dataUrl;

    // Reduce quality first, then dimensions as needed.
    if (quality > 0.5) {
      quality -= 0.1;
    } else {
      scale *= 0.85;
    }
  }

  if (estimateDataUrlBytes(dataUrl) > maxBytes) {
    throw new Error('Image is too large. Try a smaller image.');
  }
  return dataUrl;
};

// Compress image and return data URL persisted in Firestore (no paid file storage required)
export const uploadProfileImage = async (file, uid) => {
  if (!file) throw new Error('No file provided');
  if (!uid) throw new Error('User ID required to upload image');
  const MAX_BYTES = 5 * 1024 * 1024; // 5MB
  if (file.size > MAX_BYTES) throw new Error('Image must be under 5MB');
  return compressToDataUrl(file);
};
