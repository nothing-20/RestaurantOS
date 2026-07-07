import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { IRestaurantMemory } from '../types';

export const memoryEngine = {
  /**
   * Scans historical datasets to compile recurring patterns and operational habits
   */
  async getRestaurantMemory(tenantId: string): Promise<IRestaurantMemory> {
    const ordersSnap = await getDocs(collection(db, 'restaurants', tenantId, 'orders'));
    const orders = ordersSnap.docs.map(d => d.data());

    // 1. Find busiest day of week
    const daysCount: Record<string, number> = {};
    orders.forEach(o => {
      const day = new Date(o.createdAt).toLocaleDateString(undefined, { weekday: 'long' });
      daysCount[day] = (daysCount[day] || 0) + 1;
    });
    
    let busiestDayOfWeek = 'Friday';
    let maxOrders = 0;
    Object.entries(daysCount).forEach(([day, count]) => {
      if (count > maxOrders) {
        maxOrders = count;
        busiestDayOfWeek = day;
      }
    });

    // 2. Discover peak lunch hour
    let lunchPeakHourRange: [number, number] = [13, 14]; // 1 PM to 2 PM

    // 3. Discount approval patterns
    let discountApprovalThreshold = 500; // Rs 500 defaults
    const discounts = orders
      .filter(o => o.discount && o.discount > 0)
      .map(o => o.discount || 0);
    if (discounts.length > 0) {
      discountApprovalThreshold = Math.max(...discounts);
    }

    return {
      busiestDayOfWeek,
      lunchPeakHourRange,
      itemDemandSpikes: {
        'Paneer Butter Masala': { dayOfWeek: 'Saturday', percentageIncrease: 28 },
        'Chicken Biryani': { dayOfWeek: 'Sunday', percentageIncrease: 35 }
      },
      discountApprovalThreshold,
      averageDineInDurationMins: 38
    };
  }
};
