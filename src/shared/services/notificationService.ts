import { notificationsService } from '../firebase/firestore';
import { INotification } from '../domain/notifications/types';

export const notificationService = {
  getNotifications: (tenantId?: string) => notificationsService.getAll(tenantId) as Promise<INotification[]>,
  createNotification: (data: Omit<INotification, 'id'>, tenantId?: string) => notificationsService.create(data, tenantId),
  markAsRead: (id: string, tenantId?: string) => notificationsService.update(id, { read: true }, tenantId),
  deleteNotification: (id: string, tenantId?: string) => notificationsService.delete(id, tenantId),
};
export default notificationService;
