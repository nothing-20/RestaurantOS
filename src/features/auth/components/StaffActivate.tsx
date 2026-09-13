import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc
} from 'firebase/firestore';
import { auth, db } from '../../../config/firebase';
import Button from '../../../components/ui/Button/Button';
import Input from '../../../components/ui/Input/Input';
import Card from '../../../components/ui/Card/Card';
import toast from 'react-hot-toast';
import {
  CheckCircle,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  UserCheck,
  AlertTriangle,
  Clock,
  ShieldAlert,
  Loader2,
  Building
} from 'lucide-react';
import { getDashboardRoute } from '../../../utils/navigation';

// ─── Steps ────────────────────────────────────────────────────────────────────
type Step = 'verifying' | 'email' | 'password' | 'success' | 'error';

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
  firebaseUid?: string | null;
  invitationToken?: string;
  expiresAt?: string;
  restaurantName?: string;
}

// ─── Component ─────────────────────────────────────────────────────────────────
export const StaffActivate: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const tokenParam = (searchParams.get('token') || '').trim();
  const emailParam = (searchParams.get('email') || '').trim().toLowerCase();
  const idParam = (searchParams.get('id') || '').trim();

  // Determine initial step: if URL parameters are provided, go straight to auto-verification
  const hasDirectParams = Boolean(tokenParam || idParam || emailParam);
  const [step, setStep] = useState<Step>(hasDirectParams ? 'verifying' : 'email');

  const [email, setEmail] = useState(emailParam);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [invite, setInvite] = useState<IEmployeeInvite | null>(null);
  const [errors, setErrors] = useState<{ email?: string; password?: string; confirm?: string }>({});

  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const verificationAttemptedRef = useRef(false);

  // ── Verification Handler ─────────────────────────────────────────────────────
  const verifyInvitation = useCallback(
    async (overrideEmail?: string) => {
      setIsLoading(true);
      setErrors({});
      setErrorCode(null);
      setErrorMessage('');

      try {
        // ─────────────────────────────────────────────────────────────────────
        // 1. DIRECT CLIENT-SIDE GET: Preferred O(1) direct document fetch
        // ─────────────────────────────────────────────────────────────────────
        if (idParam) {
          console.log('[StaffActivate] Verification method: direct-firestore, employeeId:', idParam);
          try {
            const empDocRef = doc(db, 'employees', idParam);
            const empSnap = await getDoc(empDocRef);

            if (!empSnap.exists()) {
              console.warn('[StaffActivate] Firestore document does not exist for ID:', idParam);
              setErrorCode('NOT_FOUND');
              setErrorMessage('This invitation could not be found. Please check your activation link or contact your manager.');
              setStep('error');
              setIsLoading(false);
              return;
            }

            const data = empSnap.data() as Omit<IEmployeeInvite, 'id'>;

            // Check if already activated
            if (data.activationStatus === 'activated' || data.status === 'active') {
              console.log('[StaffActivate] Invitation status: already activated');
              setErrorCode('ALREADY_ACTIVATED');
              setErrorMessage('This invitation has already been activated. Please sign in to your staff account.');
              setStep('error');
              setIsLoading(false);
              return;
            }

            // Check if status is invalid or revoked
            if (data.status !== 'pending' || data.activationStatus !== 'invited') {
              console.log('[StaffActivate] Invitation status invalid:', data.status, data.activationStatus);
              setErrorCode('INVALID_STATUS');
              setErrorMessage('This invitation is no longer valid or has been revoked.');
              setStep('error');
              setIsLoading(false);
              return;
            }

            // Check expiration (7-day validity)
            if (data.expiresAt && new Date(data.expiresAt).getTime() < Date.now()) {
              console.log('[StaffActivate] Invitation expired at:', data.expiresAt);
              setErrorCode('EXPIRED');
              setErrorMessage('This invitation link has expired. Ask your restaurant owner to send a new invitation.');
              setStep('error');
              setIsLoading(false);
              return;
            }

            // Verify token match if tokenParam exists
            if (tokenParam && data.invitationToken && data.invitationToken !== tokenParam) {
              console.warn('[StaffActivate] Invitation token mismatch');
              setErrorCode('INVALID_TOKEN');
              setErrorMessage('This invitation link is invalid. The security token does not match.');
              setStep('error');
              setIsLoading(false);
              return;
            }

            // Verify email match if email provided
            const targetEmail = (overrideEmail || emailParam).trim().toLowerCase();
            if (targetEmail && data.email && data.email.trim().toLowerCase() !== targetEmail) {
              console.warn('[StaffActivate] Email mismatch');
              setErrorCode('EMAIL_MISMATCH');
              setErrorMessage('The email address in the link does not match this invitation record.');
              setStep('error');
              setIsLoading(false);
              return;
            }

            // Valid invitation! Fetch restaurant name for UI context
            let restaurantName = '';
            if (data.tenantId) {
              try {
                const restSnap = await getDoc(doc(db, 'restaurants', data.tenantId));
                if (restSnap.exists()) {
                  restaurantName = restSnap.data()?.name || '';
                }
              } catch {
                // Non-blocking
              }
            }

            console.log('[StaffActivate] Verification successful:', {
              id: empSnap.id,
              role: data.role,
              tenantId: data.tenantId,
              status: data.status,
            });

            setInvite({ id: empSnap.id, ...data, restaurantName });
            setEmail(data.email);
            setStep('password');
            toast.success(`Invitation verified! Welcome, ${data.fullName}. Set your password to continue.`);
            setIsLoading(false);
            return;
          } catch (directErr: any) {
            console.error('[StaffActivate] Direct getDoc error:', directErr?.code || directErr?.message);
            if (directErr?.code === 'permission-denied') {
              setErrorCode('PERMISSION_DENIED');
              setErrorMessage('Unable to verify this invitation. It may have already been activated or expired.');
            } else if (directErr?.code === 'unavailable' || directErr?.message?.includes('network')) {
              setErrorCode('NETWORK_ERROR');
              setErrorMessage('Unable to connect. Please check your internet connection and try again.');
            } else {
              setErrorCode('LOOKUP_FAILED');
              setErrorMessage('Unable to verify this invitation. Please contact your restaurant manager.');
            }
            setStep('error');
            setIsLoading(false);
            return;
          }
        }

        // ─────────────────────────────────────────────────────────────────────
        // 2. SERVER-SIDE FALLBACK: Only used if idParam was not in URL
        // ─────────────────────────────────────────────────────────────────────
        console.log('[StaffActivate] Verification method: serverless API fallback');
        const targetEmail = (overrideEmail || emailParam || email).trim().toLowerCase();
        const response = await fetch('/api/verify-invitation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: idParam || undefined,
            token: tokenParam || undefined,
            email: targetEmail || undefined,
          }),
        });

        const resData = await response.json();

        if (!response.ok || !resData.success) {
          const code = resData.code || 'NOT_FOUND';
          setErrorCode(code);
          if (code === 'ALREADY_ACTIVATED') {
            setErrorMessage('This invitation has already been activated. Please sign in to your staff account.');
          } else if (code === 'EXPIRED') {
            setErrorMessage('This invitation link has expired. Ask your restaurant owner to send a new invitation.');
          } else if (code === 'INVALID_TOKEN') {
            setErrorMessage('This invitation link is invalid. The security token does not match.');
          } else if (code === 'EMAIL_MISMATCH') {
            setErrorMessage('The email address does not match this invitation record.');
          } else {
            setErrorMessage(resData.error || 'This invitation could not be found. Please contact your manager.');
          }
          setStep('error');
          setIsLoading(false);
          return;
        }

        const inv: IEmployeeInvite = resData.invitation;
        setInvite(inv);
        setEmail(inv.email);
        setStep('password');
        toast.success(`Invitation verified! Welcome, ${inv.fullName}. Set your password to continue.`);
      } catch (err: any) {
        console.error('[StaffActivate] Error verifying invitation:', err?.code || err?.message);
        setErrorCode('NETWORK_ERROR');
        setErrorMessage('Unable to connect. Please check your connection and try again.');
        setStep('error');
      } finally {
        setIsLoading(false);
      }
    },
    [idParam, tokenParam, emailParam, email]
  );

  // Auto-verify once when component mounts if URL has token, id, or email
  useEffect(() => {
    if (!verificationAttemptedRef.current && hasDirectParams) {
      verificationAttemptedRef.current = true;
      verifyInvitation();
    }
  }, [hasDirectParams, verifyInvitation]);

  // Fallback manual email submit
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) {
      setErrors({ email: 'Email address is required.' });
      return;
    }
    if (!/\S+@\S+\.\S+/.test(trimmed)) {
      setErrors({ email: 'Please enter a valid email address.' });
      return;
    }
    setStep('verifying');
    await verifyInvitation(trimmed);
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

      // Step B: Create users/{uid} document — the authoritative profile record
      const userRef = doc(db, 'users', fUser.uid);
      await setDoc(userRef, {
        uid: fUser.uid,
        fullName: invite.fullName,
        displayName: invite.fullName,
        email: invite.email,
        phone: invite.phone || '',
        phoneNumber: invite.phone || '',
        role: invite.role,
        tenantId: invite.tenantId,
        branchId: invite.branchId || 'main',
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
      toast.success('Account activated successfully! Redirecting to your dashboard...');

      // Auto-redirect to canonical role dashboard after 2 seconds
      setTimeout(() => {
        const destination = getDashboardRoute(invite.role);
        navigate(destination, { replace: true });
      }, 2000);
    } catch (err: any) {
      console.error('[StaffActivate] Account creation error:', err?.code || err?.message);
      if (err.code === 'auth/email-already-in-use') {
        toast.error('This email already has a registered account. Please sign in via Staff Login.');
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

  let stepIndex = 0;
  if (step === 'password') stepIndex = 1;
  else if (step === 'success') stepIndex = 2;

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
            const isCurrent = i === stepIndex && step !== 'error';
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

          {/* ── State: Verifying ── */}
          {step === 'verifying' && (
            <div className="flex flex-col items-center text-center space-y-4 py-6">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shadow-lg">
                <Loader2 className="w-7 h-7 text-emerald-400 animate-spin" />
              </div>
              <div className="space-y-1">
                <h2 className="text-base font-bold text-textPearl">Verifying Your Invitation</h2>
                <p className="text-xs text-slate-400">
                  Checking invitation token and credentials...
                </p>
              </div>
            </div>
          )}

          {/* ── State: Error ── */}
          {step === 'error' && (
            <div className="space-y-5 text-center py-2">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center shadow-lg">
                {errorCode === 'ALREADY_ACTIVATED' || errorCode === 'PERMISSION_DENIED' ? (
                  <ShieldAlert className="w-7 h-7 text-amber-400" />
                ) : errorCode === 'EXPIRED' ? (
                  <Clock className="w-7 h-7 text-amber-400" />
                ) : (
                  <AlertTriangle className="w-7 h-7 text-red-400" />
                )}
              </div>

              <div className="space-y-1.5">
                <h2 className="text-base font-bold text-textPearl">
                  {errorCode === 'ALREADY_ACTIVATED' || errorCode === 'PERMISSION_DENIED'
                    ? 'Account Already Activated'
                    : errorCode === 'EXPIRED'
                    ? 'Invitation Has Expired'
                    : errorCode === 'INVALID_TOKEN'
                    ? 'Invalid Security Token'
                    : errorCode === 'NOT_FOUND'
                    ? 'Invitation Not Found'
                    : 'Invalid Invitation'}
                </h2>
                <p className="text-xs text-slate-400 leading-relaxed max-w-xs mx-auto">
                  {errorMessage || 'This invitation link could not be verified.'}
                </p>
              </div>

              <div className="pt-2 space-y-2.5">
                {errorCode === 'ALREADY_ACTIVATED' || errorCode === 'PERMISSION_DENIED' ? (
                  <Link to="/staff/login" className="block w-full">
                    <Button variant="primary" className="w-full">
                      Proceed to Staff Login
                    </Button>
                  </Link>
                ) : (
                  <Button
                    type="button"
                    variant="secondary"
                    className="w-full"
                    onClick={() => {
                      setStep('email');
                      setErrorCode(null);
                      setErrorMessage('');
                    }}
                  >
                    Enter Email Manually
                  </Button>
                )}

                <Link
                  to="/"
                  className="block text-center text-xs font-semibold text-slate-500 hover:text-slate-300 transition-colors pt-1"
                >
                  Return to Home
                </Link>
              </div>
            </div>
          )}

          {/* ── State: Manual Email Fallback ── */}
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

          {/* ── State: Password Creation ── */}
          {step === 'password' && invite && (
            <form onSubmit={handleActivation} className="space-y-5">
              <div className="space-y-1 text-center pb-1">
                <h2 className="text-base font-bold text-emerald-400">Welcome, {invite.fullName}!</h2>
                <p className="text-[11px] text-slate-500 font-semibold leading-relaxed">
                  You've been invited as <strong className="text-slate-300 capitalize">{invite.role}</strong>. Set a password to activate your account.
                </p>
              </div>

              {/* Invite summary chip */}
              <div className="bg-emerald-500/8 border border-emerald-500/20 rounded-xl p-3 space-y-1.5">
                <div className="flex items-center space-x-2">
                  <Mail className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span className="text-[11px] font-semibold text-emerald-300 truncate">{invite.email}</span>
                </div>
                {invite.restaurantName && (
                  <div className="flex items-center space-x-2 pt-1 border-t border-emerald-500/10">
                    <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="text-[10px] text-slate-400 truncate">{invite.restaurantName}</span>
                  </div>
                )}
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
                onClick={() => {
                  setStep('email');
                  setInvite(null);
                  setPassword('');
                  setConfirmPassword('');
                }}
                className="w-full text-center text-[10px] font-bold text-slate-500 hover:text-textPearl transition-colors pt-1"
              >
                ← Use a Different Email
              </button>
            </form>
          )}

          {/* ── State: Success ── */}
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
                <div className="h-full bg-emerald-500 rounded-full animate-pulse" />
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
