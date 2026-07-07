import { IMenuItem } from '../types';

export interface IRecommendationGroup {
  alsoOrdered: IMenuItem[];
  completeMeal: {
    bundleItems: IMenuItem[];
    discountAmount: number; // in cents
    originalTotal: number;  // in cents
    bundleTotal: number;    // in cents
  } | null;
}

/**
 * Static rule-based recommendation engine for RestaurantOS menu up-selling.
 * Analyzes the viewed item and queries the fetched menu catalog to resolve relations.
 */
export const recommendationEngine = {
  getRecommendations: (viewedItem: IMenuItem, allItems: IMenuItem[]): IRecommendationGroup => {
    if (!viewedItem || !allItems || allItems.length === 0) {
      return { alsoOrdered: [], completeMeal: null };
    }

    const category = (viewedItem.category || '').toLowerCase();
    const name = (viewedItem.name || '').toLowerCase();

    // Define rules mapping viewed items/categories to target recommendations
    let targetAlsoOrderedNames: string[] = [];
    let targetBundleNames: string[] = [];
    let discountAmount = 200; // default $2.00 discount (in cents)

    if (category.includes('pizza')) {
      targetAlsoOrderedNames = ['Garlic Bread', 'Coke'];
      targetBundleNames = ['Garlic Bread', 'Coke', 'Brownie'];
      discountAmount = 400; // $4.00
    } else if (category.includes('burger') || category.includes('burgers')) {
      targetAlsoOrderedNames = ['French Fries', 'Coke'];
      targetBundleNames = ['French Fries', 'Coke', 'Ice Cream'];
      discountAmount = 300; // $3.00
    } else if (name.includes('butter chicken') || category.includes('main course') || category.includes('mains')) {
      targetAlsoOrderedNames = ['Butter Naan', 'Jeera Rice', 'Coke'];
      targetBundleNames = ['Garlic Bread', 'Brownie']; // bundle items to supplement main course
      discountAmount = 450; // $4.50
    } else if (category.includes('starter') || category.includes('starters')) {
      targetAlsoOrderedNames = ['Chicken Wings', 'Coke'];
      targetBundleNames = ['Veg Fried Rice', 'Gulab Jamun'];
      discountAmount = 350; // $3.50
    } else {
      // Default fallback
      targetAlsoOrderedNames = ['Coke', 'French Fries'];
      targetBundleNames = ['Garlic Bread', 'Coke'];
      discountAmount = 200; // $2.00
    }

    // Resolve item references from allItems list, filter out the viewed item itself
    const resolveItems = (names: string[]): IMenuItem[] => {
      return allItems.filter(item => {
        if (item.id === viewedItem.id) return false;
        if (!item.available) return false; // only recommend in-stock items
        return names.some(n => item.name.toLowerCase().includes(n.toLowerCase()));
      });
    };

    const alsoOrdered = resolveItems(targetAlsoOrderedNames).slice(0, 3);
    const bundleItems = resolveItems(targetBundleNames).slice(0, 3);

    // Calculate bundle totals
    let completeMeal = null;
    if (bundleItems.length > 0) {
      const originalTotal = bundleItems.reduce((sum, item) => sum + (item.discountPrice || item.price), 0);
      const finalDiscount = Math.min(discountAmount, originalTotal - 100); // ensure price doesn't go below $1.00
      const bundleTotal = originalTotal - finalDiscount;

      completeMeal = {
        bundleItems,
        discountAmount: finalDiscount,
        originalTotal,
        bundleTotal,
      };
    }

    return {
      alsoOrdered,
      completeMeal,
    };
  }
};

export default recommendationEngine;
