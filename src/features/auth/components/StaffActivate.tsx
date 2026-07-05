import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  setDoc,
  updateDoc,
  limit
} from 'firebase/firestore';
import { auth, db } from '../../../config/firebase';
import Button from '../../../components/ui/Button/Button';
import Input from '../../../components/ui/Input/Input';
import Card from '../../../components/ui/Card/Card';
import toast from 'react-hot-toast';
import { CheckCircle, Mail, Lock, Eye, EyeOff, ArrowRight, UserCheck } from 'lucide-react';

// ─── Steps ────────────────────────────────────────────────────────────────────
type Step = 'email' | 'password' | 'success';

interface IEmployeeInvite {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role: string;
  tenantId: string;
  branchId: string;
  department?: string;
  status: string;
  activationStatus: string;
  firebaseUid: string | null;
  invitedAt: string;
  createdBy: string;
}

// ─── Role path routing ─────────────────────────────────────────────────────────
const ROLE_PATHS: Record<string, string> = {
  owner:       '/dashboard/owner',
  admin:       '/dashboard/owner',
  manager:     '/dashboard/manager',
  waiter:      '/dashboard/waiter',
  kitchen:     '/dashboard/kitchen',
  cashier:     '/dashboard/cashier',
  reception:   '/dashboard/reception',
  'super-admin': '/super-admin',
};

// ─── Component ─────────────────────────────────────────────────────────────────
export const StaffActivate: React.FC = () => {
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [invite, setInvite] = useState<IEmployeeInvite | null>(null);
  const [errors, setErrors] = useState<{ email?: string; password?: string; confirm?: string }>({});

  // ── Step 1: look up invitation ─────────────────────────────────────────────
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedEmail) {
      setErrors({ email: 'Email address is required.' });
      return;
    }
    if (!/\S+@\S+\.\S+/.test(trimmedEmail)) {
      setErrors({ email: 'Please enter a valid email address.' });
      return;
    }
    setErrors({});
    setIsLoading(true);

    try {
      // Query root-level employees collection by email + activationStatus
      const empRef = collection(db, 'employees');
      const q = query(
        empRef,
        where('email', '==', trimmedEmail),
        where('activationStatus', '==', 'invited'),
        limit(1)
      );
      const snap = await getDocs(q);

      if (snap.empty) {
        setErrors({ email: 'No pending invitation found for this email. Check the address or contact your manager.' });
        setIsLoading(false);
        return;
      }

      const empDoc = snap.docs[0];
      const data = empDoc.data() as Omit<IEmployeeInvite, 'id'>;

      if (data.status !== 'pending') {
        setErrors({ email: 'This invitation has already been used or has been revoked.' });
        setIsLoading(false);
        return;
      }

      setInvite({ id: empDoc.id, ...data });
      setStep('password');
      toast.success(`Welcome, ${data.fullName}! Set your password to continue.`);
    } catch (err: any) {
      console.error(err);
      toast.error('Failed to look up invitation. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // ── Step 2: create Firebase account + link records ─────────────────────────
  const handleActivation = async (e: React.FormEvent) => {
    e.preventDefault();
    const nextErrors: typeof errors = {};

    if (!password) {
      nextErrors.password = 'Password is required.';
    } else if (password.length < 6) {
      nextErrors.password = 'Password must be at least 6 characters.';
    }
    if (!confirmPassword) {
      nextErrors.confirm = 'Please confirm your password.';
    } else if (password !== confirmPassword) {
      nextErrors.confirm = 'Passwords do not match.';
    }
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }
    setErrors({});

    if (!invite) return;
    setIsLoading(true);

    try {
      // Step A: Create Firebase Authentication account
      const credentials = await createUserWithEmailAndPassword(
        auth,
        invite.email,
        password
      );
      const fUser = credentials.user;

      const now = new Date().toISOString();

      // Step B: Create users/{uid} document — the auth record
      const userRef = doc(db, 'users', fUser.uid);
      await setDoc(userRef, {
        uid: fUser.uid,
        fullName: invite.fullName,
        email: invite.email,
        phone: invite.phone,
        role: invite.role,
        tenantId: invite.tenantId,
        branchId: invite.branchId || '',
        department: invite.department || '',
        status: 'active',
        createdAt: now,
        updatedAt: now,
      });

      // Step C: Update employees/{id} — link Firebase UID, mark activated
      const employeeRef = doc(db, 'employees', invite.id);
      await updateDoc(employeeRef, {
        firebaseUid: fUser.uid,
        status: 'active',
        activationStatus: 'activated',
        activatedAt: now,
        updatedAt: now,
      });

      setStep('success');
      toast.success('Account activated! Redirecting to your dashboard...');

      // Auto-redirect after 2 seconds
      setTimeout(() => {
        const destination = ROLE_PATHS[invite.role] || '/staff/login';
        navigate(destination, { replace: true });
      }, 2000);
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/email-already-in-use') {
        toast.error('This email already has a Firebase account. Try logging in at Staff Login.');
      } else {
        toast.error(err.message || 'Activation failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // ── Step indicators ────────────────────────────────────────────────────────
  const STEPS = [
    { label: 'Verify Invite', icon: Mail },
    { label: 'Set Password', icon: Lock },
    { label: 'Activated',    icon: CheckCircle },
  ];
  const stepIndex = step === 'email' ? 0 : step === 'password' ? 1 : 2;

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 relative overflow-hidden select-none">
      {/* Ambient glow */}
      <div className="absolute top-[-10%] left-[-15%] w-[600px] h-[600px] rounded-full bg-emerald-500/8 blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-15%] w-[400px] h-[400px] rounded-full bg-primary/6 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md space-y-6 relative z-10">

        {/* Brand */}
        <div className="flex flex-col items-center text-center space-y-3">
          <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-center shadow-lg">
            <UserCheck className="w-6 h-6 text-emerald-400" />
          </div>
          <div className="space-y-0.5">
            <p className="text-[11px] font-display font-extrabold text-slate-500 tracking-wider uppercase">RestaurantOS</p>
            <h1 className="text-xl font-display font-extrabold text-textPearl">Staff Account Activation</h1>
          </div>
        </div>

        {/* Step indicators */}
        <div className="flex items-center justify-center space-x-2">
          {STEPS.map((s, i) => {
            const isDone = i < stepIndex;
            const isCurrent = i === stepIndex;
            const Icon = s.icon;
            return (
              <React.Fragment key={s.label}>
                <div className="flex flex-col items-center space-y-1">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center border transition-all duration-300 ${
                    isDone
                      ? 'bg-emerald-500 border-emerald-500 shadow-md shadow-emerald-500/30'
                      : isCurrent
                      ? 'bg-primary/15 border-primary/50 shadow-sm shadow-primary/20'
                      : 'bg-slate-900 border-slate-800'
                  }`}>
                    <Icon className={`w-3.5 h-3.5 ${isDone ? 'text-white' : isCurrent ? 'text-primary' : 'text-slate-600'}`} />
                  </div>
                  <span className={`text-[9px] font-bold tracking-wide ${isCurrent ? 'text-textPearl' : isDone ? 'text-emerald-400' : 'text-slate-600'}`}>
                    {s.label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`h-px w-10 mb-4 transition-colors duration-300 ${i < stepIndex ? 'bg-emerald-500/60' : 'bg-slate-800'}`} />
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Card */}
        <Card className="p-8 border-slate-800/60 bg-slate-900/40 backdrop-blur-md rounded-3xl shadow-2xl">

          {/* ── Step 1: Email ── */}
          {step === 'email' && (
            <form onSubmit={handleEmailSubmit} className="space-y-5">
              <div className="space-y-1 text-center pb-1">
                <h2 className="text-base font-bold text-textPearl">Verify Your Invitation</h2>
                <p className="text-[11px] text-slate-500 font-semibold leading-relaxed">
                  Enter the email address your manager used when they invited you.
                </p>
              </div>

              <Input
                label="Invitation Email Address"
                type="email"
                placeholder="you@restaurant.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                error={errors.email}
                disabled={isLoading}
                required
              />

              <Button type="submit" className="w-full flex items-center justify-center space-x-2" isLoading={isLoading}>
                <span>Find My Invitation</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </form>
          )}

          {/* ── Step 2: Password ── */}
          {step === 'password' && invite && (
            <form onSubmit={handleActivation} className="space-y-5">
              <div className="space-y-1 text-center pb-1">
                <h2 className="text-base font-bold text-emerald-400">Welcome, {invite.fullName}!</h2>
                <p className="text-[11px] text-slate-500 font-semibold leading-relaxed">
                  You've been invited as <strong className="text-slate-300">{invite.role.charAt(0).toUpperCase() + invite.role.slice(1)}</strong>. Set a password to activate your account.
                </p>
              </div>

              {/* Invite summary chip */}
              <div className="bg-emerald-500/8 border border-emerald-500/20 rounded-xl px-4 py-2.5 flex items-center space-x-2.5">
                <Mail className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="text-[11px] font-semibold text-emerald-300 truncate">{invite.email}</span>
              </div>

              {/* Password */}
              <div className="relative">
                <Input
                  label="Choose a Password *"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="At least 6 characters"
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

              {/* Confirm */}
              <div className="relative">
                <Input
                  label="Confirm Password *"
                  type={showConfirm ? 'text' : 'password'}
                  placeholder="Re-enter your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  error={errors.confirm}
                  disabled={isLoading}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-8 text-slate-500 hover:text-slate-300 transition-colors"
                  tabIndex={-1}
                >
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              <Button type="submit" className="w-full flex items-center justify-center space-x-2" isLoading={isLoading}>
                <CheckCircle className="w-4 h-4" />
                <span>Activate Account &amp; Join</span>
              </Button>

              <button
                type="button"
                onClick={() => { setStep('email'); setInvite(null); setPassword(''); setConfirmPassword(''); }}
                className="w-full text-center text-[10px] font-bold text-slate-500 hover:text-textPearl transition-colors pt-1"
              >
                ← Use a Different Email
              </button>
            </form>
          )}

          {/* ── Step 3: Success ── */}
          {step === 'success' && invite && (
            <div className="flex flex-col items-center text-center space-y-5 py-2">
              <div className="w-16 h-16 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center shadow-xl shadow-emerald-500/20 animate-bounce">
                <CheckCircle className="w-8 h-8 text-emerald-400" />
              </div>
              <div className="space-y-1.5">
                <h2 className="text-lg font-display font-extrabold text-emerald-400">Account Activated!</h2>
                <p className="text-[11px] text-slate-400 font-semibold leading-relaxed">
                  Welcome to the team, <span className="text-textPearl">{invite.fullName}</span>.<br />
                  Redirecting you to your <span className="text-primary capitalize">{invite.role}</span> dashboard...
                </p>
              </div>
              <div className="w-full bg-slate-800/40 rounded-full h-1 overflow-hidden">
                <div className="h-full bg-emerald-500 animate-[progress_2s_linear_forwards] rounded-full" style={{ animation: 'width 2s linear forwards' }} />
              </div>
            </div>
          )}
        </Card>

        {/* Footer links */}
        {step !== 'success' && (
          <div className="text-center space-y-2">
            <p className="text-[10px] text-slate-600 font-semibold">
              Already have an account?{' '}
              <Link to="/staff/login" className="text-primary hover:underline font-bold">
                Sign In
              </Link>
            </p>
            <Link
              to="/"
              className="block text-[10px] text-slate-600 hover:text-textPearl transition-colors font-bold uppercase tracking-wider"
            >
              ← Back to Home
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default StaffActivate;
