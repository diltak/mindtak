// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from 'firebase/firestore';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDI_XbMJgTUbehDoxhMQIOdD6joiBjLqFU",
  authDomain: "mindtest-94298.firebaseapp.com",
  projectId: "mindtest-94298",
  storageBucket: "mindtest-94298.firebasestorage.app",
  messagingSenderId: "620046306833",
  appId: "1:620046306833:web:aea27de390e3c9ebf32bb0",
  measurementId: "G-1ZLD1GX15N"
};
// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const db = getFirestore(app);


