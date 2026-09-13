import { initializeApp } from 'firebase/app';
import { getFirestore, collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import fs from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read .env
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

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function runTests() {
  console.log('--- TEST 1: Unauthenticated collection query (getDocs) ---');
  try {
    const q = query(
      collection(db, 'employees'),
      where('activationStatus', '==', 'invited')
    );
    const snap = await getDocs(q);
    console.log(`VULNERABILITY DETECTED: Query returned ${snap.size} documents!`);
  } catch (err) {
    console.log('PASS: Unauthenticated collection query was blocked by rule:', err.code);
  }

  console.log('\n--- TEST 2: Unauthenticated single document fetch (getDoc) with known ID ---');
  try {
    const dSnap = await getDoc(doc(db, 'employees', 'xQY1i04Dueeg6sxPW2ZO'));
    if (dSnap.exists()) {
      const data = dSnap.data();
      console.log(`PASS: Unauthenticated single document fetch succeeded for invited employee: ${data.fullName} (${data.role})`);
    } else {
      console.log('Doc does not exist');
    }
  } catch (err) {
    console.log('FAIL: getDoc failed:', err.message);
  }
}

runTests();
