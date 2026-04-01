import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

// Your new web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyDNFdng0rdwPnMvFOifmv_f5jgVVinpDJo",
    authDomain: "attendance-tracker-569b0.firebaseapp.com",
    projectId: "attendance-tracker-569b0",
    storageBucket: "attendance-tracker-569b0.firebasestorage.app",
    messagingSenderId: "889096117625",
    appId: "1:889096117625:web:83a15047e72fa9355263a8",
    measurementId: "G-CB5ZC6EL5C"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Export the database instance for App.jsx
export const db = getFirestore(app);