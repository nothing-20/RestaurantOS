import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '../../../config/firebase';
import Button from '../../../components/ui/Button/Button';
import Input from '../../../components/ui/Input/Input';
import Card from '../../../components/ui/Card/Card';
import { useToastStore } from '../../../components/ui/Toast/Toast';
import { getDashboardRoute } from '../../../utils/navigation';
import { UserCheck, ShieldAlert, ArrowRight, Eye, EyeOff, Lock, Mail } from 'lucide-react';

export const StaffLogin: React.FC = () => {
  const navigate = useNavigate();
  const { addToast } = useToastStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const validate = () => {
    const next: typeof errors = {};
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      next.email = 'Email address is required.';
    } else if (!/\S+@\S+\.\S+/.test(cleanEmail)) {
      next.email = 'Please enter a valid email address.';
    }
    if (!password) {
      next.password = 'Password is required.';
    } else if (password.length < 6) {
      next.password = 'Password must be at least 6 characters.';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    console.log('[AUTH Staff Login] Login started for:', cleanEmail);
    if (!validate()) return;

    setIsLoading(true);
    try {
      // 1. Firebase Authentication
      console.log('[AUTH Staff Login] Calling Firebase authentication...');
      const credentials = await signInWithEmailAndPassword(auth, cleanEmail, password);
      const fUser = credentials.user;

      console.log('[AUTH Staff Login] Firebase Auth success:', {
        uid: fUser.uid,
        email: fUser.email
      });

      // 2. Authoritative profile resolution
      const { resolveAuthenticatedUser } = await import('../../../shared/services/roleResolver');
      const profile = await resolveAuthenticatedUser(fUser);

      if (!profile) {
        console.warn('[AUTH Staff Login] Profile missing for UID:', fUser.uid);
        await auth.signOut();
        addToast('Your account is authenticated, but no staff profile is associated with this account. Please contact your restaurant administrator.', 'error');
        setIsLoading(false);
        return;
      }

      console.log('[AUTH Staff Login] Resolved profile:', {
        role: profile.role,
        tenantId: profile.tenantId,
        status: profile.status
      });

      // 3. Account Status Check
      if (profile.status && profile.status !== 'active') {
        console.warn('[AUTH Staff Login] Staff account inactive/suspended:', profile.status);
        await auth.signOut();
        addToast('Your staff account is currently inactive or suspended. Contact your administrator.', 'error');
        setIsLoading(false);
        return;
      }

      // 4. Role Validation & Portal Isolation
      if (profile.role === 'customer') {
        console.warn('[AUTH Staff Login] Customer account attempted staff login. Rejecting.');
        await auth.signOut();
        addToast('This account is registered as a diner account. Please sign in via Customer Login.', 'error');
        setIsLoading(false);
        return;
      }

      if (!profile.tenantId && profile.role !== 'super-admin') {
        console.error('[AUTH Staff Login] Staff profile missing tenantId');
        await auth.signOut();
        addToast('Your staff account is not assigned to a restaurant tenant. Contact your administrator.', 'error');
        setIsLoading(false);
        return;
      }

      // 5. Successful Role-Based Routing
      const destination = getDashboardRoute(profile.role);
      console.log('[AUTH Staff Login] Successful auth. Routing details:', {
        uid: fUser.uid,
        email: cleanEmail,
        portal: 'STAFF',
        resolvedRole: profile.role,
        tenantId: profile.tenantId,
        destination
      });

      addToast(`Welcome back, ${profile.displayName || 'Staff'}!`, 'success');
      navigate(destination, { replace: true });
    } catch (err: any) {
      console.error('[AUTH Staff Login Error]', err);
      let msg = 'Authentication failed. Please check your credentials.';

      if (err.message === 'PERMISSION_DENIED_USER_PROFILE') {
        msg = 'Your account is authenticated, but your staff profile cannot be accessed because of a database authorization configuration issue. Contact your administrator.';
      } else if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        msg = 'Incorrect email or password. If you have an invitation, activate your account first.';
      } else if (err.code === 'permission-denied' || err.message?.includes('insufficient permissions')) {
        msg = 'Your account is authenticated, but your staff profile cannot be accessed because of an authorization configuration problem. Contact your administrator.';
      } else if (err.code === 'auth/too-many-requests') {
        msg = 'Too many attempts. Please wait a moment and try again.';
      } else if (err.message) {
        msg = err.message;
      }

      addToast(msg, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-left relative overflow-hidden select-none">
      {/* Background accents */}
      <div className="absolute top-[-10%] left-[-15%] w-[600px] h-[600px] rounded-full bg-primary/10 blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] rounded-full bg-slate-800/20 blur-[100px] pointer-events-none" />

      <div className="w-full max-w-md space-y-6 relative z-10">

        {/* Brand header */}
        <div className="flex flex-col items-center text-center space-y-3">
          <div className="w-12 h-12 bg-primary/10 border border-primary/20 rounded-2xl flex items-center justify-center shadow-lg shadow-primary/5">
            <UserCheck className="w-6 h-6 text-primary" />
          </div>
          <div className="space-y-0.5">
            <p className="text-[11px] font-display font-extrabold text-slate-500 tracking-wider uppercase">RestaurantOS</p>
            <h1 className="text-xl font-display font-extrabold text-textPearl">Staff Portal Sign In</h1>
          </div>
        </div>

        {/* Login Card */}
        <Card className="p-8 border-slate-800/60 bg-slate-900/40 backdrop-blur-md rounded-3xl shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Email field */}
            <Input
              label="Staff Email Address *"
              type="email"
              placeholder="you@restaurant.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={errors.email}
              disabled={isLoading}
              required
            />

            {/* Password field */}
            <div className="relative">
              <Input
                label="Password *"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                error={errors.password}
                disabled={isLoading}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-8 text-slate-500 hover:text-slate-300 transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full flex items-center justify-center space-x-2"
              isLoading={isLoading}
            >
              <span>Sign In to Staff Portal</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </form>

          {/* Account activation promo banner */}
          <div className="mt-6 pt-5 border-t border-slate-800/60 text-center space-y-2">
            <p className="text-[11px] text-slate-400 font-semibold">Received a staff invitation email?</p>
            <Link
              to="/staff/activate"
              className="inline-flex items-center space-x-1.5 text-xs text-emerald-400 hover:text-emerald-300 font-bold hover:underline transition-colors"
            >
              <span>Activate Your Staff Account Here →</span>
            </Link>
          </div>
        </Card>

        {/* Footer Navigation Links */}
        <div className="flex items-center justify-between text-[11px] text-slate-600 font-semibold px-2">
          <Link to="/" className="hover:text-textPearl transition-colors font-bold">
            ← Back to Home
          </Link>
          <Link to="/customer/login" className="hover:text-textPearl transition-colors font-bold">
            Customer Login →
          </Link>
        </div>

      </div>
    </div>
  );
};

export default StaffLogin;
