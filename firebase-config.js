// firebase-config.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
// HE AÑADIDO: query, where
import { getFirestore, collection, addDoc, getDocs, query, where } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDL-dmJzqy-B4sxY3JGN81x5lQA8e_Xtag",
  authDomain: "barberia-hugo.firebaseapp.com",
  projectId: "barberia-hugo",
  storageBucket: "barberia-hugo.firebasestorage.app",
  messagingSenderId: "811069790344",
  appId: "1:811069790344:web:15f51f6b641026dc7ce73d",
  measurementId: "G-BEDZDX7MYQ"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// HE AÑADIDO AL FINAL: query, where
export { db, collection, addDoc, getDocs, query, where };