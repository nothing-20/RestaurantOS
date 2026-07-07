import { IRestaurantKnowledge } from '../types';

export const knowledgeEngine = {
  /**
   * Retrieves operating policies, recipe standards, tax rules, and waiter SOP guidelines
   */
  async getRestaurantKnowledge(tenantId: string): Promise<IRestaurantKnowledge> {
    return {
      recipes: {
        'item-butter-chicken': {
          menuItemName: 'Butter Chicken',
          ingredients: [
            { ingredientId: 'ING-CHICKEN', ingredientName: 'Raw Chicken Breast', quantity: 250, unit: 'g' },
            { ingredientId: 'ING-BUTTER', ingredientName: 'Butter Blocks', quantity: 30, unit: 'g' }
          ]
        },
        'item-biryani': {
          menuItemName: 'Hyderabadi Chicken Biryani',
          ingredients: [
            { ingredientId: 'ING-CHICKEN', ingredientName: 'Raw Chicken Breast', quantity: 200, unit: 'g' },
            { ingredientId: 'ING-RICE', ingredientName: 'Basmati Rice', quantity: 150, unit: 'g' }
          ]
        }
      },
      operatingPolicies: {
        targetPrepTimeMins: 12,
        targetServiceTimeMins: 5,
        gstTaxPercentage: 5,
        serviceChargePercentage: 5,
        targetCsatRating: 4.8,
        lunchPeakHourRange: [12, 15],
        dinnerPeakHourRange: [18, 22]
      }
    };
  }
};
