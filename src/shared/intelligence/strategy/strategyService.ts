import { collection, getDocs, doc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { logEvent } from '../../services/eventEngine';
import { formatPrice } from '../../utils/format';
import { IBusinessGoal, IStrategyActionPlan } from './types';
import { IRestaurantContext } from '../types';

export const strategyService = {
  /**
   * Evaluates active goal progress metrics, updating status & dispatching event logs
   */
  async evaluateGoalProgress(tenantId: string, goal: IBusinessGoal, context: IRestaurantContext): Promise<IBusinessGoal> {
    let currentValue = goal.currentValue;

    switch (goal.type) {
      case 'revenue':
        currentValue = context.revenueToday;
        break;
      case 'waste':
        currentValue = context.totalWasteCost;
        break;
      case 'csat':
        currentValue = context.avgCsatRating;
        break;
      case 'prep_time':
        currentValue = context.avgPrepTimeMins;
        break;
      default:
        break;
    }

    let achieved = false;
    if (goal.type === 'revenue' || goal.type === 'csat' || goal.type === 'repeat_customers' || goal.type === 'turnover') {
      achieved = currentValue >= goal.targetValue;
    } else {
      // Lower is better for prep_time, waste, refunds
      achieved = currentValue <= goal.targetValue;
    }

    const updatedGoal: IBusinessGoal = {
      ...goal,
      currentValue,
      status: achieved ? 'achieved' : 'active'
    };

    const goalRef = doc(db, 'restaurants', tenantId, 'businessGoals', goal.id);
    await setDoc(goalRef, updatedGoal);

    if (achieved && goal.status === 'active') {
      await logEvent(tenantId, {
        type: 'Goal Achieved',
        description: `Operational goal achieved: Target of ${goal.targetValue} reached with ${currentValue.toFixed(1)} ${goal.unit}.`,
        severity: 'info',
        metadata: { goalId: goal.id, type: goal.type }
      });
    }

    return updatedGoal;
  },

  /**
   * Compiles business consultant strategies matrices
   */
  async generateStrategies(tenantId: string, context: IRestaurantContext, memory: any): Promise<IStrategyActionPlan[]> {
    const list: IStrategyActionPlan[] = [];
    const nowStr = new Date().toISOString();

    // 1. Revenue Strategy: Lunch Combo Special
    const lunchCost = 5000; // $50
    const lunchBenefit = 12000; // $120
    const lunchRoi = Math.round(((lunchBenefit - lunchCost) / lunchCost) * 100);
    list.push({
      id: 'strat-lunch-combo',
      category: 'revenue',
      title: 'Dine-In Lunch Combo Deal Special',
      objective: 'Stimulate check size totals during slow weekday lunch slots.',
      reason: `Historical memory shows peak lunch hours cluster around ${memory.lunchPeakHourRange[0]} PM - ${memory.lunchPeakHourRange[1]} PM. Paneer sales are currently up 28%.`,
      expectedBenefit: 'Increase daily completed check averages by 15%.',
      estimatedCost: lunchCost,
      priority: 'High',
      difficulty: 'Easy',
      timelineDays: 7,
      expectedRoiPercent: lunchRoi,
      status: 'recommended',
      createdAt: nowStr
    });

    // 2. Cost Strategy: Chef Spoilage Training
    const wasteCost = 10000; // $100
    const wasteBenefit = 28000; // $280
    const wasteRoi = Math.round(((wasteBenefit - wasteCost) / wasteCost) * 100);
    list.push({
      id: 'strat-chef-training',
      category: 'cost',
      title: 'Kitchen Spoilage SOP Audit & Training',
      objective: 'Reduce total monthly ingredient waste lost values.',
      reason: `Gross recorded waste cost is currently at ${formatPrice(context.totalWasteCost)}. Raw items expiries count is up.`,
      expectedBenefit: 'Reduce logged spoilage waste cost by 25%.',
      estimatedCost: wasteCost,
      priority: 'High',
      difficulty: 'Medium',
      timelineDays: 14,
      expectedRoiPercent: wasteRoi,
      status: 'recommended',
      createdAt: nowStr
    });

    // 3. Marketing Strategy: Busiest Weekend Campaign
    const mktCost = 15000; // $150
    const mktBenefit = 45000; // $450
    const mktRoi = Math.round(((mktBenefit - mktCost) / mktCost) * 100);
    list.push({
      id: 'strat-weekend-promo',
      category: 'marketing',
      title: 'Weekend Biryani Festival Campaign',
      objective: 'Maximize table occupancies during peak weekend shifts.',
      reason: `Historical memory flags ${memory.busiestDayOfWeek} as the busiest shift, with Chicken Biryani demand spiking by 35% on Sundays.`,
      expectedBenefit: 'Drive an extra 25 Completed Orders per weekend.',
      estimatedCost: mktCost,
      priority: 'High',
      difficulty: 'Medium',
      timelineDays: 10,
      expectedRoiPercent: mktRoi,
      status: 'recommended',
      createdAt: nowStr
    });

    // 4. Retention Strategy: Feedback Recovery Program
    const retCost = 3000; // $30
    const retBenefit = 9000; // $90
    const retRoi = Math.round(((retBenefit - retCost) / retCost) * 100);
    list.push({
      id: 'strat-retention-recovery',
      category: 'retention',
      title: 'Disappointed Diner Recovery outreach',
      objective: 'Boost repeat customer rates and CSAT average stars.',
      reason: `Average customer feedback rating is at ${context.avgCsatRating.toFixed(1)} stars. Negative CSAT ratings logs triggers manager followups.`,
      expectedBenefit: 'Recover 30% of dissatisfied clients into repeat dinners.',
      estimatedCost: retCost,
      priority: 'Medium',
      difficulty: 'Easy',
      timelineDays: 5,
      expectedRoiPercent: retRoi,
      status: 'recommended',
      createdAt: nowStr
    });

    return list;
  }
};
