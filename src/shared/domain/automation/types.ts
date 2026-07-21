export interface IAutomationJob {
  id: string;
  name: string;
  frequency: 'hourly' | 'daily' | 'weekly' | 'monthly';
  lastRun?: string;
  nextRun?: string;
  enabled: boolean;
}

export interface IAutomationJobHistory {
  id: string;
  jobId: string;
  name: string;
  status: 'running' | 'completed' | 'failed' | 'skipped';
  startedAt: string;
  completedAt?: string;
  durationMs?: number;
  result?: string;
  errorMessage?: string;
}

export interface IAutomationSchedule {
  id: string;
  name: string;
  enabled: boolean;
  intervalMinutes: number;
  intervalType: 'minutes' | 'daily' | 'weekly' | 'monthly';
  desc: string;
  lastExecutionTime: string | null;
  nextExecutionTime: string | null;
  executionStatus: 'idle' | 'running' | 'success' | 'failed' | 'skipped';
  manualRunCapability: boolean;
}

export interface IAutomationRule {
  id: string;
  name: string;
  description: string;
  trigger: string;
  condition: string;
  action: string;
  enabled: boolean;
  category: 'inventory' | 'kitchen' | 'billing' | 'customer' | 'system';
}

export interface IAutomationAlert {
  id: string;
  title: string;
  description: string;
  type: 'Inventory' | 'Kitchen' | 'Billing' | 'Dining' | 'Staff' | 'Business' | 'System';
  priority: 'Critical' | 'High' | 'Medium' | 'Low';
  source: string; // e.g. "rules-engine", "kds", "billing"
  acknowledged: boolean;
  resolved: boolean;
  createdAt: string;
  resolvedAt?: string;
}

export interface IDailyBrief {
  id: string; // YYYY-MM-DD
  date: string;
  revenue: number;
  ordersCount: number;
  avgBillValue: number;
  topSellingItems: { name: string; count: number }[];
  lowestStockItems: { name: string; current: number; unit: string }[];
  wasteCost: number;
  avgKitchenPrepMins: number;
  avgCsatRating: number;
  businessHealthScore: number;
  criticalAlertsCount: number;
  topRecommendations: string[];
  createdAt: string;
}

export interface IAutomationLog {
  id: string;
  ruleId?: string;
  ruleName?: string;
  trigger: string;
  executionTime: string;
  durationMs: number;
  result: 'success' | 'failed';
  error?: string;
  relatedModule: string;
}
