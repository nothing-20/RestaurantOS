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
