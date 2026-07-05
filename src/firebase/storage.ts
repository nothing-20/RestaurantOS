import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from './config';

/**
 * Uploads a file to Firebase Storage.
 * If Storage is not available, returns a local fallback object/URL.
 */
export const uploadFile = async (path: string, file: File): Promise<string> => {
  if (!storage) {
    console.warn('[Storage] Firebase Storage is not configured. Falling back to ObjectURL.');
    return URL.createObjectURL(file);
  }

  try {
    const fileRef = ref(storage, path);
    const snapshot = await uploadBytes(fileRef, file);
    const downloadUrl = await getDownloadURL(snapshot.ref);
    return downloadUrl;
  } catch (error) {
    console.error('[Storage] Upload failed:', error);
    // Graceful fallback to avoid app crashes
    return URL.createObjectURL(file);
  }
};
