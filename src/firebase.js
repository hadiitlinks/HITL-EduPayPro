import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDLO2PF_seuO1Vq6VdI85tn-ubT83hYxqc",
  authDomain: "hitl-edupaypro.firebaseapp.com",
  projectId: "hitl-edupaypro",
  storageBucket: "hitl-edupaypro.firebasestorage.app",
  messagingSenderId: "1078957433543",
  appId: "1:1078957433543:web:8f4d89a145de749c3414e2",
  measurementId: "G-0ENQN66JL7"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export { db, auth };