import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut as firebaseSignOut, 
  sendPasswordResetEmail,
  sendEmailVerification,
  getIdTokenResult,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  User,
  UserCredential
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from './config';
import { TUserRole } from '../types';

function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-');
}

export const signIn = async (email: string, password: string, rememberMe: boolean): Promise<UserCredential> => {
  const persistenceMode = rememberMe ? browserLocalPersistence : browserSessionPersistence;
  await setPersistence(auth, persistenceMode);
  return signInWithEmailAndPassword(auth, email, password);
};

export const signUpOwner = async (
  email: string, 
  password: string, 
  displayName: string, 
  restaurantName: string
): Promise<UserCredential> => {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;

  const tenantId = `${slugify(restaurantName)}-${Math.random().toString(36).substring(2, 6)}`;

  // Create tenant
  const tenantRef = doc(db, 'tenants', tenantId);
  await setDoc(tenantRef, {
    id: tenantId,
    name: restaurantName,
    logoUrl: '',
    planTier: 'starter',
    status: 'active',
    address: { street: '', city: '', zipCode: '' },
    stripeCustomerId: '',
    stripeSubscriptionId: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });

  // Create user profile — store fullName for WorkspaceContext and StaffLogin compatibility
  const userRef = doc(db, 'users', user.uid);
  await setDoc(userRef, {
    uid: user.uid,
    email,
    fullName: displayName,
    displayName,
    tenantId,
    role: 'owner' as TUserRole,
    status: 'active',
    branchId: '',
    createdAt: new Date().toISOString()
  });

  // Automatically seed default restaurant data
  try {
    const { seedDatabase } = await import('./seed');
    await seedDatabase(tenantId);
  } catch (err) {
    console.error('[Autoseed] Failed to run automatic seeder:', err);
  }

  await user.getIdToken(true);
  return userCredential;
};

export const signUpCustomer = async (
  email: string, 
  password: string, 
  fullName: string,
  phoneNumber?: string
): Promise<UserCredential> => {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;

  // Create user profile in Firestore
  const userRef = doc(db, 'users', user.uid);
  await setDoc(userRef, {
    uid: user.uid,
    fullName,
    email,
    role: 'customer' as TUserRole,
    tenantId: null,
    phoneNumber: phoneNumber || '',
    createdAt: new Date().toISOString()
  });

  return userCredential;
};

export const resetPassword = async (email: string): Promise<void> => {
  return sendPasswordResetEmail(auth, email);
};

export const signOut = async (): Promise<void> => {
  return firebaseSignOut(auth);
};

export const sendEmailVerificationLink = async (user: User): Promise<void> => {
  return sendEmailVerification(user);
};

export const getUserClaims = async (user: User): Promise<{ role?: TUserRole; tenantId?: string }> => {
  const tokenResult = await getIdTokenResult(user, true);
  const claims = tokenResult.claims;
  return {
    role: claims.role as TUserRole | undefined,
    tenantId: claims.tenantId as string | undefined
  };
};
