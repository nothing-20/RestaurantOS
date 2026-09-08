// Re-export initialized Firebase services from the centralized shared config module
import app, { auth as firebaseAuth, db as firebaseDb, storage as firebaseStorage } from '../shared/firebase/config';
import { getFunctions } from 'firebase/functions';

export const auth = firebaseAuth;
export const db = firebaseDb;
export const storage = firebaseStorage;
export const functions = getFunctions(app);
export default app;
