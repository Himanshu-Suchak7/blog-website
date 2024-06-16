import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
const firebaseConfig = {
  apiKey: "AIzaSyDBDKaZZW84hpBGxh5LnPatkXq5mgZb9bE",
  authDomain: "blog-website-himanshu.firebaseapp.com",
  projectId: "blog-website-himanshu",
  storageBucket: "blog-website-himanshu.appspot.com",
  messagingSenderId: "607686767908",
  appId: "1:607686767908:web:0e0dcd280b9430a27f6fb1",
  measurementId: "G-JSETS8D97D",
};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const googleProvider = new GoogleAuthProvider();

export { auth, db, storage, googleProvider, app };
