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

export interface ICustomerProfile {
  uid: string;
  email: string;
  fullName?: string;
  displayName?: string;
  phoneNumber?: string;
  photoURL?: string | null;
  role: 'customer';
  status: 'active' | 'inactive';
  tenantId?: string | null;
  walletBalance?: number;
  loyaltyPoints?: number;
  dietaryPrefs?: string[];
  allergens?: string[];
  addresses?: any[];
  preferences?: Record<string, any>;
  createdAt: string;
  updatedAt?: string;
}

