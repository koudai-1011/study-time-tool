import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCYLT-IAPGyQ6LXLXJ54RDYkRkh0R8OF4M",
  authDomain: "study-time-allocation-tool.firebaseapp.com",
  projectId: "study-time-allocation-tool",
  storageBucket: "study-time-allocation-tool.firebasestorage.app",
  messagingSenderId: "713436990234",
  appId: "1:713436990234:web:904c6bd0d113f469fffaa3",
  measurementId: "G-YBWN2C6G9J"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);
