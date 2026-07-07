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

export interface IInventoryItem {
  id: string;
  tenantId: string;
  name: string;
  stockLevel: number;
  unit: 'pieces' | 'kg' | 'liters' | 'grams';
  reorderThreshold: number;
  lastRestockedAt: string;
}
