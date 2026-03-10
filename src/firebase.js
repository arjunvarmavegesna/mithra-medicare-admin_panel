// src/firebase.js - Firebase client config
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Replace these with your actual Firebase config from Firebase Console
// Project Settings > General > Your apps > Firebase SDK snippet
const firebaseConfig = {
  apiKey: "AIzaSyAUWXydMqADce-6kDkUXonA7CMQibO9-sg",
  authDomain: "whatsapp-appointment-bot-19760.firebaseapp.com",
  projectId: "whatsapp-appointment-bot-19760",
  storageBucket: "whatsapp-appointment-bot-19760.firebasestorage.app",
  messagingSenderId: "647366704045",
  appId: "1:647366704045:web:5f9b517be87f3b77acbf24"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
