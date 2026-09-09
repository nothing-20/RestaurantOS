import React, { createContext, useContext, useState, useEffect } from 'react';
import { ITenant } from '../types';
import { useAuth } from './AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { getCurrencySymbol } from '../utils/format';

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
        // Try tenants/{tenantId} first
        const tenantRef = doc(db, 'tenants', user.tenantId);
        const tenantSnap = await getDoc(tenantRef);

        if (tenantSnap.exists()) {
          setActiveRestaurant(tenantSnap.data() as ITenant);
          setError(null);
        } else {
          // Fallback to restaurants/{tenantId}
          const restRef = doc(db, 'restaurants', user.tenantId);
          const restSnap = await getDoc(restRef);
          if (restSnap.exists()) {
            setActiveRestaurant(restSnap.data() as ITenant);
            setError(null);
          } else {
            setActiveRestaurant(null);
            setError('Restaurant profile not found.');
          }
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

  const currencyCode = 
    activeRestaurant?.currency || 
    activeRestaurant?.currencyCode || 
    activeRestaurant?.settings?.currency;
  
  const currencySymbol = 
    activeRestaurant?.currencySymbol || 
    activeRestaurant?.settings?.currencySymbol || 
    getCurrencySymbol(currencyCode);

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
