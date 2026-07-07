import { useRestaurant as useRestaurantFromContext } from '../services/RestaurantContext';

/**
 * Accesses active restaurant configurations, logos, currency, and subscriptions.
 */
export const useRestaurant = useRestaurantFromContext;
export default useRestaurant;
