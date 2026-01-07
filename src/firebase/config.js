import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyBIQaHpTpXgca4gBUM1h3FJ7G1-d_VEwuc",
  authDomain: "droppoint-d82ef.firebaseapp.com",
  projectId: "droppoint-d82ef",
  storageBucket: "droppoint-d82ef.firebasestorage.app",
  messagingSenderId: "165087375484",
  appId: "1:165087375484:web:a968bb83496f46456319f9",
  measurementId: "G-XWVQ5H8W4V",
  databaseURL: "https://droppoint-d82ef-default-rtdb.asia-southeast1.firebasedatabase.app"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const database = getDatabase(app);
export const auth = getAuth(app);

export default app;

