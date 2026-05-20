import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCOsL_SHCxHt_n1WbgPiw5fJ_BD3fJzAl8",
  authDomain: "smartqr-5e4f1.firebaseapp.com",
  projectId: "smartqr-5e4f1",
  storageBucket: "smartqr-5e4f1.firebasestorage.app",
  messagingSenderId: "220673092291",
  appId: "1:220673092291:web:9b7d75545a1312cf6d1076",
  measurementId: "G-GSPZ11G4LW"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export the auth instance
export const auth = getAuth(app);
