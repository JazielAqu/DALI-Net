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
