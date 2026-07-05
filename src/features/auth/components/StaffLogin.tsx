import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../../../config/firebase';
import Button from '../../../components/ui/Button/Button';
import Input from '../../../components/ui/Input/Input';
import Card from '../../../components/ui/Card/Card';
import toast from 'react-hot-toast';

// Explicit role-to-path map — no template literals, no surprises
const ROLE_PATHS: Record<string, string> = {
  'super-admin': '/super-admin',
  owner:         '/dashboard/owner',
  admin:         '/dashboard/owner',
  manager:       '/dashboard/manager',
  waiter:        '/dashboard/waiter',
  kitchen:       '/dashboard/kitchen',
  cashier:       '/dashboard/cashier',
  reception:     '/dashboard/reception',
};

export const StaffLogin: React.FC = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const validate = () => {
    const next: typeof errors = {};
    if (!email.trim()) {
      next.email = 'Email address is required.';
    } else if (!/\S+@\S+\.\S+/.test(email.trim())) {
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
    if (!validate()) return;

    setIsLoading(true);
    try {
      // 1. Firebase Authentication
      const credentials = await signInWithEmailAndPassword(auth, email.trim().toLowerCase(), password);
      const fUser = credentials.user;

      // 2. Fetch users/{uid} — the authoritative auth record
      const userDocRef = doc(db, 'users', fUser.uid);
      const userSnap = await getDoc(userDocRef);

      if (!userSnap.exists()) {
        // No users/{uid} doc means the account was never activated via /staff/activate
        await auth.signOut();
        toast.error(
          'Your staff account is not linked. Please activate it at "Activate Staff Account".',
          { id: 'profile-missing-toast', duration: 7000 }
        );
        setIsLoading(false);
        return;
      }

      const profile = userSnap.data();

      // 3. Status check — suspended accounts are blocked
      if (profile.status && profile.status !== 'active') {
        await auth.signOut();
        toast.error(
          'Your account has been suspended. Contact your restaurant administrator.',
          { id: 'status-disabled-toast' }
        );
        setIsLoading(false);
        return;
      }

      // 4. Role check — must have a known role
      if (!profile.role || !ROLE_PATHS[profile.role]) {
        await auth.signOut();
        toast.error(
          'Unable to determine your role. Contact your restaurant administrator.',
          { id: 'no-role-toast' }
        );
        setIsLoading(false);
        return;
      }

      toast.success(`Welcome back, ${profile.fullName || 'Staff'}!`);
      navigate(ROLE_PATHS[profile.role], { replace: true });
    } catch (err: any) {
      console.error(err);
      const msg =
        err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found'
          ? 'Incorrect email or password. If you have not activated yet, use the link below.'
          : err.code === 'auth/too-many-requests'
          ? 'Too many attempts. Please wait a moment and try again.'
          : err.message || 'Authentication failed. Please check your credentials.';
      toast.error(msg, { id: 'auth-error-toast' });
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
            <span className="text-primary font-display font-extrabold text-2xl">R</span>
          </div>
          <div className="space-y-0.5">
            <h1 className="text-sm font-display font-extrabold text-slate-500 tracking-wider uppercase">RestaurantOS</h1>
            <span className="text-xl font-display font-extrabold text-textPearl">Staff Portal</span>
          </div>
        </div>

        {/* Login card */}
        <Card className="p-8 border-slate-800/60 bg-slate-900/40 backdrop-blur-md rounded-3xl shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1 text-center pb-2">
              <h2 className="text-base font-bold text-textPearl">Welcome Back</h2>
              <p className="text-[11px] text-slate-500 font-semibold">Enter your credentials to open your dashboard.</p>
            </div>

            <Input
              label="Staff Email Address"
              type="email"
              placeholder="chef@restaurant.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={errors.email}
              disabled={isLoading}
              required
            />

            <div>
              <Input
                label="Password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                error={errors.password}
                disabled={isLoading}
                required
              />
              <div className="flex justify-end mt-1.5">
                <Link
                  to="/forgot-password"
                  className="text-[10px] font-bold text-primary hover:underline"
                >
                  Forgot Password?
                </Link>
              </div>
            </div>

            <Button type="submit" className="w-full" isLoading={isLoading}>
              Sign In
            </Button>
          </form>

          {/* Divider */}
          <div className="mt-6 pt-5 border-t border-slate-800/50">
            <div className="text-center space-y-1">
              <p className="text-[10px] text-slate-600 font-semibold">First time joining your restaurant?</p>
              <Link
                to="/staff/activate"
                className="block w-full text-center py-2.5 rounded-xl border border-emerald-500/25 bg-emerald-500/5 text-emerald-400 text-xs font-bold hover:bg-emerald-500/10 hover:border-emerald-500/40 transition-all"
              >
                ✦ Activate Staff Account
              </Link>
            </div>
          </div>
        </Card>

        {/* Back link */}
        <div className="text-center">
          <Link
            to="/"
            className="text-[11px] text-slate-500 hover:text-textPearl transition-colors font-bold uppercase tracking-wider"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default StaffLogin;
