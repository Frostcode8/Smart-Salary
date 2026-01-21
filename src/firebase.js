// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
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
const analytics = getAnalytics(app);