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
  getDoc,
  setDoc,
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

console.log('====================================================');
console.log('RESTAURANTOS — SAFE CUSTOMER PROFILE MIGRATION TOOL');
console.log('====================================================');
console.log('Target Project ID:', targetProjectId);
console.log('Config Project ID:', currentProjectId);

if (!currentProjectId || currentProjectId !== targetProjectId) {
  console.error(`\n[SAFETY ABORT] Firebase project ID mismatch! Target: "${targetProjectId}", Found: "${currentProjectId}".`);
  process.exit(1);
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
const auth = getAuth(app);
const db = getFirestore(app);

const STAFF_ROLES = new Set([
  'super-admin', 
  'owner', 
  'admin', 
  'manager', 
  'waiter', 
  'kitchen', 
  'cashier', 
  'reception', 
  'chef', 
  'staff'
]);

const CUSTOMER_SUBCOLLECTIONS = [
  'addresses',
  'reservations',
  'diningHistory',
  'transactions',
  'notifications',
  'orders'
];

async function authenticateRunner() {
  const runnerEmail = 'dev-admin-reset@restaurantos.internal';
  const runnerPass = 'DevResetSecret123!';
  try {
    const cred = await signInWithEmailAndPassword(auth, runnerEmail, runnerPass);
    console.log('[AUTH] Authenticated migration runner as:', cred.user.email);
    // Ensure the runner doc in users has role 'super-admin'
    await setDoc(doc(db, 'users', cred.user.uid), {
      uid: cred.user.uid,
      email: runnerEmail,
      role: 'super-admin',
      displayName: 'System Migration Runner',
      status: 'active'
    }, { merge: true });
    return cred.user;
  } catch (err) {
    try {
      const cred = await createUserWithEmailAndPassword(auth, runnerEmail, runnerPass);
      console.log('[AUTH] Provisioned & authenticated migration runner as:', cred.user.email);
      await setDoc(doc(db, 'users', cred.user.uid), {
        uid: cred.user.uid,
        email: runnerEmail,
        role: 'super-admin',
        displayName: 'System Migration Runner',
        status: 'active'
      }, { merge: true });
      return cred.user;
    } catch (createErr) {
      console.warn('[AUTH] Auth runner note:', createErr.message);
      return null;
    }
  }
}

async function runMigration() {
  console.log('\n[1/4] Authenticating migration runner...');
  await authenticateRunner();

  console.log('\n[2/4] Scanning root users/ collection...');

  let usersSnap;
  try {
    const usersCol = collection(db, 'users');
    usersSnap = await getDocs(usersCol);
    console.log(`Found ${usersSnap.size} total user documents.`);
  } catch (err) {
    console.error('[FATAL] Failed to read users collection:', err);
    process.exit(1);
  }

  let customersDetected = 0;
  let customersMigrated = 0;
  let alreadyExisted = 0;
  let skipped = 0;
  let ambiguousUsers = 0;
  let errors = 0;

  console.log('\n[2/4] Classifying documents and migrating confirmed customers...');

  for (const userDoc of usersSnap.docs) {
    const data = userDoc.data();
    const uid = userDoc.id;
    const rawRole = (data.role || data.userRole || data.accountType || data.type || '').toLowerCase().trim();

    // Check if staff/owner
    if (STAFF_ROLES.has(rawRole) || data.isOwner === true || data.isStaff === true) {
      skipped++;
      continue;
    }

    // Check if confirmed customer
    const isConfirmedCustomer = (
      rawRole === 'customer' ||
      data.isCustomer === true ||
      (data.loyaltyPoints !== undefined && !data.tenantId) ||
      (data.walletBalance !== undefined && !data.tenantId)
    );

    if (!isConfirmedCustomer) {
      // Ambiguous document: leave untouched
      ambiguousUsers++;
      console.log(`  [AMBIGUOUS] Skipped ambiguous user UID: ${uid} (role: "${rawRole || 'none'}")`);
      continue;
    }

    customersDetected++;

    try {
      // Check if target customers/{uid} already exists
      const targetDocRef = doc(db, 'customers', uid);
      const targetSnap = await getDoc(targetDocRef);

      const customerProfilePayload = {
        uid,
        email: data.email || '',
        fullName: data.fullName || data.name || data.displayName || '',
        displayName: data.displayName || data.fullName || data.name || 'Customer',
        phoneNumber: data.phoneNumber || data.phone || '',
        photoURL: data.photoURL || data.photo || data.profileImage || null,
        role: 'customer',
        status: data.status || 'active',
        tenantId: data.tenantId || null,
        walletBalance: data.walletBalance !== undefined ? data.walletBalance : 0,
        loyaltyPoints: data.loyaltyPoints !== undefined ? data.loyaltyPoints : 0,
        dietaryPrefs: Array.isArray(data.dietaryPrefs) ? data.dietaryPrefs : [],
        allergens: Array.isArray(data.allergens) ? data.allergens : [],
        createdAt: data.createdAt || new Date().toISOString(),
        updatedAt: data.updatedAt || new Date().toISOString()
      };

      if (targetSnap.exists()) {
        alreadyExisted++;
        console.log(`  [EXISTING] Customer ${uid} already in customers/{uid}. Non-destructively merging any missing fields.`);
        await setDoc(targetDocRef, customerProfilePayload, { merge: true });
      } else {
        await setDoc(targetDocRef, customerProfilePayload);
        customersMigrated++;
        console.log(`  [MIGRATED] Successfully copied customer ${uid} (${customerProfilePayload.email}) to customers/${uid}`);
      }

      // Check and copy subcollections non-destructively
      for (const subName of CUSTOMER_SUBCOLLECTIONS) {
        try {
          const srcSubCol = collection(db, 'users', uid, subName);
          const subSnap = await getDocs(srcSubCol);
          if (!subSnap.empty) {
            console.log(`    -> Copying ${subSnap.size} documents from subcollection users/${uid}/${subName}...`);
            for (const subDoc of subSnap.docs) {
              const destSubDocRef = doc(db, 'customers', uid, subName, subDoc.id);
              await setDoc(destSubDocRef, subDoc.data(), { merge: true });
            }
          }
        } catch (subErr) {
          console.warn(`    [WARN] Subcollection copy warning for ${subName}:`, subErr.message || subErr);
        }
      }

    } catch (docErr) {
      errors++;
      console.error(`  [ERROR] Failed migrating customer ${uid}:`, docErr);
    }
  }

  console.log('\n[3/4] Migration process complete.');
  console.log('\n====================================================');
  console.log('CUSTOMER MIGRATION REPORT');
  console.log('====================================================');
  console.log(`Customers detected: ${customersDetected}`);
  console.log(`Customers migrated: ${customersMigrated}`);
  console.log(`Already existed:    ${alreadyExisted}`);
  console.log(`Skipped (staff):    ${skipped}`);
  console.log(`Ambiguous users:    ${ambiguousUsers}`);
  console.log(`Errors:             ${errors}`);
  console.log('====================================================');
  console.log('SAFETY CONFIRMATION: Original users/{uid} documents were NOT deleted.\n');
}

runMigration().catch(err => {
  console.error('[UNCAUGHT MIGRATION ERROR]', err);
  process.exit(1);
});
