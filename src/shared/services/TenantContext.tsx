import React, { createContext, useContext, useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { ITenant } from '../types';

interface ITenantContextType {
  tenant: ITenant | null;
  isLoadingTenant: boolean;
  error: string | null;
}

const TenantContext = createContext<ITenantContextType | undefined>(undefined);

export const TenantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { tenantId } = useParams<{ tenantId?: string }>();
  const [tenant, setTenant] = useState<ITenant | null>(null);
  const [isLoadingTenant, setIsLoadingTenant] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!tenantId) {
      setTenant(null);
      setError(null);
      return;
    }

    setIsLoadingTenant(true);
    // Simulate API fetch for the tenant slug configuration
    setTimeout(() => {
      if (tenantId === 'invalid-restaurant') {
        setError('Restaurant workspace not found or suspended.');
        setTenant(null);
      } else {
        setTenant({
          id: tenantId,
          name: tenantId.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
          logoUrl: '',
          planTier: 'pro',
          status: 'active',
          address: {
            street: '123 Gourmet Way',
            city: 'Gastronomy City',
            zipCode: '90210'
          },
          stripeCustomerId: 'cus_mock123',
          stripeSubscriptionId: 'sub_mock123',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
        setError(null);
      }
      setIsLoadingTenant(false);
    }, 300);
  }, [tenantId]);

  return (
    <TenantContext.Provider value={{ tenant, isLoadingTenant, error }}>
      {children}
    </TenantContext.Provider>
  );
};

export const useTenant = () => {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
};
export default TenantContext;
