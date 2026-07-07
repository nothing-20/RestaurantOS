export interface IRestaurantEvent {
  eventId?: string;
  eventType: string;
  eventCategory: 'Operational' | 'Kitchen' | 'Waiter' | 'Billing' | 'Payment' | 'Customer' | 'Cleaning' | 'Management' | 'System';
  tenantId: string;
  branchId?: string;
  tableId?: string;
  tableNumber?: string;
  orderId?: string;
  taskId?: string;
  performedBy: string;
  performedByRole: string;
  timestamp: string;
  title: string;
  description: string;
  metadata?: Record<string, any>;
}
