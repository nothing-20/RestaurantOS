export interface ITable {
  id: string;
  tenantId: string;
  number: string;
  seatingCapacity: number;
  status: 'empty' | 'occupied' | 'service_requested' | 'bill_requested' | 'cleaning';
  activeOrderId?: string;
  qrCodeUrl: string;
  
  // Waiter assignments
  assignedWaiterId?: string;
  assignedWaiterName?: string;
  guestsCount?: number;
  currentOrderId?: string;
  section?: string;
  tableNotes?: string;
}
