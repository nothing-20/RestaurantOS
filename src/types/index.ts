export type TUserRole = 'super-admin' | 'owner' | 'admin' | 'waiter' | 'kitchen' | 'customer';

export interface IUser {
  uid: string;
  email: string;
  displayName: string;
  tenantId: string;
  role: TUserRole;
  status: 'active' | 'inactive';
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
  };
  stripeCustomerId: string;
  stripeSubscriptionId: string;
  createdAt: string;
  updatedAt: string;
}

export interface IMenu {
  id: string;
  tenantId: string;
  name: string;
  isActive: boolean;
  createdAt: string;
}

export interface ICategory {
  id: string;
  name: string;
  orderIndex: number;
  isActive: boolean;
}

export interface ISelectedChoice {
  optionName: string;
  choiceName: string;
  priceModifier: number; // in cents
}

export interface IOrderItem {
  itemId: string;
  name: string;
  count: number;
  notes: string;
  selectedChoices: ISelectedChoice[];
  pricePerUnit: number; // in cents
}

export interface IOrder {
  id: string;
  tenantId: string;
  tableId: string;
  customerId?: string;
  waiterId?: string;
  items: IOrderItem[];
  subtotal: number; // in cents
  tax: number; // in cents
  total: number; // in cents
  status: 'placed' | 'preparing' | 'ready' | 'served' | 'cancelled';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  paymentMethod: 'stripe' | 'cash' | 'card_terminal';
  createdAt: string;
  updatedAt: string;
}

export interface ITable {
  id: string;
  tenantId: string;
  number: string;
  seatingCapacity: number;
  status: 'empty' | 'occupied' | 'service_requested' | 'bill_requested';
  activeOrderId?: string;
  qrCodeUrl: string;
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
