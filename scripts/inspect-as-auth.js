import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import fs from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const envPath = resolve(__dirname, '../.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const parts = trimmed.split('=');
      const key = parts[0].trim();
      const val = parts.slice(1).join('=').trim().replace(/^["']|["']$/g, '');
      if (key && !process.env[key]) {
        process.env[key] = val;
      }
    }
  });
}

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);

async function inspectAsAuth() {
  await signInWithEmailAndPassword(auth, 'dev-admin-reset@restaurantos.internal', 'DevResetSecret123!');
  console.log('Signed in as admin. Fetching employees/de1NBlrKBeshTSj611v2...');
  const snap = await getDoc(doc(db, 'employees', 'de1NBlrKBeshTSj611v2'));
  if (snap.exists()) {
    const d = snap.data();
    console.log('CONFIRMED DOCUMENT DATA:');
    console.log('  fullName:        ', d.fullName);
    console.log('  email:           ', d.email);
    console.log('  role:            ', d.role);
    console.log('  tenantId:        ', d.tenantId);
    console.log('  status:          ', d.status);
    console.log('  activationStatus:', d.activationStatus);
    console.log('  firebaseUid:     ', d.firebaseUid);
    console.log('  expiresAt:       ', d.expiresAt);
  } else {
    console.log('Document does not exist');
  }
}

inspectAsAuth();
