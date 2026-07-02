import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
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
import { auth, db } from '../config/firebase';
import { TUserRole } from '../types';

/**
 * Slugifies a string to generate valid URLs and document keys.
 */
function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')         // Replace spaces with -
    .replace(/[^\w\-]+/g, '')     // Remove all non-word chars
    .replace(/\-\-+/g, '-');      // Replace multiple - with single -
}

export const authService = {
  /**
   * Logs in a user with email and password, setting persistence based on rememberMe selection.
   */
  async signInWithEmail(email: string, password: string, rememberMe: boolean): Promise<UserCredential> {
    const persistenceMode = rememberMe ? browserLocalPersistence : browserSessionPersistence;
    await setPersistence(auth, persistenceMode);
    return signInWithEmailAndPassword(auth, email, password);
  },

  /**
   * Registers a new restaurant owner, creating auth credentials and setting up tenant documents in Firestore.
   */
  async signUpOwner(
    email: string, 
    password: string, 
    displayName: string, 
    restaurantName: string
  ): Promise<UserCredential> {
    // 1. Create the Firebase Auth user
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // 2. Generate a clean tenant URL slug slugified from restaurant name
    const tenantId = `${slugify(restaurantName)}-${Math.random().toString(36).substring(2, 6)}`;

    // 3. Instantiate the Tenant profile document in Firestore
    const tenantRef = doc(db, 'tenants', tenantId);
    await setDoc(tenantRef, {
      id: tenantId,
      name: restaurantName,
      logoUrl: '',
      planTier: 'starter', // Default tier for self-serve signups
      status: 'active',
      address: {
        street: '',
        city: '',
        zipCode: ''
      },
      stripeCustomerId: '',
      stripeSubscriptionId: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    // 4. Instantiate the User profile document inside the Firestore users collection
    const userRef = doc(db, 'users', user.uid);
    await setDoc(userRef, {
      uid: user.uid,
      email,
      displayName,
      tenantId,
      role: 'owner' as TUserRole,
      status: 'active',
      createdAt: new Date().toISOString()
    });

    // 5. Force reload authentication state to refresh metadata structures
    await user.getIdToken(true);

    return userCredential;
  },

  /**
   * Triggers the password reset email flow.
   */
  async resetPassword(email: string): Promise<void> {
    return sendPasswordResetEmail(auth, email);
  },

  /**
   * Triggers sign out.
   */
  async signOutUser(): Promise<void> {
    return signOut(auth);
  },

  /**
   * Sends an email verification link to the active user.
   */
  async sendEmailVerificationLink(user: User): Promise<void> {
    return sendEmailVerification(user);
  },

  /**
   * Decodes custom JWT claims to extract the user's role and tenantId parameters.
   */
  async getUserClaims(user: User): Promise<{ role?: TUserRole; tenantId?: string }> {
    const tokenResult = await getIdTokenResult(user, true);
    const claims = tokenResult.claims;
    return {
      role: claims.role as TUserRole | undefined,
      tenantId: claims.tenantId as string | undefined
    };
  }
};
export default authService;
