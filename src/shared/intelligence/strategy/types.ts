export interface IBusinessGoal {
  id: string;
  type: 'revenue' | 'waste' | 'csat' | 'prep_time' | 'repeat_customers' | 'refunds' | 'turnover';
  targetValue: number;
  currentValue: number;
  unit: string;
  status: 'active' | 'achieved';
  createdAt: string;
}

export interface IStrategyActionPlan {
  id: string;
  category: 'revenue' | 'cost' | 'marketing' | 'retention' | 'risk' | 'seasonal' | 'weekly' | 'monthly';
  title: string;
  objective: string;
  reason: string;
  expectedBenefit: string;
  estimatedCost: number;
  priority: 'Critical' | 'High' | 'Medium' | 'Low';
  difficulty: 'Easy' | 'Medium' | 'Hard';
  timelineDays: number;
  expectedRoiPercent: number;
  status: 'recommended' | 'accepted' | 'in_progress' | 'completed' | 'rejected';
  createdAt: string;
}
