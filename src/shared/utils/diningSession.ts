import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

export interface IDiningSession {
  sessionId: string;
  tenantId: string;
  restaurantId: string;
  branchId: string;
  tableId: string;
  tableNumber: string;
  tableName: string;
  orderSource: 'qr' | 'app';
  isLocked?: boolean;
  status: 'active' | 'completed' | 'cancelled';
  startedAt: string;
  updatedAt?: string;
  closedAt?: string | null;
  customerName?: string;
  customerPhone?: string;
}

const STORAGE_KEY = 'restaurantos_dining_session';

/**
 * Generates a unique canonical session ID: SES-YYYYMMDD-XXXXXX
 */
export const generateSessionId = (): string => {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const rand = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `SES-${dateStr}-${rand}`;
};

/**
 * Retrieves the currently active dining session from sessionStorage or localStorage.
 * Optionally validates that the session matches the expected tenantId.
 */
export const getActiveDiningSession = (expectedTenantId?: string): IDiningSession | null => {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY) || localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const session: IDiningSession = JSON.parse(raw);
    if (!session || !session.sessionId) return null;

    // Check if marked completed or cancelled
    if (session.status === 'completed' || session.status === 'cancelled') {
      return null;
    }

    // Tenant check if requested
    if (expectedTenantId) {
      const match = session.restaurantId === expectedTenantId || session.tenantId === expectedTenantId;
      if (!match) return null;
    }

    return session;
  } catch (err) {
    console.warn('[diningSession] Failed to parse stored session:', err);
    return null;
  }
};

/**
 * Persists an active dining session to both sessionStorage and localStorage.
 */
export const saveActiveDiningSession = (session: IDiningSession): void => {
  try {
    const serialized = JSON.stringify(session);
    sessionStorage.setItem(STORAGE_KEY, serialized);
    localStorage.setItem(STORAGE_KEY, serialized);
  } catch (err) {
    console.warn('[diningSession] Failed to persist session to storage:', err);
  }
};

/**
 * Clears the active dining session from storage.
 */
export const clearActiveDiningSession = (): void => {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.warn('[diningSession] Failed to clear session:', err);
  }
};

/**
 * Writes or updates the dining session in Firestore at restaurants/{tenantId}/diningSessions/{sessionId}
 */
export const syncDiningSessionToFirestore = async (session: IDiningSession): Promise<void> => {
  if (!session.tenantId && !session.restaurantId) return;
  const tenant = session.tenantId || session.restaurantId;

  try {
    const sessionRef = doc(db, 'restaurants', tenant, 'diningSessions', session.sessionId);
    await setDoc(sessionRef, {
      ...session,
      updatedAt: new Date().toISOString()
    }, { merge: true });
  } catch (err) {
    console.warn('[diningSession] Non-blocking Firestore sync warning:', err);
  }
};
