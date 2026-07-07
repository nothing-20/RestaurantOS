export interface IRestaurantContext {
  tenantId: string;
  timestamp: string;
  revenueToday: number;
  ordersTodayCount: number;
  avgOrderValue: number;
  avgPrepTimeMins: number;
  avgCsatRating: number;
  activeDinersCount: number;
  lowStockItemsCount: number;
  totalWasteCost: number;
}

export interface IRecipeIngredient {
  ingredientId: string;
  ingredientName: string;
  quantity: number;
  unit: string;
}

export interface IRestaurantKnowledge {
  recipes: Record<string, { menuItemName: string; ingredients: IRecipeIngredient[] }>;
  operatingPolicies: {
    targetPrepTimeMins: number;
    targetServiceTimeMins: number;
    gstTaxPercentage: number;
    serviceChargePercentage: number;
    targetCsatRating: number;
    lunchPeakHourRange: [number, number];
    dinnerPeakHourRange: [number, number];
  };
}

export interface IRestaurantMemory {
  busiestDayOfWeek: string;
  lunchPeakHourRange: [number, number];
  itemDemandSpikes: Record<string, { dayOfWeek: string; percentageIncrease: number }>;
  discountApprovalThreshold: number;
  averageDineInDurationMins: number;
}

export interface IIntelligenceInsight {
  id: string;
  type: 'success' | 'warning' | 'info';
  title: string;
  text: string;
  impactPercent?: number;
  relatedModule: string;
  createdAt: string;
}

export interface IIntelligenceRecommendation {
  id: string;
  title: string;
  action: string;
  reason: string;
  impact: string;
  category: 'inventory' | 'kitchen' | 'staff' | 'marketing' | 'financial';
  createdAt: string;
}

export interface IIntelligencePrediction {
  target: string;
  predictedValue: string;
  confidence: number; // 0-100
  reasoning: string;
}

export interface IIntelligenceDecision {
  id: string;
  triggerEvent: string;
  suggestedAction: string;
  status: 'suggested' | 'approved' | 'rejected' | 'executed';
  createdAt: string;
}

export interface IIntelligenceTimelineItem {
  id: string;
  type: 'insight' | 'recommendation' | 'prediction' | 'action_taken';
  title: string;
  description: string;
  timestamp: string;
}


export interface IAIProvider {
  name: string;
  generateResponse(prompt: string, context: IRestaurantContext): Promise<{
    text: string;
    modelUsed: string;
    latencyMs: number;
  }>;
}
