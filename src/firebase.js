import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, initializeFirestore, CACHE_SIZE_UNLIMITED } from "firebase/firestore";

const getFirebaseConfig = () => {
  if (typeof __firebase_config !== 'undefined') {
    return JSON.parse(__firebase_config);
  }
  return {
    apiKey: "AIzaSyDnanZQ6m9qg6QmRm52UEzZtPIZzbYfwt0",
    authDomain: "smartsalary-31bb7.firebaseapp.com",
    projectId: "smartsalary-31bb7",
    storageBucket: "smartsalary-31bb7.firebasestorage.app",
    messagingSenderId: "566475425090",
    appId: "1:566475425090:web:8769bea42e5f2a6694f4db",
    measurementId: "G-LWMZ3GRMH4"
  };
};

const app = initializeApp(getFirebaseConfig());
export const auth = getAuth(app);

// Initialize Firestore with cache disabled to prevent hanging
export const db = initializeFirestore(app, {
  cacheSizeBytes: CACHE_SIZE_UNLIMITED,
  experimentalForceLongPolling: true, // Use long-polling instead of WebSockets
});

console.log("✅ Firestore initialized with long-polling");

export const appId = typeof __app_id !== 'undefined' ? __app_id : 'smartsalary-default';