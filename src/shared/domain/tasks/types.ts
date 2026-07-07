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
