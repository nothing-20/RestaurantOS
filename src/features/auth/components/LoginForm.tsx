import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { authService } from '../../../services/authService';
import Button from '../../../components/ui/Button/Button';
import Input from '../../../components/ui/Input/Input';
import { useToastStore } from '../../../components/ui/Toast/Toast';

export const LoginForm: React.FC = () => {
  const { loginAsMockRole } = useAuth();
  const { addToast } = useToastStore();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const validate = () => {
    const nextErrors: typeof errors = {};
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
      // Trigger the real sign-in
      const credentials = await authService.signInWithEmail(email, password, rememberMe);
      const user = credentials.user;
      
      // Request claims to route user to correct dashboard
      const claims = await authService.getUserClaims(user);
      
      addToast('Successfully authenticated!', 'success');
      
      if (claims.role === 'super-admin') {
        navigate('/super-admin');
      } else if (claims.role) {
        navigate(`/dashboard/${claims.role}`);
      } else {
        navigate('/');
      }
    } catch (err: any) {
      console.error(err);
      addToast(err.message || 'Authentication failed. Please verify credentials.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Email Address"
        type="email"
        placeholder="you@restaurant.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        error={errors.email}
        disabled={isLoading}
      />

      <div className="relative">
        <Input
          label="Password"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
          disabled={isLoading}
        />
        <div className="flex justify-end mt-1">
          <Link 
            to="/forgot-password" 
            className="text-[11px] text-primary hover:underline hover:text-primary-hover"
          >
            Forgot Password?
          </Link>
        </div>
      </div>

      <div className="flex items-center space-x-2.5 py-1 text-left">
        <input
          id="remember-me"
          type="checkbox"
          checked={rememberMe}
          onChange={(e) => setRememberMe(e.target.checked)}
          className="w-4 h-4 accent-primary rounded bg-slate-900 border-slate-800 focus:ring-0 cursor-pointer"
        />
        <label htmlFor="remember-me" className="text-xs text-slate-400 select-none cursor-pointer">
          Remember me on this device
        </label>
      </div>

      <Button type="submit" className="w-full mt-2" isLoading={isLoading}>
        Sign In
      </Button>

      <div className="text-center mt-6 pt-4 border-t border-slate-800/40 text-xs text-mutedAsh">
        Don't have an account?{' '}
        <Link to="/register" className="text-primary hover:underline font-bold">
          Register Merchant
        </Link>
      </div>
    </form>
  );
};
export default LoginForm;
