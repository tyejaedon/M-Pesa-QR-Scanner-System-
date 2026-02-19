import * as admin from "firebase-admin"; // Imports everything as 'admin'
import { initializeApp, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

import { createRequire } from "module";
const require = createRequire(import.meta.url);
const serviceAccount = require("../qr-payment-adminsdk.json");

const app = initializeApp({
  credential: cert(serviceAccount),
  projectId: serviceAccount.project_id,
});

const auth = getAuth(app);
const db = getFirestore(app);

// Exporting both the specific services and the full admin object
export { admin, auth, db };