import { 
  doc, 
  getDoc, 
  setDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  collection, 
  DocumentData 
} from 'firebase/firestore';
import { db } from '../config/firebase';

export const dbService = {
  /**
   * Fetches a single typed document from Firestore.
   */
  async getDocument<T>(collectionPath: string, docId: string): Promise<T | null> {
    const docRef = doc(db, collectionPath, docId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as T;
    }
    return null;
  },

  /**
   * Adds a new document to a collection with a generated ID.
   */
  async addDocument<T extends DocumentData>(collectionPath: string, data: T): Promise<string> {
    const colRef = collection(db, collectionPath);
    const docRef = await addDoc(colRef, data);
    return docRef.id;
  },

  /**
   * Creates or overwrites a document with a specific ID.
   */
  async setDocument<T extends DocumentData>(collectionPath: string, docId: string, data: T): Promise<void> {
    const docRef = doc(db, collectionPath, docId);
    return setDoc(docRef, data);
  },

  /**
   * Updates fields of a document.
   */
  async updateDocument<T extends DocumentData>(collectionPath: string, docId: string, data: Partial<T>): Promise<void> {
    const docRef = doc(db, collectionPath, docId);
    return updateDoc(docRef, data as DocumentData);
  },

  /**
   * Deletes a document.
   */
  async deleteDocument(collectionPath: string, docId: string): Promise<void> {
    const docRef = doc(db, collectionPath, docId);
    return deleteDoc(docRef);
  }
};
export default dbService;
