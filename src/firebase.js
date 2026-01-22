import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDnanZQ6m9qg6QmRm52UEzZtPIZzbYfwt0",
  authDomain: "smartsalary-31bb7.firebaseapp.com",
  projectId: "smartsalary-31bb7",
  storageBucket: "smartsalary-31bb7.firebasestorage.app",
  messagingSenderId: "566475425090",
  appId: "1:566475425090:web:8769bea42e5f2a6694f4db",
  measurementId: "G-LWMZ3GRMH4"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export Auth and Firestore services
export const auth = getAuth(app);
export const db = getFirestore(app);