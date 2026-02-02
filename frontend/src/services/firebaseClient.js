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
