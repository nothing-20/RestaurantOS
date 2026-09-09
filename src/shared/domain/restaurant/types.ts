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

  // Discovery & Localization fields
  ownerUid?: string;
  tenantId?: string;
  restaurantName?: string;
  logo?: string;
  coverImage?: string;
  coverImageUrl?: string | null;
  phone?: string;
  cuisine?: string | string[];
  rating?: number;
  reviewCount?: number;
  description?: string;
  waitingTime?: string;
  country?: string;
  currency?: string;
  currencyCode?: string;
  currencySymbol?: string;
  locale?: string;
  settings?: {
    currency?: string;
    currencySymbol?: string;
    locale?: string;
    timezone?: string;
    taxPercent?: number;
    serviceCharge?: number;
    tableServiceEnabled?: boolean;
    qrOrderingEnabled?: boolean;
    language?: string;
  };
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
