import { logEvent } from './eventEngine';
import { auditLogsService } from '../firebase/firestore';
import { IRestaurantEvent } from '../domain/events/types';

export const eventService = {
  logEvent,
  getEvents: (tenantId?: string) => auditLogsService.getAll(tenantId) as Promise<IRestaurantEvent[]>,
};
export default eventService;
