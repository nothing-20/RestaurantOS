import { ordersService, kitchenTicketsService } from '../firebase/firestore';
import { IOrder } from '../domain/orders/types';

export const orderService = {
  getOrders: (tenantId?: string) => ordersService.getAll(tenantId) as Promise<IOrder[]>,
  getOrder: (id: string, tenantId?: string) => ordersService.getById(id, tenantId) as Promise<IOrder | null>,
  createOrder: (data: Omit<IOrder, 'id'> & { tenantId?: string }, tenantId?: string) =>
    ordersService.create(data, { tenantId: tenantId || data.tenantId }),
  updateOrder: (id: string, data: Partial<IOrder> & { tenantId?: string }, tenantId?: string) =>
    ordersService.update(id, data, { tenantId: tenantId || data.tenantId }),
  deleteOrder: (id: string, tenantId?: string) => ordersService.delete(id, tenantId),

  getKitchenTickets: (tenantId?: string) => kitchenTicketsService.getAll(tenantId),
  updateKitchenTicket: (id: string, data: any, tenantId?: string) => kitchenTicketsService.update(id, data, tenantId),
};
export default orderService;
