import "dotenv/config";
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";


const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACC)

initializeApp({
    credential: cert(serviceAccount),
});

const db = getFirestore();
export { db, getAuth }