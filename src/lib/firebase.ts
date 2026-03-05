import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDPCG0uRdBx6U6RtKX5ZEQRvjq-WVDlI-0",
  authDomain: "p4cfinal.firebaseapp.com",
  projectId: "p4cfinal",
  appId: "1:10919506281:web:0077392dcda1ffa8e4cdf8"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);