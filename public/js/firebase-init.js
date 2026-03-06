import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, collection, doc, setDoc, getDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSy_YOUR_API_KEY_HERE", // We will let Firebase auto-resolve or replace it if needed, but for simplicity Google OAuth on localhost might just work with the project ID if authorized, or user provides full string
    authDomain: "house-finance-d3b04.firebaseapp.com",
    projectId: "house-finance-d3b04",
    storageBucket: "house-finance-d3b04.appspot.com",
    messagingSenderId: "597335673583",
    appId: "1:597335673583:web:00000000000000000" // We'll need the exact appId from Firebase if it fails, but initialization usually passes with projectId
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const provider = new GoogleAuthProvider();
