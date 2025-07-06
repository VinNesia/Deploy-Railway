// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDq2AiS90quxL8Ck3HmwQ18PwspxS9iqeQ",
  authDomain: "vinai-607a6.firebaseapp.com",
  databaseURL: "https://vinai-607a6-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "vinai-607a6",
  storageBucket: "vinai-607a6.firebasestorage.app",
  messagingSenderId: "3770054102",
  appId: "1:3770054102:web:eaa4509fc7eae627286077",
  measurementId: "G-QMYLYSBC03"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);

// Export for use in other parts of the app
export { app, analytics, auth, db };
