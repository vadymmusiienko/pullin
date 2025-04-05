import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// Optional: Import Analytics if you enabled it and added the measurement ID
// import { getAnalytics, isSupported } from "firebase/analytics";

// Your web app's Firebase configuration using environment variables
// Ensure these variables are set in your .env.local file
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  // Add measurementId if it exists in your .env.local
  // measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
// We check if apps are already initialized to prevent errors during hot reloading
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Firebase services that you'll use
const firestore = getFirestore(app);
const auth = getAuth(app);
// let analytics; // Initialize Analytics if needed
// if (typeof window !== 'undefined') {
//   isSupported().then((supported) => {
//     if (supported && process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID) {
//       analytics = getAnalytics(app);
//     }
//   });
// }


// Export the initialized services
// Add 'analytics' to the export if you are using it
export { app, firestore, auth };