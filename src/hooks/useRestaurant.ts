import { useRestaurant as useRestaurantFromContext } from '../context/RestaurantContext';

/**
 * Accesses active restaurant configurations, logos, currency, and subscriptions.
 */
export const useRestaurant = useRestaurantFromContext;
export default useRestaurant;
