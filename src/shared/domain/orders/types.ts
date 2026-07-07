export interface IOrderItem {
  itemId: string;
  name: string;
  count: number;
  notes: string;
  pricePerUnit: number; // in cents snapshotted at purchase
  
  // Complimentary items fields
  isComplimentary?: boolean;
  complimentaryReason?: string;
  complimentaryApprovedBy?: string;
  complimentaryApprovedByName?: string;
  complimentaryAt?: string;
}

export interface ITimelineEvent {
  type: 'ORDER_CREATED' | 'ACCEPTED' | 'PREPARING' | 'READY' | 'DELIVERED' | 'COMPLETED' | 'ARCHIVED' | 'CANCELLED' | 'PAUSED' | 'RESUMED' | 'RECALLED';
  title: string;
  description?: string;
  performedBy?: string;
  timestamp: string; // ISO string
}

export type TPaymentStatus = 'pending' | 'partially_paid' | 'paid' | 'refunded' | 'cancelled';

export interface IPaymentBreakdown {
  cash: number;   // in cents
  upi: number;    // in cents
  card: number;   // in cents
  wallet: number; // in cents
}

export interface IOrder {
  orderId: string;
  tableNumber: string;
  customerName: string;
  phone: string;
  items: IOrderItem[];
  subtotal: number; // in cents
  tax: number; // in cents
  total: number; // in cents
  status: 'NEW' | 'PLACED' | 'ACCEPTED' | 'PREPARING' | 'READY' | 'DELIVERED' | 'CANCELLED' | 'COMPLETED' | 'ARCHIVED' | 'PAUSED';
  createdAt: string;
  updatedAt?: string;
  timeline?: ITimelineEvent[];
  
  // Chef Assignment
  assignedChefId?: string;
  assignedChefName?: string;
  assignedAt?: string;
  assignedBy?: string;

  // Pause / Resume
  pauseReason?: string;
  pausedAt?: string;
  resumedAt?: string;
  pausedBy?: string;

  // Recall Ready
  recallReason?: string;
  recalledAt?: string;
  recalledBy?: string;

  // Kitchen Notes
  customerNotes?: string;
  kitchenNotes?: string;
  chefNotes?: string;

  // Queue and priority
  queueOrder?: number;
  priorityOverride?: boolean;
  priority?: 'critical' | 'high' | 'normal' | 'low';

  // Delivery details
  deliveryAcceptedAt?: string;
  deliveredAt?: string;
  deliveryDurationSeconds?: number;
  waiterId?: string;
  waiterName?: string;

  // ── Billing & POS fields ──────────────────────────────────────────────────
  paymentStatus?: TPaymentStatus;
  paymentMethods?: IPaymentBreakdown;
  invoiceNumber?: string;         // e.g. INV-20260705-0001
  discount?: number;              // in cents — flat discount after percentage calc
  discountType?: 'percentage' | 'fixed' | 'coupon' | 'manager' | 'staff';
  discountPercent?: number;       // raw % entered (0-100)
  discountLabel?: string;         // e.g. 'Staff 10%', 'Coupon SAVE20'
  serviceCharge?: number;         // in cents
  serviceChargePercent?: number;  // raw % (e.g. 5)
  roundOff?: number;              // in cents — can be negative
  billRequestedAt?: string;       // ISO — when waiter clicked Request Bill
  billOpenedAt?: string;          // ISO — when owner opened the bill
  paidAt?: string;                // ISO — when payment was completed
  processedBy?: string;           // uid of owner/cashier who processed payment
  processedByName?: string;       // display name

  // Hold & Resume
  isHeld?: boolean;
  holdReason?: string;
  heldAt?: string;
  resumedAt?: string;

  // Invoice Reprint Log
  reprintCount?: number;
  reprintsLog?: Array<{
    reprintedBy: string;
    reprintedByName: string;
    timestamp: string;
    reason?: string;
  }>;
}

// ── KDS / Kitchen Specific Types ─────────────────────────────────────────────

export type TKdsTab = 'table' | 'category' | 'station' | 'item-queue' | 'queue';

export type TOrderStatus =
  | 'NEW' | 'PLACED' | 'ACCEPTED' | 'PREPARING' | 'PAUSED'
  | 'READY' | 'DELIVERED' | 'COMPLETED' | 'ARCHIVED' | 'CANCELLED';

export type TPriority = 'critical' | 'high' | 'normal' | 'low';

export interface IKdsOrder extends IOrder {
  id?: string;
  tableId?: string;
  notes?: string;
  estimatedPrepTime?: number;
}

export interface IKdsMetrics {
  activeOrders: number;
  preparingOrders: number;
  readyOrders: number;
  avgPrepTimeMinutes: number;
  delayedOrders: number;
  completedToday: number;
  kitchenEfficiencyPct: number;
  peakQueueToday: number;
  longestWaitingOrderId: string | null;
  longestWaitingMinutes: number;
  fastestCompletedMinutes: number;
  ordersOver15Min: number;
  bottleneckStation: string | null;
  avgTicketTimeMinutes: number;
}

export interface IBulkConfirmDialog {
  isOpen: boolean;
  action: string;
  nextStatus: TOrderStatus;
  count: number;
}
