// 1. MUST BE FIRST: Load Environment Variables
import 'dotenv/config'; 

// 2. Admin SDK Imports
import admin from "firebase-admin";

// 3. Client SDK Imports (Only if you specifically need client-side auth on the backend)
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// 4. Load Service Account
import serviceAccount from "../qr-payment-adminsdk.json" with { type: "json" };

// 5. Initialize Admin SDK (Critical Fix here)
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    // Explicitly pull the project_id from the JSON to stop the "Unknown" error
    projectId: serviceAccount.project_id 
  });
  console.log("🔥 Firebase Admin initialized for project:", serviceAccount.project_id);
}

// 6. Client SDK Config
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID
};

// 7. Initialize Client SDK
const clientApp = initializeApp(firebaseConfig);

// 8. Exports
export const adminAuth = admin.auth(); // Use this for verifyIdToken
export const db = admin.firestore();    // This is your server-side Firestore
export const clientAuth = getAuth(clientApp); 

// Debug check for the API Key
console.log("Checking API Key:", process.env.FIREBASE_API_KEY ? "✅ Found" : "❌ Still Undefined");

export { admin };