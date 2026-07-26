import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  onSnapshot,
  QueryConstraint
} from 'firebase/firestore';
import { db } from './config';

export interface IServiceMetadata {
  tenantId?: string;
  branchId?: string;
  createdBy?: string;
}

export function removeUndefined(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  if (obj instanceof Date) return obj;
  if (Array.isArray(obj)) {
    return obj.map(removeUndefined);
  }
  if (typeof obj === 'object') {
    const proto = Object.getPrototypeOf(obj);
    const isPlain = proto === null || proto === Object.prototype;
    if (!isPlain) {
      return obj;
    }
    const result: any = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) {
        result[key] = removeUndefined(value);
      }
    }
    return result;
  }
  return obj;
}

export const cleanObject = removeUndefined;
export const sanitizePayload = removeUndefined;

export class FirestoreService<T extends Record<string, any>> {
  private collectionName: string;

  constructor(collectionName: string) {
    this.collectionName = collectionName;
  }

  // Get collection reference dynamically (handles subcollections too)
  private getRef(tenantId?: string) {
    const parts = this.collectionName.split('/').filter(Boolean);
    if (tenantId && this.isTenantSubcollection()) {
      return collection(db, 'restaurants', tenantId, ...parts);
    }
    return collection(db, parts[0], ...parts.slice(1));
  }

  private isTenantSubcollection(): boolean {
    const rootCollections = ['tenants', 'users', 'supportTickets', 'featureFlags', 'systemSettings', 'auditLogs'];
    return !rootCollections.includes(this.collectionName.split('/')[0]);
  }

  // CREATE
  async create(data: Omit<T, 'id'> & { id?: string }, metadata?: IServiceMetadata | string): Promise<string> {
    console.log('[FirestoreService] create entered. data:', data, 'metadata:', metadata);
    const metaObj = typeof metadata === 'string' ? { tenantId: metadata } : (metadata || {});
    const tenantId = metaObj.tenantId || (data as any).tenantId;
    const colRef = this.getRef(tenantId);
    const id = data.id || doc(colRef).id;
    const docRef = doc(colRef, id);

    const payload = {
      ...data,
      id,
      tenantId: tenantId || '',
      branchId: metaObj.branchId || (data as any).branchId || 'main',
      createdBy: metaObj.createdBy || (data as any).createdBy || 'system',
      createdAt: (data as any).createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const sanitizedPayload = removeUndefined(payload);
    console.log("FINAL PAYLOAD", JSON.stringify(sanitizedPayload, null, 2));
    try {
      await setDoc(docRef, sanitizedPayload);
      console.log('[FirestoreService] setDoc Success. id:', id);
      return id;
    } catch (error) {
      console.error('[FirestoreService] setDoc Failed error:', error);
      throw error;
    }
  }

  // UPDATE
  async update(id: string, data: Partial<T>, metadata?: IServiceMetadata | string): Promise<void> {
    console.log('[FirestoreService] update entered. id:', id, 'data:', data, 'metadata:', metadata);
    const metaObj = typeof metadata === 'string' ? { tenantId: metadata } : (metadata || {});
    const tenantId = metaObj.tenantId || (data as any).tenantId;
    const colRef = this.getRef(tenantId);
    const docRef = doc(colRef, id);

    const payload = {
      ...data,
      updatedAt: new Date().toISOString(),
    };

    const sanitizedPayload = removeUndefined(payload);
    console.log("FINAL PAYLOAD", JSON.stringify(sanitizedPayload, null, 2));
    try {
      await updateDoc(docRef, sanitizedPayload);
      console.log('[FirestoreService] updateDoc Success.');
    } catch (error) {
      console.error('[FirestoreService] updateDoc Failed error:', error);
      throw error;
    }
  }

  // DELETE
  async delete(id: string, tenantId?: string): Promise<void> {
    console.log('[FirestoreService] delete entered. id:', id, 'tenantId:', tenantId);
    const colRef = this.getRef(tenantId);
    const docRef = doc(colRef, id);
    console.log('[FirestoreService] Calling Firestore deleteDoc at:', docRef.path);
    try {
      await deleteDoc(docRef);
      console.log('[FirestoreService] deleteDoc Success.');
    } catch (error) {
      console.error('[FirestoreService] deleteDoc Failed error:', error);
      throw error;
    }
  }

  // GET BY ID
  async getById(id: string, tenantId?: string): Promise<T | null> {
    const colRef = this.getRef(tenantId);
    const docRef = doc(colRef, id);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() } as T;
  }

  // GET ALL
  async getAll(tenantId?: string): Promise<T[]> {
    const colRef = this.getRef(tenantId);
    let q = query(colRef);
    
    // Automatically filter root-level collections by tenantId if applicable
    if (tenantId && !this.isTenantSubcollection()) {
      q = query(colRef, where('tenantId', '==', tenantId));
    }

    const snap = await getDocs(q);
    const list: T[] = [];
    snap.forEach((d) => {
      list.push({ id: d.id, ...d.data() } as T);
    });
    return list;
  }

  // CUSTOM QUERY
  async query(constraints: QueryConstraint[], tenantId?: string): Promise<T[]> {
    const colRef = this.getRef(tenantId);
    const q = query(colRef, ...constraints);
    const snap = await getDocs(q);
    const list: T[] = [];
    snap.forEach((d) => {
      list.push({ id: d.id, ...d.data() } as T);
    });
    return list;
  }

  // LISTEN (Real-time snapshots)
  listen(callback: (items: T[]) => void, tenantId?: string, constraints: QueryConstraint[] = []) {
    const colRef = this.getRef(tenantId);
    let q = query(colRef, ...constraints);

    if (tenantId && !this.isTenantSubcollection()) {
      q = query(colRef, where('tenantId', '==', tenantId), ...constraints);
    }

    return onSnapshot(q, (snap) => {
      const list: T[] = [];
      snap.forEach((d) => {
        list.push({ id: d.id, ...d.data() } as T);
      });
      callback(list);
    });
  }
}

// Generate singletons for each requested repository
export const restaurantsService = new FirestoreService('restaurants');
export const branchesService = new FirestoreService('branches');
export const usersService = new FirestoreService('users');
export const employeesService = new FirestoreService('employees');
export const rolesService = new FirestoreService('roles');
export const permissionsService = new FirestoreService('permissions');
export const tablesService = new FirestoreService('tables');
export const menuCategoriesService = new FirestoreService('menu/default/categories');
export const menuItemsService = new FirestoreService('menu/default/items');
export const menuVariantsService = new FirestoreService('menu/default/variants');
export const menuAddonsService = new FirestoreService('menu/default/addons');
export const menuCombosService = new FirestoreService('menu/default/combos');
export const ordersService = new FirestoreService('orders');
export const kitchenTicketsService = new FirestoreService('kitchenTickets');
export const inventoryService = new FirestoreService('inventory');
export const suppliersService = new FirestoreService('suppliers');
export const notificationsService = new FirestoreService('notifications');
export const subscriptionsService = new FirestoreService('subscriptions');
export const analyticsService = new FirestoreService('analytics');
export const auditLogsService = new FirestoreService('auditLogs');
