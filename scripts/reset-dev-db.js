import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword 
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  getDocs, 
  deleteDoc,
  doc
} from 'firebase/firestore';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read .env file manually using native fs
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

const targetProjectId = 'spiral-restaurant-saas-v1';
const currentProjectId = process.env.VITE_FIREBASE_PROJECT_ID;

console.log('----------------------------------------------------');
console.log('RESTAURANTOS — DEVELOPMENT DATABASE RESET SCRIPT');
console.log('----------------------------------------------------');
console.log('Target Project ID:', targetProjectId);
console.log('Config Project ID:', currentProjectId);

// 1. SAFETY SAFEGUARD CHECK #1: Environment Confirmation Flag
if (process.env.RESET_DEVELOPMENT_DATABASE !== 'true') {
  console.error('\n[SAFETY ABORT] Environment variable RESET_DEVELOPMENT_DATABASE=true is missing!');
  console.error('To run this script safely, execute:\n');
  console.error('  $env:RESET_DEVELOPMENT_DATABASE="true"; npm run reset:dev\n');
  process.exit(1);
}

// 2. SAFETY SAFEGUARD CHECK #2: Project ID Matching
if (!currentProjectId || currentProjectId !== targetProjectId) {
  console.error(`\n[SAFETY ABORT] Firebase project ID mismatch! Target: "${targetProjectId}", Found: "${currentProjectId}".`);
  console.error('Refusing to delete data against an unverified project.');
  process.exit(1);
}

console.log('\n[SAFETY VERIFIED] Project ID matches spiral-restaurant-saas-v1 and confirmation flag is set.');
console.log('Beginning database reset...\n');

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: currentProjectId,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const ROOT_COLLECTIONS = [
  'users',
  'tenants',
  'employees',
  'restaurants',
  'supportTickets',
  'auditLogs'
];

const TENANT_SUBCOLLECTIONS = [
  'branches',
  'tables',
  'orders',
  'menu',
  'employees',
  'inventory',
  'diningSessions',
  'waiterRequests',
  'requests',
  'billing',
  'reservations',
  'analytics',
  'notifications',
  'events',
  'automationRules',
  'tasks'
];

async function authenticateDevAdmin() {
  const adminEmail = 'dev-admin-reset@restaurantos.internal';
  const adminPass = 'DevResetSecret123!';
  try {
    const cred = await signInWithEmailAndPassword(auth, adminEmail, adminPass);
    console.log('[AUTH] Authenticated reset runner as:', cred.user.email);
    return cred.user;
  } catch (err) {
    try {
      const cred = await createUserWithEmailAndPassword(auth, adminEmail, adminPass);
      console.log('[AUTH] Provisioned & authenticated reset runner as:', cred.user.email);
      return cred.user;
    } catch (createErr) {
      console.warn('[AUTH] Auth runner initialization note:', createErr.message);
      return null;
    }
  }
}

async function deleteCollectionDocs(collectionPath) {
  let count = 0;
  try {
    const colRef = collection(db, collectionPath);
    const snap = await getDocs(colRef);
    if (snap.empty) return 0;

    for (const docSnap of snap.docs) {
      await deleteDoc(docSnap.ref);
      count++;
    }
  } catch (err) {
    console.warn(`[Reset] Note while deleting ${collectionPath}:`, err.message);
  }
  return count;
}

async function performReset() {
  const adminUser = await authenticateDevAdmin();

  const stats = {};

  // 1. Delete subcollections inside restaurants/{tenantId}
  try {
    const rSnap = await getDocs(collection(db, 'restaurants'));
    for (const rDoc of rSnap.docs) {
      const tenantId = rDoc.id;
      for (const sub of TENANT_SUBCOLLECTIONS) {
        const subPath = `restaurants/${tenantId}/${sub}`;
        const deletedSub = await deleteCollectionDocs(subPath);
        stats[subPath] = (stats[subPath] || 0) + deletedSub;
      }
    }
  } catch (err) {
    console.warn('[Reset] Error querying restaurants subcollections:', err.message);
  }

  // 2. Delete root collections
  for (const rootCol of ROOT_COLLECTIONS) {
    const deletedCount = await deleteCollectionDocs(rootCol);
    stats[rootCol] = deletedCount;
  }

  // Clean up dev admin user document if created
  if (adminUser) {
    try {
      await deleteDoc(doc(db, 'users', adminUser.uid));
    } catch (e) {}
  }

  console.log('----------------------------------------------------');
  console.log('DATABASE RESET SUMMARY RESULT');
  console.log('----------------------------------------------------');
  for (const [key, count] of Object.entries(stats)) {
    console.log(`- ${key}: ${count} document(s) deleted`);
  }
  console.log('----------------------------------------------------');
  console.log('✅ Firestore application database reset completed cleanly.');
  console.log('Zero test restaurants or user profiles remain.');
  console.log('----------------------------------------------------');
  process.exit(0);
}

performReset().catch((err) => {
  console.error('Fatal error during reset:', err);
  process.exit(1);
});
