// src/firebase.js
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBByF2JxPbXKUSLejEHYeqzv60et-h0MBA",
  authDomain: "ynp-prototype.firebaseapp.com",
  projectId: "ynp-prototype",
  storageBucket: "ynp-prototype.firebasestorage.app",
  messagingSenderId: "481569128045",
  appId: "1:481569128045:web:336307f853974457f78964",
  measurementId: "G-MJM2VGQQM3"
};
const app = initializeApp(firebaseConfig);

const db = getFirestore(app);

export { db };
