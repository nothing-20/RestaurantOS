import { collection, doc, addDoc, updateDoc, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import { IManagerReviewTask } from '../domain/tasks/types';

export const taskService = {
  getTasks: async (tenantId: string) => {
    const colRef = collection(db, 'restaurants', tenantId, 'tasks');
    const snap = await getDocs(colRef);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as IManagerReviewTask));
  },
  createTask: async (tenantId: string, taskData: Omit<IManagerReviewTask, 'id'>) => {
    const colRef = collection(db, 'restaurants', tenantId, 'tasks');
    return addDoc(colRef, taskData);
  },
  updateTask: async (tenantId: string, taskId: string, taskData: Partial<IManagerReviewTask>) => {
    const docRef = doc(db, 'restaurants', tenantId, 'tasks', taskId);
    return updateDoc(docRef, taskData);
  }
};
export default taskService;
