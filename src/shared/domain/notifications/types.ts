export interface IServiceRequest {
  id: string;
  tableNumber: string;
  type: string; // e.g. 'Call Waiter', 'Water', 'Bill', etc.
  tenantId: string;
  createdAt: string;
}
