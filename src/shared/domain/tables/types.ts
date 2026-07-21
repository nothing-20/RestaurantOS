export interface ITable {
  tableNumber: string;
  id: string;
  tenantId: string;
  number: string;
  seatingCapacity: number;
  status: 'empty' | 'occupied' | 'service_requested' | 'bill_requested' | 'cleaning';
  activeOrderId?: string;
  qrCodeUrl: string;
  capacity?: number;
  floor?: string;
  
  // Waiter assignments
  assignedWaiterId?: string;
  assignedWaiterName?: string;
  guestsCount?: number;
  currentOrderId?: string;
  section?: string;
  tableNotes?: string;
  seatingTime?: string;
}

