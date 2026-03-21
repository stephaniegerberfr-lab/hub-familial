import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyC0KjdnJfhRjWiKXlnYud28CkujTe-9hPM",
  authDomain: "hub-familial-73ba3.firebaseapp.com",
  projectId: "hub-familial-73ba3",
  storageBucket: "hub-familial-73ba3.firebasestorage.app",
  messagingSenderId: "48045408946",
  appId: "1:48045408946:web:45937aa45f94eff3cfffab",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
