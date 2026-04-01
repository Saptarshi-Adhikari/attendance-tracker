import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth"; // Added Auth import
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
    apiKey: "AIzaSyDNFdng0rdwPnMvFOifmv_f5jgVVinpDJo",
    authDomain: "attendance-tracker-569b0.firebaseapp.com",
    projectId: "attendance-tracker-569b0",
    storageBucket: "attendance-tracker-569b0.firebasestorage.app",
    messagingSenderId: "889096117625",
    appId: "1:889096117625:web:83a15047e72fa9355263a8",
    measurementId: "G-CB5ZC6EL5C"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

export const db = getFirestore(app);
export const auth = getAuth(app); // Added Auth export