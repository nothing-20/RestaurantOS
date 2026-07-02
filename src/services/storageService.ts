import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '../config/firebase';

export const storageService = {
  /**
   * Uploads a file to a specific storage path and returns the public download URL.
   */
  async uploadImage(file: File, path: string): Promise<string> {
    const storageRef = ref(storage, path);
    await uploadBytes(storageRef, file);
    return getDownloadURL(storageRef);
  },

  /**
   * Deletes an image given its public download URL.
   */
  async deleteImage(url: string): Promise<void> {
    const storageRef = ref(storage, url);
    return deleteObject(storageRef);
  }
};
export default storageService;
