import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { motion } from 'framer-motion';

// UI Kit components
import Card from '../../components/ui/Card/Card';
import Button from '../../components/ui/Button/Button';

// Lucide icons
import { 
  Sun, 
  Moon, 
  ChefHat, 
  ShoppingBag, 
  TrendingUp, 
  SlidersHorizontal,
  ChevronDown
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const { user, loginAsMockRole, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [showSwitcher, setShowSwitcher] = useState(false);

  const handleRoleSelect = (role: any, path: string) => {
    loginAsMockRole(role, 'gourmet-palace-saas');
    navigate(path);
  };

  // Continue as customer handles redirection based on auth status
  const handleCustomerContinue = () => {
    if (user && user.role === 'customer') {
      navigate('/customer/home');
    } else {
      navigate('/customer/login');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between relative overflow-hidden select-none">
      {/* Background gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] rounded-full bg-primary/10 blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-emerald-500/5 blur-[150px] pointer-events-none" />

      {/* HEADER */}
      <header className="w-full max-w-7xl mx-auto px-6 py-4 flex items-center justify-between z-20">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-primary/10 border border-primary/20 rounded-xl flex items-center justify-center shadow-lg">
            <span className="text-primary font-display font-extrabold text-lg">R</span>
          </div>
          <span className="font-display font-bold text-sm tracking-wide text-textPearl">RestaurantOS</span>
        </div>

        {/* Desktop Navbar */}
        <nav className="hidden md:flex items-center space-x-6 text-xs font-bold text-slate-400">
          <a href="#" className="hover:text-primary transition-colors">Home</a>
          <a href="#" className="hover:text-primary transition-colors">Features</a>
          <a href="#" className="hover:text-primary transition-colors">Pricing</a>
          <a href="#" className="hover:text-primary transition-colors">About</a>
          <a href="#" className="hover:text-primary transition-colors">Contact</a>
        </nav>

        {/* Controls */}
        <div className="flex items-center space-x-3">
          <button 
            onClick={toggleTheme}
            className="p-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-400 hover:text-primary hover:bg-slate-850 transition-all"
            title="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          
          {user ? (
            <div className="flex items-center space-x-2">
              <span className="text-[10px] text-slate-400 font-bold hidden sm:inline">{user.displayName}</span>
              <button 
                onClick={logout}
                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-850 border border-slate-800 rounded-xl text-[10px] font-bold uppercase transition-all"
              >
                Logout
              </button>
            </div>
          ) : null}
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main className="w-full max-w-6xl mx-auto px-6 py-12 flex flex-col items-center justify-center flex-1 z-10 space-y-12">
        {/* Hero Copy */}
        <div className="text-center space-y-4 max-w-xl">
          <h1 className="text-4xl md:text-5xl font-display font-extrabold tracking-tight text-textPearl leading-tight">
            Welcome to <span className="text-primary">RestaurantOS</span>
          </h1>
          <p className="text-sm md:text-base text-mutedAsh font-semibold leading-relaxed">
            One Platform. Two Experiences.<br />
            <span className="text-slate-400">Choose how you'd like to continue.</span>
          </p>
        </div>

        {/* Dual Cards Column/Row */}
        <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl pt-4">
          
          {/* B2C Dynamic diner card */}
          <motion.div 
            whileHover={{ y: -6 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="h-full p-8 border-slate-850 bg-slate-900/40 hover:border-primary/30 transition-all flex flex-col justify-between space-y-6 rounded-3xl relative overflow-hidden text-left">
              <div className="space-y-4">
                <div className="w-12 h-12 bg-primary/10 border border-primary/20 rounded-2xl flex items-center justify-center shadow-lg shadow-primary/5">
                  <ShoppingBag className="w-6 h-6 text-primary" />
                </div>
                <div className="space-y-1.5">
                  <h2 className="text-xl font-display font-extrabold text-textPearl">ORDER FOOD</h2>
                  <p className="text-xs text-mutedAsh leading-relaxed font-semibold">
                    Browse restaurants, scan QR codes, explore menus, place orders, track your food, and enjoy a seamless dining experience.
                  </p>
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-slate-850/60">
                <Button 
                  onClick={handleCustomerContinue}
                  className="w-full flex items-center justify-center space-x-1"
                >
                  <span>Continue as Customer</span>
                </Button>
                <div className="text-center text-[10px] text-slate-500 font-semibold">
                  Already have an account?{' '}
                  <Link to="/customer/login" className="text-primary hover:underline font-bold">
                    Sign In
                  </Link>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* B2B Dynamic merchant card */}
          <motion.div 
            whileHover={{ y: -6 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="h-full p-8 border-slate-850 bg-slate-900/40 hover:border-emerald-500/30 transition-all flex flex-col justify-between space-y-6 rounded-3xl relative overflow-hidden text-left">
              <div className="space-y-4">
                <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/5">
                  <ChefHat className="w-6 h-6 text-emerald-500" />
                </div>
                <div className="space-y-1.5">
                  <h2 className="text-xl font-display font-extrabold text-textPearl">GROW YOUR RESTAURANT</h2>
                  <p className="text-xs text-mutedAsh leading-relaxed font-semibold">
                    Digitize your restaurant with RestaurantOS. Manage menus, QR ordering, kitchen operations, waiters, analytics, inventory, billing, and staff—all from one platform.
                  </p>
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-slate-850/60">
                <Button 
                  onClick={() => navigate('/register')}
                  className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 flex items-center justify-center space-x-1"
                >
                  <span>Create Restaurant</span>
                </Button>
                
                <div className="space-y-2.5 text-center pt-2 border-t border-dashed border-slate-800/30">
                  <p className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wide">Already part of a restaurant?</p>
                  <Button
                    onClick={() => navigate('/staff/login')}
                    className="w-full border border-slate-850 hover:border-slate-800 bg-slate-950/45 hover:bg-slate-900/60 text-slate-350 hover:text-textPearl"
                  >
                    <span>Staff Sign In</span>
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>

        {/* Collapsible Switchboard (Role testing panel) */}
        <div className="w-full max-w-4xl pt-6 text-left">
          <button
            onClick={() => setShowSwitcher(!showSwitcher)}
            className="flex items-center space-x-1.5 text-xs text-slate-500 hover:text-slate-350 transition-colors font-bold uppercase select-none cursor-pointer"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Developer Switchboard</span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showSwitcher ? 'rotate-180' : ''}`} />
          </button>

          {showSwitcher && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-4 overflow-hidden"
            >
              {/* Customer QR Ordering */}
              <div className="glass-panel p-4 rounded-xl border-slate-850 flex flex-col justify-between text-xs">
                <div>
                  <h3 className="font-bold text-textPearl">Customer QR Order</h3>
                  <p className="text-slate-500 mt-0.5 mb-3">Simulate table-side QR ordering at Table 3.</p>
                </div>
                <Link to="/r/gourmet-palace-saas/table/3" className="w-full text-center px-3 py-1.5 border border-slate-800 hover:border-primary text-slate-350 hover:text-primary font-bold rounded-lg transition-all">
                  Scan Table QR
                </Link>
              </div>

              {/* Waiter Portal */}
              <div className="glass-panel p-4 rounded-xl border-slate-850 flex flex-col justify-between text-xs">
                <div>
                  <h3 className="font-bold text-textPearl">Waiter Dashboard</h3>
                  <p className="text-slate-500 mt-0.5 mb-3">Monitor active table matrices and diner alerts.</p>
                </div>
                <button onClick={() => handleRoleSelect('waiter', '/dashboard/waiter')} className="w-full px-3 py-1.5 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-300 hover:text-primary font-bold rounded-lg transition-all">
                  Enter Waiter Panel
                </button>
              </div>

              {/* Kitchen Queue */}
              <div className="glass-panel p-4 rounded-xl border-slate-850 flex flex-col justify-between text-xs">
                <div>
                  <h3 className="font-bold text-textPearl">Kitchen Workspace</h3>
                  <p className="text-slate-500 mt-0.5 mb-3">Manage incoming preparation tickets.</p>
                </div>
                <button onClick={() => handleRoleSelect('kitchen', '/dashboard/kitchen')} className="w-full px-3 py-1.5 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-300 hover:text-primary font-bold rounded-lg transition-all">
                  Enter Kitchen Panel
                </button>
              </div>

              {/* Owner Dashboard */}
              <div className="glass-panel p-4 rounded-xl border-slate-850 flex flex-col justify-between text-xs">
                <div>
                  <h3 className="font-bold text-textPearl">Restaurant Owner</h3>
                  <p className="text-slate-500 mt-0.5 mb-3">Check monthly revenue graphs and inventory levels.</p>
                </div>
                <button onClick={() => handleRoleSelect('owner', '/dashboard/owner')} className="w-full px-3 py-1.5 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-300 hover:text-primary font-bold rounded-lg transition-all">
                  Enter Owner Panel
                </button>
              </div>

              {/* Admin Portal */}
              <div className="glass-panel p-4 rounded-xl border-slate-850 flex flex-col justify-between text-xs">
                <div>
                  <h3 className="font-bold text-textPearl">Branch Manager</h3>
                  <p className="text-slate-500 mt-0.5 mb-3">Check audit trails and branches configurations.</p>
                </div>
                <button onClick={() => handleRoleSelect('admin', '/dashboard/admin')} className="w-full px-3 py-1.5 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-300 hover:text-primary font-bold rounded-lg transition-all">
                  Enter Admin Panel
                </button>
              </div>

              {/* Super Admin Dashboard */}
              <div className="glass-panel p-4 rounded-xl border-slate-850 flex flex-col justify-between text-xs">
                <div>
                  <h3 className="font-bold text-textPearl">Super Admin SaaS</h3>
                  <p className="text-slate-500 mt-0.5 mb-3">Check MRR run rates and features access.</p>
                </div>
                <button onClick={() => handleRoleSelect('super-admin', '/super-admin')} className="w-full px-3 py-1.5 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-300 hover:text-primary font-bold rounded-lg transition-all">
                  Enter SaaS Admin
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </main>

      {/* FOOTER */}
      <footer className="w-full border-t border-slate-900 bg-slate-950/60 z-20">
        <div className="max-w-7xl mx-auto px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-[10px] font-bold text-slate-500">
          <div>
            <span>&copy; {new Date().getFullYear()} RestaurantOS. All rights reserved.</span>
          </div>
          <div className="flex space-x-4">
            <a href="#" className="hover:text-slate-350 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-slate-350 transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-slate-350 transition-colors">Support Desk</a>
            <a href="#" className="hover:text-slate-350 transition-colors">Contact US</a>
          </div>
          <div>
            <span>Build Version: v1.3.0</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
export default LandingPage;
