// frontend/src/firebase.js

// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth"; // For Authentication
import { getFirestore } from "firebase/firestore"; // Firestore

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBYfYPsTkPhALxDvG6jEYGrtQql0nXK6jA",
  authDomain: "bc3415-ai-customer-support.firebaseapp.com",
  projectId: "bc3415-ai-customer-support",
  storageBucket: "bc3415-ai-customer-support.appspot.com",
  messagingSenderId: "315331431773",
  appId: "1:315331431773:web:f0e4beec38fda468e9acb4",
  measurementId: "G-8PDQVNQEEM"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services you need
const auth = getAuth(app);
const firestore = getFirestore(app);

// Export the Firebase services so they can be used in the app
export { auth , firestore };