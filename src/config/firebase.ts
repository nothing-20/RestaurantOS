// Re-export initialized Firebase services from the centralized shared config module
import app, { auth as firebaseAuth, db as firebaseDb, storage as firebaseStorage } from '../shared/firebase/config';

export const auth = firebaseAuth;
export const db = firebaseDb;
export const storage = firebaseStorage;
export default app;
