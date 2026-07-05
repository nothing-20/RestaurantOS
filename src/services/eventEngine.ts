import { collection, addDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { IRestaurantEvent } from '../types';

/**
 * Centralized Event Engine Logger
 * Logs key business actions asynchronously under the tenant's events stream collection.
 */
export const logEvent = async (
  tenantId: string,
  event: Omit<IRestaurantEvent, 'eventId' | 'timestamp'>
): Promise<void> => {
  if (!tenantId) return;

  const eventData = {
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
