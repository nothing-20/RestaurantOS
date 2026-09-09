import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase/config';

/**
 * Uploads a restaurant asset (logo or cover image) to Firebase Storage
 * and returns the public download URL.
 *
 * @param tenantId The unique tenant identifier for the restaurant
 * @param file The image File object from an <input type="file">
 * @param type Asset type: 'logo' or 'cover'
 * @returns The resolved download URL from Firebase Storage
 */
export async function uploadRestaurantAsset(
  tenantId: string,
  file: File,
  type: 'logo' | 'cover'
): Promise<string> {
  if (!storage) {
    throw new Error('Firebase Storage is not available or not initialized.');
  }

  // Sanitize file extension
  const rawExt = file.name.split('.').pop()?.toLowerCase();
  const safeExt = rawExt && ['jpg', 'jpeg', 'png', 'webp', 'svg'].includes(rawExt) ? rawExt : 'png';
  const path = `restaurants/${tenantId}/${type}_${Date.now()}.${safeExt}`;
  
  const storageRef = ref(storage, path);
  const metadata = {
    contentType: file.type || 'image/png',
    customMetadata: {
      tenantId,
      assetType: type,
      uploadedAt: new Date().toISOString()
    }
  };

  const snapshot = await uploadBytes(storageRef, file, metadata);
  return await getDownloadURL(snapshot.ref);
}
