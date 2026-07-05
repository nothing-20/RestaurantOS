export type TUserRole = 'super-admin' | 'owner' | 'admin' | 'manager' | 'waiter' | 'kitchen' | 'cashier' | 'reception' | 'customer';

export interface IUser {
  uid: string;
  email: string;
  displayName: string;
  tenantId: string;
  role: TUserRole;
  status: 'active' | 'inactive';
  phoneNumber?: string;
  createdAt: string;
}

export interface ITenant {
  id: string;
  name: string;
  logoUrl: string;
  planTier: 'starter' | 'pro' | 'enterprise';
  status: 'active' | 'suspended' | 'trial';
  address: {
    street: string;
    city: string;
    zipCode: string;
  } | string;
  stripeCustomerId: string;
  stripeSubscriptionId: string;
  createdAt: string;
  updatedAt: string;

  // Discovery Redesign fields
  tenantId?: string;
  restaurantName?: string;
  logo?: string;
  coverImage?: string;
  phone?: string;
  cuisine?: string;
  rating?: number;
  description?: string;
  waitingTime?: string;
}

export interface IMenuCategory {
  id: string;
  name: string;
  description: string;
  displayOrder: number;
  isActive: boolean;
  image: string;
}

export interface IMenuItem {
  id: string;
  name: string;
  description: string;
  categoryId: string;
  category: string; // for backward compatibility
  price: number; // in cents
  discountPrice?: number; // in cents
  image: string;
  imageUrl: string; // for backward compatibility
  preparationTime: number; // in minutes
  isVeg: boolean;
  veg: boolean; // for backward compatibility
  isAvailable: boolean;
  available: boolean; // for backward compatibility
  isBestSeller: boolean;
  isRecommended: boolean;
  spiceLevel: string; // 'none' | 'mild' | 'medium' | 'hot'
  tags: string[];
  station?: string; // e.g. 'Grill', 'Pizza', 'Drinks', etc.
  createdAt: string;
  updatedAt: string;
}

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

export interface IInventoryItem {
  id: string;
  tenantId: string;
  name: string;
  stockLevel: number;
  unit: 'pieces' | 'kg' | 'liters' | 'grams';
  reorderThreshold: number;
  lastRestockedAt: string;
}

export interface IServiceRequest {
  id: string;
  tableNumber: string;
  type: string; // e.g. 'Call Waiter', 'Water', 'Bill', etc.
  tenantId: string;
  createdAt: string;
}

export interface IHandoverDoc {
  id?: string;
  handoverBy: string;
  handoverByName: string;
  handoverTo: string;
  handoverToName: string;
  handoverTime: string;
  handoverReason: string;
  status: 'Pending' | 'Accepted' | 'Rejected';
  tablesCount: number;
  ordersCount: number;
  requestsCount: number;
  tableIds: string[];
  orderIds: string[];
  requestIds: string[];
}

export interface ISatisfactionRating {
  rating: 'Excellent' | 'Good' | 'Neutral' | 'Needs Attention' | 'Complaint';
  serviceSpeed?: number; // 1-5
  foodQuality?: number; // 1-5
  cleanliness?: number; // 1-5
  staffBehavior?: number; // 1-5
  waitingTime?: number; // 1-5
  ambience?: number; // 1-5
  repeatCustomer: boolean;
  customerType?: string; // Solo, Couple, Family, Group
  visitOccasion?: string; // Casual, Birthday, Date, Celebration
  notes: string;
  submittedBy: string;
  submittedByName: string;
  submittedAt: string;
  orderId: string;
  tableNumber: string;
  tenantId: string;
  isPositive: boolean;
  isComplaint: boolean;
}

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

export interface IManagerReviewTask {
  id?: string;
  tenantId: string;
  customerIssue: string;
  priority: 'High' | 'Critical';
  assignedManager: string;
  resolutionStatus: 'Pending' | 'Resolved';
  resolutionNotes: string;
  ratingId?: string;
  submittedAt: string;
  orderId?: string;
  tableNumber?: string;
}
export interface IBill {
  id?: string;
  orderId: string;
  tenantId: string;
  tableNumber: string;
  waiterName?: string;
  waiterId?: string;
  invoiceNumber: string;
  items: IOrderItem[];
  subtotal: number;         // in cents
  discount: number;         // in cents
  discountType?: 'percentage' | 'fixed' | 'coupon' | 'manager' | 'staff';
  discountPercent?: number;
  discountLabel?: string;
  tax: number;              // in cents
  taxPercent: number;       // raw %
  serviceCharge: number;    // in cents
  serviceChargePercent: number;
  roundOff: number;         // in cents
  total: number;            // in cents (grand total)
  paymentStatus: TPaymentStatus;
  paymentMethods: IPaymentBreakdown;
  processedBy: string;
  processedByName: string;
  createdAt: string;
  paidAt?: string;
}

export interface IRefund {
  id?: string;
  tenantId: string;
  orderId: string;
  invoiceNumber: string;
  tableNumber: string;
  refundType: 'full' | 'partial' | 'void';
  refundAmount: number;     // in cents
  reason: string;
  approvedBy: string;
  approvedByName: string;
  refundedAt: string;
  paymentMethod: 'cash' | 'upi' | 'card' | 'wallet' | 'original';
}

export interface IShiftReport {
  id?: string;
  tenantId: string;
  openedBy: string;
  openedByName: string;
  openingCash: number;       // in cents
  openingTime: string;       // ISO
  closingTime?: string;      // ISO
  closedBy?: string;
  closedByName?: string;
  status: 'open' | 'closed';
  
  // Real-time collections accumulated throughout the day (in cents)
  cashSales: number;
  upiSales: number;
  cardSales: number;
  walletSales: number;
  totalRefunds: number;
  totalDiscounts: number;
  totalComplimentaryValue: number;
  
  expectedClosingCash: number;  // openingCash + cashSales - cashRefunds
  actualClosingCash?: number;   // manually entered
  difference?: number;          // actualClosingCash - expectedClosingCash
  operator: string;             // operator display name
  createdAt?: string;           // Fallback timestamp
}

