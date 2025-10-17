import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyASQJECionJWIsNmA5Ik4oQ-sD94wuYAEY",
  authDomain: "eatwhatlah-b6d02.firebaseapp.com",
  databaseURL: "https://eatwhatlah-b6d02-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "eatwhatlah-b6d02",
  storageBucket: "eatwhatlah-b6d02.firebasestorage.app",
  messagingSenderId: "1059550584917", 
  appId: "1:1059550584917:web:bbc0dae4c9d7592d3474dc"
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

export { database };
