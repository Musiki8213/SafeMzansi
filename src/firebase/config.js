import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';
import { getMessaging } from 'firebase/messaging';

// Your Firebase config - replace with your actual config
const firebaseConfig = {
  apiKey: "AIzaSyB_YOUR_ACTUAL_API_KEY_HERE",
  authDomain: "safemzansi.firebaseapp.com",
  projectId: "safemzansi",
  storageBucket: "safemzansi.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);
export const functions = getFunctions(app);
export const messaging = typeof window !== 'undefined' ? getMessaging(app) : null;

export default app;

