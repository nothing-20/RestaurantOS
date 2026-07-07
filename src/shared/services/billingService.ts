import { collection, doc, addDoc, updateDoc, query, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import { IOrder, IShiftReport } from '../domain/index';

export const billingService = {
  getOrders: async (tenantId: string) => {
    const colRef = collection(db, 'restaurants', tenantId, 'orders');
    const snap = await getDocs(colRef);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as IOrder));
  },
  getShifts: async (tenantId: string) => {
    const colRef = collection(db, 'restaurants', tenantId, 'shifts');
    const snap = await getDocs(query(colRef, orderBy('openedAt', 'desc')));
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as IShiftReport));
  },
  openShift: async (tenantId: string, shiftData: Omit<IShiftReport, 'id'>) => {
    const colRef = collection(db, 'restaurants', tenantId, 'shifts');
    return addDoc(colRef, shiftData);
  },
  updateShift: async (tenantId: string, shiftId: string, shiftData: Partial<IShiftReport>) => {
    const docRef = doc(db, 'restaurants', tenantId, 'shifts', shiftId);
    return updateDoc(docRef, shiftData);
  }
};
export default billingService;
