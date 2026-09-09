import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../../../services/authService';
import Button from '../../../components/ui/Button/Button';
import Input from '../../../components/ui/Input/Input';
import { useToastStore } from '../../../components/ui/Toast/Toast';
import { getDashboardRoute } from '../../../utils/navigation';
import { 
  SUPPORTED_COUNTRIES, 
  SUPPORTED_CURRENCIES, 
  detectDefaultCountryAndCurrency 
} from '../../../shared/utils/format';
import { Globe, DollarSign } from 'lucide-react';

export const RegisterForm: React.FC = () => {
  const { addToast } = useToastStore();
  const navigate = useNavigate();

  const detected = detectDefaultCountryAndCurrency();
  const [restaurantName, setRestaurantName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [country, setCountry] = useState(detected.country);
  const [currency, setCurrency] = useState(detected.currency);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{
    restaurantName?: string;
    displayName?: string;
    email?: string;
    password?: string;
  }>({});

  const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nextCountry = e.target.value;
    setCountry(nextCountry);
    const countryConfig = SUPPORTED_COUNTRIES[nextCountry];
    if (countryConfig) {
      setCurrency(countryConfig.defaultCurrency);
    }
  };

  const validate = () => {
    const nextErrors: typeof errors = {};
    if (!restaurantName.trim()) {
      nextErrors.restaurantName = 'Restaurant name is required';
    }
    if (!displayName.trim()) {
      nextErrors.displayName = 'Full name is required';
    }
    if (!email) {
      nextErrors.email = 'Email address is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      nextErrors.email = 'Email format is invalid';
    }
    if (!password) {
      nextErrors.password = 'Password is required';
    } else if (password.length < 6) {
      nextErrors.password = 'Password must be at least 6 characters';
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    try {
      // Register owner credentials with localized country, currency, and locale
      const locale = SUPPORTED_CURRENCIES[currency]?.locale || 'en-IN';
      await authService.signUpOwner(
        email, 
        password, 
        displayName, 
        restaurantName, 
        country, 
        currency, 
        locale
      );
      
      addToast('Restaurant registered successfully!', 'success');
      
      // Direct route to dashboard
      const destination = getDashboardRoute('owner');
      navigate(destination, { replace: true });
    } catch (err: any) {
      console.error(err);
      addToast(err.message || 'Registration failed. Please check parameters.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Restaurant Name"
        type="text"
        placeholder="Gourmet Bistro"
        value={restaurantName}
        onChange={(e) => setRestaurantName(e.target.value)}
        error={errors.restaurantName}
        disabled={isLoading}
      />

      <Input
        label="Owner's Full Name"
        type="text"
        placeholder="John Doe"
        value={displayName}
        onChange={(e) => setDisplayName(e.target.value)}
        error={errors.displayName}
        disabled={isLoading}
      />

      {/* Country & Currency Selection */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5 text-primary" />
            Country
          </label>
          <select
            value={country}
            onChange={handleCountryChange}
            disabled={isLoading}
            className="w-full bg-slate-900 border border-slate-700/60 rounded-xl px-3 py-2 text-xs text-textPearl focus:outline-none focus:border-primary transition-colors"
          >
            {Object.values(SUPPORTED_COUNTRIES).map((c) => (
              <option key={c.code} value={c.code} className="bg-slate-900 text-slate-100">
                {c.name} ({c.code})
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <DollarSign className="w-3.5 h-3.5 text-primary" />
            Currency
          </label>
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            disabled={isLoading}
            className="w-full bg-slate-900 border border-slate-700/60 rounded-xl px-3 py-2 text-xs text-textPearl focus:outline-none focus:border-primary transition-colors"
          >
            {Object.values(SUPPORTED_CURRENCIES).map((curr) => (
              <option key={curr.code} value={curr.code} className="bg-slate-900 text-slate-100">
                {curr.name} - {curr.symbol}
              </option>
            ))}
          </select>
        </div>
      </div>

      <Input
        label="Contact Email"
        type="email"
        placeholder="owner@restaurant.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        error={errors.email}
        disabled={isLoading}
      />

      <Input
        label="Password"
        type="password"
        placeholder="••••••••"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        error={errors.password}
        disabled={isLoading}
      />

      <Button type="submit" className="w-full mt-4" isLoading={isLoading}>
        Create Account & Onboard
      </Button>

      <div className="text-center mt-6 pt-4 border-t border-slate-800/40 text-xs text-mutedAsh">
        Already have a merchant workspace?{' '}
        <Link to="/login" className="text-primary hover:underline font-bold">
          Sign In
        </Link>
      </div>
    </form>
  );
};
export default RegisterForm;
