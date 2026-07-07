import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { IRestaurantContext } from '../types';

export const contextBuilder = {
  /**
   * Consolidates real-time and historical parameters into a single unified context state
   */
  async buildRestaurantContext(tenantId: string): Promise<IRestaurantContext> {
    const todayStr = new Date().toDateString();

    // 1. Fetch Orders
    const ordersSnap = await getDocs(collection(db, 'restaurants', tenantId, 'orders'));
    const completedToday = ordersSnap.docs
      .map(d => d.data())
      .filter(o => {
        const isCompleted = o.status === 'COMPLETED' || o.status === 'DELIVERED';
        const isToday = new Date(o.createdAt).toDateString() === todayStr;
        return isCompleted && isToday;
      });

    const revenueToday = completedToday.reduce((sum, o) => sum + (o.total || 0), 0);
    const ordersTodayCount = completedToday.length;
    const avgOrderValue = ordersTodayCount > 0 ? revenueToday / ordersTodayCount : 0;

    // Kitchen preparation times
    let totalPrepTime = 0;
    let prepCount = 0;
    completedToday.forEach(o => {
      if (o.createdAt && o.updatedAt) {
        const diff = (new Date(o.updatedAt).getTime() - new Date(o.createdAt).getTime()) / 60000;
        if (diff > 0 && diff < 180) {
          totalPrepTime += diff;
          prepCount++;
        }
      }
    });
    const avgPrepTimeMins = prepCount > 0 ? Math.round(totalPrepTime / prepCount) : 12;

    // 2. Fetch CSAT Ratings
    const ratingsSnap = await getDocs(collection(db, 'restaurants', tenantId, 'satisfactionRatings'));
    const ratingsList = ratingsSnap.docs.map(d => d.data());
    const avgCsatRating = ratingsList.length > 0
      ? ratingsList.reduce((sum, r) => {
          let score = 5;
          if (r.rating === 'Good') score = 4;
          if (r.rating === 'Neutral') score = 3;
          if (r.rating === 'Needs Attention') score = 2;
          if (r.rating === 'Complaint') score = 1;
          return sum + score;
        }, 0) / ratingsList.length
      : 4.8;

    // 3. Fetch Seating diners
    const activeDinersCount = ordersSnap.docs
      .map(d => d.data())
      .filter(o => o.status !== 'COMPLETED' && o.status !== 'CANCELLED' && o.status !== 'DELIVERED').length;

    // 4. Fetch Low stock ingredients
    const invSnap = await getDocs(collection(db, 'restaurants', tenantId, 'inventory'));
    const lowStockItemsCount = invSnap.docs
      .map(d => d.data())
      .filter(i => i.status === 'low' || i.status === 'critical' || i.status === 'out_of_stock').length;

    // 5. Fetch Waste Costs
    const wasteSnap = await getDocs(collection(db, 'restaurants', tenantId, 'waste'));
    const totalWasteCost = wasteSnap.docs
      .map(d => d.data())
      .reduce((sum, w) => sum + (w.valueLost || 0), 0);

    return {
      tenantId,
      timestamp: new Date().toISOString(),
      revenueToday,
      ordersTodayCount,
      avgOrderValue,
      avgPrepTimeMins,
      avgCsatRating,
      activeDinersCount,
      lowStockItemsCount,
      totalWasteCost
    };
  }
};
