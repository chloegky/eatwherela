import { createApp } from 'vue'
import router from './route/routes.js' // for routing 
// import './style.css'
import App from './App.vue'

// firebase
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyASQJECionJWIsNmA5Ik4oQ-sD94wuYAEY",
  authDomain: "eatwhatlah-b6d02.firebaseapp.com",
  databaseURL: "https://eatwhatlah-b6d02-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "eatwhatlah-b6d02",
  storageBucket: "eatwhatlah-b6d02.firebasestorage.app",
  messagingSenderId: "1059550584917",
  appId: "1:1059550584917:web:bbc0dae4c9d7592d3474dc"
};

// Initialize Firebase
initializeApp(firebaseConfig);

const app = createApp(App)
app.use(router).mount('#app')
