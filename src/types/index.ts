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

export interface IMenuItem {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number; // in cents
  discountPrice?: number; // in cents
  imageUrl: string;
  veg: boolean;
  available: boolean;
  preparationTime: number; // in minutes
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface IOrderItem {
  itemId: string;
  name: string;
  count: number;
  notes: string;
  pricePerUnit: number; // in cents snapshotted at purchase
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
  status: 'PLACED' | 'ACCEPTED' | 'PREPARING' | 'READY' | 'DELIVERED' | 'CANCELLED';
  createdAt: string;
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
