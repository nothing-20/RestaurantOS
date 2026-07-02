import React, { createContext, useContext, useState, useEffect } from 'react';
import { ITenant } from '../types';
import { useAuth } from './AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

interface IRestaurantContextType {
  activeRestaurant: ITenant | null;
  isLoadingRestaurant: boolean;
  error: string | null;
  currencySymbol: string;
}

const RestaurantContext = createContext<IRestaurantContextType | undefined>(undefined);

export const RestaurantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [activeRestaurant, setActiveRestaurant] = useState<ITenant | null>(null);
  const [isLoadingRestaurant, setIsLoadingRestaurant] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // If not authenticated or tenantId is empty, clear active restaurant data
    if (!user || !user.tenantId) {
      setActiveRestaurant(null);
      setError(null);
      return;
    }

    setIsLoadingRestaurant(true);
    const fetchRestaurant = async () => {
      try {
        const docRef = doc(db, 'tenants', user.tenantId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setActiveRestaurant(docSnap.data() as ITenant);
          setError(null);
        } else {
          // If Firestore call fails (e.g. offline or no database records yet), supply fallback data
          setActiveRestaurant({
            id: user.tenantId,
            name: user.tenantId.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
            logoUrl: '',
            planTier: 'pro',
            status: 'active',
            address: {
              street: '123 Gourmet Ave',
              city: 'Gastronomy City',
              zipCode: '10001'
            },
            stripeCustomerId: 'cus_dummy',
            stripeSubscriptionId: 'sub_dummy',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
        }
      } catch (err: any) {
        console.error('Failed to load restaurant profile context', err);
        setError(err.message || 'Failed to fetch restaurant context.');
      } finally {
        setIsLoadingRestaurant(false);
      }
    };

    fetchRestaurant();
  }, [user]);

  const currencySymbol = activeRestaurant?.planTier === 'enterprise' ? '£' : '$';

  return (
    <RestaurantContext.Provider value={{ activeRestaurant, isLoadingRestaurant, error, currencySymbol }}>
      {children}
    </RestaurantContext.Provider>
  );
};

export const useRestaurant = () => {
  const context = useContext(RestaurantContext);
  if (!context) {
    throw new Error('useRestaurant must be used within a RestaurantProvider');
  }
  return context;
};
export default RestaurantContext;
