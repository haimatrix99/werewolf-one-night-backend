import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import * as dotenv from "dotenv";
dotenv.config();

export const firebaseApp = initializeApp({
  projectId: process.env.PROJECT_ID,
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
});

export const fs = getFirestore();
