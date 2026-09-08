export interface IServiceRequest {
  id: string;
  tableNumber: string;
  type: string; // e.g. 'Call Waiter', 'Water', 'Bill', etc.
  tenantId: string;
  createdAt: string;
}

export interface INotification {
  id: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  type?: string;
  tenantId?: string;
}
