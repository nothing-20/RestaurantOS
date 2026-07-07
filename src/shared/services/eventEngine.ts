import { collection, addDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { IRestaurantEvent } from '../types';

/**
 * Centralized Event Engine Logger
 * Logs key business actions asynchronously under the tenant's events stream collection.
 */
export const logEvent = async (
  tenantId: string,
  event: Omit<IRestaurantEvent, 'eventId' | 'timestamp' | 'tenantId'> & { tenantId?: string }
): Promise<void> => {
  if (!tenantId) return;

  const eventData = {
    tenantId,
    ...event,
    timestamp: new Date().toISOString()
  };

  // Run in a non-blocking background promise
  addDoc(collection(db, 'restaurants', tenantId, 'events'), eventData)
    .then((docRef) => {
      // Successfully logged
    })
    .catch((err) => {
      console.error('[EventEngine] Error logging event:', err);
    });
};
