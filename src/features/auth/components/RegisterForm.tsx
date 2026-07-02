import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../../../services/authService';
import Button from '../../../components/ui/Button/Button';
import Input from '../../../components/ui/Input/Input';
import { useToastStore } from '../../../components/ui/Toast/Toast';

export const RegisterForm: React.FC = () => {
  const { addToast } = useToastStore();
  const navigate = useNavigate();

  const [restaurantName, setRestaurantName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{
    restaurantName?: string;
    displayName?: string;
    email?: string;
    password?: string;
  }>({});

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
      // Register owner credentials and write profile to Firestore
      await authService.signUpOwner(email, password, displayName, restaurantName);
      
      addToast('Restaurant registered successfully!', 'success');
      
      // Send verification email automatically
      if (authService.signUpOwner) {
        // Direct route to verification view or dashboard
        navigate('/dashboard/owner');
      }
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
