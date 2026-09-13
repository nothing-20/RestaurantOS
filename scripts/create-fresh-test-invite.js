import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { getFirestore, collection, addDoc, doc, getDoc } from 'firebase/firestore';
import crypto from 'crypto';
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

async function run() {
  console.log('1. Authenticating as Owner to create a fresh test invitation...');
  const cred = await signInWithEmailAndPassword(auth, 'dev-admin-reset@restaurantos.internal', 'DevResetSecret123!');
  
  const testEmail = `test.kitchen.${Date.now()}@example.com`;
  const token = crypto.randomBytes(32).toString('hex');
  const now = new Date().toISOString();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  const tenantId = 'spiral-restaurant-ilpc';

  const empRef = await addDoc(collection(db, 'employees'), {
    fullName: 'Test Kitchen Staff',
    email: testEmail,
    phone: '+1 555-0199',
    role: 'kitchen',
    department: 'Main Kitchen',
    tenantId: tenantId,
    branchId: 'main',
    status: 'pending',
    activationStatus: 'invited',
    firebaseUid: null,
    invitedAt: now,
    createdAt: now,
    expiresAt: expiresAt,
    createdBy: cred.user.uid,
    updatedAt: now,
    invitationToken: token,
  });

  const employeeId = empRef.id;
  const activationUrl = `https://restaurant-os-dun.vercel.app/staff/activate?token=${token}&email=${encodeURIComponent(testEmail)}&id=${employeeId}`;

  console.log('\n--- FRESH TEST INVITATION CREATED ---');
  console.log('Employee ID:      ', employeeId);
  console.log('Tenant ID:        ', tenantId);
  console.log('Role:             ', 'kitchen');
  console.log('Email:            ', testEmail);
  console.log('Activation Status:', 'invited');
  console.log('Status:           ', 'pending');
  console.log('Expires At:       ', expiresAt);
  console.log('Activation URL:   ', activationUrl);

  // Sign out to test unauthenticated access
  await signOut(auth);
  console.log('\n2. Testing unauthenticated getDoc on newly created invitation...');
  const snap = await getDoc(doc(db, 'employees', employeeId));
  if (snap.exists()) {
    const d = snap.data();
    console.log('PASS: Unauthenticated getDoc retrieved invitation document!');
    console.log(`  Name: ${d.fullName}, Status: ${d.status}, ActivationStatus: ${d.activationStatus}`);
    console.log(`  Token Match: ${d.invitationToken === token ? 'PASS' : 'FAIL'}`);
    console.log(`  Email Match: ${d.email.toLowerCase() === testEmail.toLowerCase() ? 'PASS' : 'FAIL'}`);
    console.log(`  Not Expired: ${new Date(d.expiresAt).getTime() > Date.now() ? 'PASS' : 'FAIL'}`);
  } else {
    console.error('FAIL: Document does not exist!');
  }

  // Also test unauthenticated getDoc on already activated de1NBlrKBeshTSj611v2
  console.log('\n3. Testing unauthenticated getDoc on already-activated invitation (de1NBlrKBeshTSj611v2)...');
  const activatedSnap = await getDoc(doc(db, 'employees', 'de1NBlrKBeshTSj611v2'));
  if (activatedSnap.exists()) {
    const ad = activatedSnap.data();
    console.log('PASS: Unauthenticated getDoc retrieved already-activated document!');
    console.log(`  ActivationStatus: ${ad.activationStatus}`);
    console.log(`  Status: ${ad.status}`);
    console.log(`  Correctly identified as already activated: ${ad.activationStatus === 'activated' ? 'PASS' : 'FAIL'}`);
  } else {
    console.error('FAIL: Could not retrieve already-activated document!');
  }
}

run().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
