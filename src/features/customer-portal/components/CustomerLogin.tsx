import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { authService } from '../../../services/authService';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { zodResolver } from '../../../utils/zodResolver';

// UI Kit components
import Card from '../../../components/ui/Card/Card';
import Input from '../../../components/ui/Input/Input';
import Button from '../../../components/ui/Button/Button';

// Hot Toast notifications
import toast from 'react-hot-toast';
import { ShoppingBag, KeyRound, ShieldAlert } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters')
});

type TLoginForm = z.infer<typeof loginSchema>;

export const CustomerLogin: React.FC = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorState, setErrorState] = useState<{ message: string; showRegister: boolean } | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<TLoginForm>({
    resolver: zodResolver(loginSchema)
  });

  const onSubmit = async (data: TLoginForm) => {
    setIsSubmitting(true);
    setErrorState(null);
    try {
      // 1. Submit login to Firebase Auth
      const credentials = await authService.signInWithEmail(data.email, data.password, true);
      const fUser = credentials.user;

      // 2. Fetch Firestore user profile doc to ensure role is customer
      const userDocRef = doc(db, 'users', fUser.uid);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists() || userDoc.data().role !== 'customer') {
        setErrorState({
          message: 'Account not found',
          showRegister: true
        });
        await authService.signOutUser();
        return;
      }

      toast.success('Signed in successfully!');
      navigate('/customer/restaurants');
    } catch (e: any) {
      console.error(e);
      let errMsg = e.message || 'Login failed. Please verify credentials.';
      let isNotFound = false;

      if (e.code === 'auth/user-not-found' || e.message?.toLowerCase().includes('user not found')) {
        errMsg = 'Account not found';
        isNotFound = true;
      } else if (e.code === 'auth/wrong-password') {
        errMsg = 'Incorrect password. Please try again.';
      } else if (e.code === 'auth/invalid-credential') {
        errMsg = 'Account not found or invalid credentials.';
        isNotFound = true;
      } else if (e.code === 'auth/network-request-failed') {
        errMsg = 'Network error. Please check your connection.';
      }

      setErrorState({
        message: errMsg,
        showRegister: isNotFound || e.code === 'auth/user-not-found' || e.code === 'auth/invalid-credential'
      });
      toast.error(errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-left relative overflow-hidden select-none">
      <div className="absolute top-[-10%] w-[500px] h-[500px] rounded-full bg-primary/10 blur-[130px] pointer-events-none" />
      
      <Card className="max-w-md w-full p-8 border-slate-850 bg-slate-900/40 relative z-10">
        <div className="space-y-2 text-center mb-6">
          <div className="w-12 h-12 bg-primary/10 border border-primary/20 rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-primary/5">
            <ShoppingBag className="w-6 h-6 text-primary" />
          </div>
          <h1 className="text-xl font-display font-extrabold text-textPearl">Diner Sign In</h1>
          <p className="text-xs text-mutedAsh font-semibold">Sign in to check recent orders and save dining profiles.</p>
        </div>

        {errorState && (
          <div className="p-3.5 bg-red-950/20 border border-red-900/40 rounded-xl flex flex-col space-y-2 text-xs text-red-400 font-semibold mb-4">
            <div className="flex items-start space-x-2">
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorState.message}</span>
            </div>
            {errorState.showRegister && (
              <div className="pt-2 border-t border-red-900/20 flex justify-end">
                <Button 
                  size="xs" 
                  onClick={() => navigate('/customer/register')}
                  className="bg-red-500 hover:bg-red-600 text-slate-950 text-[10px] py-1 px-3 font-bold"
                >
                  Register Account
                </Button>
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Email Address"
            type="email"
            placeholder="diner@gmail.com"
            error={errors.email?.message}
            disabled={isSubmitting}
            {...register('email')}
          />

          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
            error={errors.password?.message}
            disabled={isSubmitting}
            {...register('password')}
          />

          <div className="flex justify-between items-center text-xs pt-1">
            <label className="flex items-center space-x-2 text-slate-400 font-semibold cursor-pointer">
              <input type="checkbox" className="rounded bg-slate-955 border-slate-800 focus:ring-primary text-primary" />
              <span>Remember me</span>
            </label>
            <Link to="/forgot-password" className="text-primary hover:underline font-semibold">
              Forgot password?
            </Link>
          </div>

          <Button
            type="submit"
            className="w-full mt-4"
            isLoading={isSubmitting}
          >
            Sign In as Customer
          </Button>
        </form>

        <div className="text-center mt-6 pt-4 border-t border-slate-850 text-xs text-slate-400 font-semibold space-y-2">
          <p>
            New to RestaurantOS?{' '}
            <Link to="/customer/register" className="text-primary hover:underline font-bold">
              Register Customer Account
            </Link>
          </p>
          <p>
            <Link to="/" className="text-slate-500 hover:text-slate-350 transition-colors">
              ← Back to choosing experience
            </Link>
          </p>
        </div>
      </Card>
    </div>
  );
};
export default CustomerLogin;
