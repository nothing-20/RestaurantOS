import React, { createContext, useContext, useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from './AuthContext';
import { setGlobalCurrencyConfig } from '../shared/utils/format';

interface ICurrencyContextType {
  currency: string;
  currencySymbol: string;
  locale: string;
  formatCurrency: (value: number) => string;
  formatPrice: (priceInCents: number) => string;
}

const CurrencyContext = createContext<ICurrencyContextType | undefined>(undefined);

// Supported currencies mapping to their corresponding locales and fallback symbols
const CURRENCY_CONFIGS: Record<string, { locale: string; symbol: string }> = {
  INR: { locale: 'en-IN', symbol: '₹' },
  USD: { locale: 'en-US', symbol: '$' },
  EUR: { locale: 'en-IE', symbol: '€' },
  GBP: { locale: 'en-GB', symbol: '£' },
  AED: { locale: 'en-AE', symbol: 'AED ' },
  SAR: { locale: 'en-SA', symbol: 'SR ' },
  AUD: { locale: 'en-AUD', symbol: '$' },
  CAD: { locale: 'en-CA', symbol: '$' },
  JPY: { locale: 'ja-JP', symbol: '¥' },
  SGD: { locale: 'en-SG', symbol: 'S$' },
  MYR: { locale: 'ms-MY', symbol: 'RM' },
  THB: { locale: 'th-TH', symbol: '฿' }
};

function getTenantIdFromUrl(): string | null {
  const path = window.location.pathname;
  
  // Pattern 1: /customer/restaurant/:tenantId/...
  const customerRestMatch = path.match(/^\/customer\/restaurant\/([^/]+)/);
  if (customerRestMatch) return customerRestMatch[1];
  
  // Pattern 2: /r/:tenantId/table/:tableId
  const qrMatch = path.match(/^\/r\/([^/]+)/);
  if (qrMatch) return qrMatch[1];
  
  // Pattern 3: query string ?tenantId=... or ?restaurantId=... or ?tenant=...
  const searchParams = new URLSearchParams(window.location.search);
  const tenantIdQuery = searchParams.get('tenantId') || searchParams.get('restaurantId') || searchParams.get('tenant');
  if (tenantIdQuery) return tenantIdQuery;
  
  return null;
}

export const CurrencyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const location = useLocation();
  const [currency, setCurrency] = useState<string>('USD');
  const [currencySymbol, setCurrencySymbol] = useState<string>('$');
  const [locale, setLocale] = useState<string>('en-US');

  useEffect(() => {
    // Resolve tenant ID: first check logged-in user, then URL, then default demo restaurant
    const resolvedTenantId = user?.tenantId || getTenantIdFromUrl() || 'l-ambroisie';
    
    const docRef = doc(db, 'tenants', resolvedTenantId);
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        const curr = data.settings?.currency || data.currencyCode || 'USD';
        setCurrency(curr);
        const config = CURRENCY_CONFIGS[curr] || { locale: 'en-US', symbol: '$' };
        setCurrencySymbol(config.symbol);
        setLocale(config.locale);
        
        // Sync to vanilla TS formatters
        setGlobalCurrencyConfig(curr, config.locale);
      } else {
        // Fallback to USD
        setCurrency('USD');
        setCurrencySymbol('$');
        setLocale('en-US');
        setGlobalCurrencyConfig('USD', 'en-US');
      }
    }, (err) => {
      console.error("Failed to sync currency settings from Firestore:", err);
    });

    return () => unsubscribe();
  }, [user?.tenantId, location.pathname, location.search]);

  const formatCurrency = (value: number): string => {
    try {
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: currency
      }).format(value);
    } catch (e) {
      return `${currencySymbol}${value.toFixed(2)}`;
    }
  };

  const formatPrice = (priceInCents: number): string => {
    return formatCurrency(priceInCents / 100);
  };

  return (
    <CurrencyContext.Provider value={{ currency, currencySymbol, locale, formatCurrency, formatPrice }}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};
export default CurrencyContext;
