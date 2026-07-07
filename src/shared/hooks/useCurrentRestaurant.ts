import { useRestaurant } from '../services/RestaurantContext';

export function useCurrentRestaurant() {
  const { activeRestaurant, isLoadingRestaurant, error, currencySymbol } = useRestaurant();

  return {
    restaurant: activeRestaurant,
    isLoading: isLoadingRestaurant,
    error,
    currencySymbol,
  };
}
export default useCurrentRestaurant;
