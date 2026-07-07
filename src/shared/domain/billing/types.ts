import { IOrderItem, TPaymentStatus, IPaymentBreakdown } from '../orders/types';

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
