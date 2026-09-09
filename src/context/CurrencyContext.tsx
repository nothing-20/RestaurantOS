import React, { createContext, useContext, useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from './AuthContext';
import { 
  SUPPORTED_CURRENCIES, 
  detectDefaultCountryAndCurrency, 
  getCurrencySymbol, 
  setGlobalCurrencyConfig 
} from '../shared/utils/format';

interface ICurrencyContextType {
  currency: string;
  currencySymbol: string;
  locale: string;
  formatCurrency: (value: number) => string;
  formatPrice: (priceInCents: number) => string;
}

const CurrencyContext = createContext<ICurrencyContextType | undefined>(undefined);

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

  const detected = detectDefaultCountryAndCurrency();
  const [currency, setCurrency] = useState<string>(detected.currency);
  const [currencySymbol, setCurrencySymbol] = useState<string>(detected.symbol);
  const [locale, setLocale] = useState<string>(detected.locale);

  useEffect(() => {
    // Resolve tenant ID: first check logged-in user, then URL
    const resolvedTenantId = user?.tenantId || getTenantIdFromUrl();
    
    if (!resolvedTenantId) {
      const def = detectDefaultCountryAndCurrency();
      setCurrency(def.currency);
      setCurrencySymbol(def.symbol);
      setLocale(def.locale);
      setGlobalCurrencyConfig(def.currency, def.locale);
      return;
    }

    const docRef = doc(db, 'tenants', resolvedTenantId);
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        const curr = data.settings?.currency || data.currency || data.currencyCode || detected.currency;
        const config = SUPPORTED_CURRENCIES[curr] || {
          code: curr,
          locale: data.locale || detected.locale,
          symbol: data.currencySymbol || data.settings?.currencySymbol || getCurrencySymbol(curr)
        };
        setCurrency(curr);
        setCurrencySymbol(config.symbol);
        setLocale(config.locale);
        
        // Sync to vanilla TS formatters
        setGlobalCurrencyConfig(curr, config.locale);
      } else {
        const def = detectDefaultCountryAndCurrency();
        setCurrency(def.currency);
        setCurrencySymbol(def.symbol);
        setLocale(def.locale);
        setGlobalCurrencyConfig(def.currency, def.locale);
      }
    }, (err) => {
      console.error("Failed to sync currency settings from Firestore:", err);
      const def = detectDefaultCountryAndCurrency();
      setCurrency(def.currency);
      setCurrencySymbol(def.symbol);
      setLocale(def.locale);
      setGlobalCurrencyConfig(def.currency, def.locale);
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
