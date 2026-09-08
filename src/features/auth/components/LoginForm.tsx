import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { authService } from '../../../services/authService';
import Button from '../../../components/ui/Button/Button';
import Input from '../../../components/ui/Input/Input';
import { useToastStore } from '../../../components/ui/Toast/Toast';
import { getDashboardRoute } from '../../../utils/navigation';

export const LoginForm: React.FC = () => {
  const { addToast } = useToastStore();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const validate = () => {
    const nextErrors: typeof errors = {};
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      nextErrors.email = 'Email address is required';
    } else if (!/\S+@\S+\.\S+/.test(cleanEmail)) {
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
    const cleanEmail = email.trim().toLowerCase();
    console.log('[AUTH Owner Login] Form submitted for:', cleanEmail);
    if (!validate()) return;

    setIsLoading(true);
    try {
      console.log('[AUTH Owner Login] Calling Firebase authentication...');
      const credentials = await authService.signInWithEmail(cleanEmail, password, rememberMe);
      const user = credentials.user;
      console.log('[AUTH Owner Login] Firebase Auth succeeded. UID:', user.uid);

      // Authoritative profile resolution
      const { resolveAuthenticatedUser } = await import('../../../shared/services/roleResolver');
      const profile = await resolveAuthenticatedUser(user);

      if (!profile) {
        console.error('[AUTH Owner Login] Role/profile unresolved for UID:', user.uid);
        await authService.signOutUser();
        addToast(`Owner profile is missing or not configured. No profile document found for UID: ${user.uid} in users/${user.uid}.`, 'error');
        setIsLoading(false);
        return;
      }

      const allowedOwnerRoles = ['owner', 'admin', 'super-admin'];
      if (!allowedOwnerRoles.includes(profile.role)) {
        console.warn('[AUTH Owner Login] Mismatched account role:', profile.role);
        await authService.signOutUser();
        addToast('This account does not have access to the Owner Portal. Please use the Staff or Customer login.', 'error');
        setIsLoading(false);
        return;
      }

      const destination = getDashboardRoute(profile.role);
      console.log('[AUTH Owner Login] Successful auth. Details:', {
        uid: user.uid,
        email: cleanEmail,
        portal: 'OWNER',
        role: profile.role,
        tenantId: profile.tenantId,
        destination
      });

      addToast('Successfully authenticated to Owner Workspace!', 'success');
      navigate(destination, { replace: true });
    } catch (err: any) {
      console.error('[AUTH Owner Login Error]', err);
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
