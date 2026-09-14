import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { getDashboardRoute } from '../../utils/navigation';
import { motion } from 'framer-motion';

// Lucide icons
import { 
  Sun, 
  Moon, 
  ChefHat, 
  ShoppingBag, 
  TrendingUp, 
  SlidersHorizontal,
  ChevronDown,
  Sparkles,
  Layers,
  Users,
  ShieldCheck
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [showSwitcher, setShowSwitcher] = useState(false);

  const handlePortalNavigate = (path: string) => {
    navigate(path);
  };

  // Continue as customer handles redirection strictly for customer role
  const handleCustomerContinue = () => {
    if (user && user.role === 'customer') {
      navigate('/customer/home');
    } else {
      navigate('/customer/login');
    }
  };

  return (
    <div className="min-h-screen bg-[#FCFAF7] text-[#171A1D] flex flex-col justify-between relative overflow-hidden select-none font-sans">
      {/* Decorative ambient background accents */}
      <div className="absolute top-[-5%] left-[-5%] w-[450px] h-[450px] rounded-full bg-[#FBE9E3]/50 blur-[120px] pointer-events-none" />
      <div className="absolute top-[20%] right-[-5%] w-[400px] h-[400px] rounded-full bg-[#E6F5EF]/40 blur-[130px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[25%] w-[500px] h-[500px] rounded-full bg-[#F2E7DC]/40 blur-[140px] pointer-events-none" />

      {/* Decorative subtle culinary vector graphics on sides (hidden on mobile, non-intrusive) */}
      <div className="absolute left-[-20px] top-1/3 w-32 h-32 opacity-25 pointer-events-none hidden lg:block">
        <svg viewBox="0 0 100 100" fill="none" className="w-full h-full text-[#C9573D]">
          <circle cx="50" cy="50" r="46" stroke="currentColor" strokeWidth="2" strokeDasharray="4 4" />
          <circle cx="50" cy="50" r="36" stroke="currentColor" strokeWidth="1.5" />
          <path d="M50 22 C34 22 28 36 28 50 C28 64 34 78 50 78 C66 78 72 64 72 50 C72 36 66 22 50 22 Z" fill="#FBE9E3" fillOpacity="0.5" />
        </svg>
      </div>
      <div className="absolute right-[-20px] top-1/3 w-32 h-32 opacity-25 pointer-events-none hidden lg:block">
        <svg viewBox="0 0 100 100" fill="none" className="w-full h-full text-[#147A5A]">
          <circle cx="50" cy="50" r="46" stroke="currentColor" strokeWidth="2" strokeDasharray="4 4" />
          <circle cx="50" cy="50" r="36" stroke="currentColor" strokeWidth="1.5" />
          <path d="M50 26 C40 38 40 62 50 74 C60 62 60 38 50 26 Z" fill="#E6F5EF" fillOpacity="0.6" />
        </svg>
      </div>

      {/* 1. TOP NAVIGATION */}
      <header className="w-full max-w-7xl mx-auto px-6 py-5 flex items-center justify-between z-20 border-b border-[#E8DED5]/60">
        {/* Left side: Logo & Tagline */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-[#FBE9E3] border border-[#F5CBC4] rounded-xl flex items-center justify-center shadow-xs">
            <ChefHat className="w-5 h-5 text-[#C9573D]" />
          </div>
          <div>
            <span className="font-display font-extrabold text-lg tracking-tight text-[#171A1D]">
              Restaurant<span className="text-[#C9573D]">OS</span>
            </span>
            <p className="text-[10px] font-semibold text-[#8A817A] hidden sm:block leading-none mt-0.5">
              Smart Dining. Smarter Business.
            </p>
          </div>
        </div>

        {/* Center navigation */}
        <nav className="hidden md:flex items-center space-x-8 text-xs font-bold text-[#5F6670]">
          <a href="#" className="text-[#C9573D] relative py-1">
            Home
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#C9573D] rounded-full" />
          </a>
          <a href="#features" className="hover:text-[#C9573D] transition-colors">Features</a>
          <a href="#pricing" className="hover:text-[#C9573D] transition-colors">Pricing</a>
          <a href="#about" className="hover:text-[#C9573D] transition-colors">About</a>
          <a href="#contact" className="hover:text-[#C9573D] transition-colors">Contact</a>
        </nav>

        {/* Right side controls */}
        <div className="flex items-center space-x-3">
          <button 
            onClick={toggleTheme}
            className="p-2.5 bg-[#F2E7DC] border border-[#E8DED5] rounded-xl text-[#171A1D] hover:bg-[#E8DED5] transition-all shadow-2xs"
            title="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-[#C9573D]" /> : <Moon className="w-4 h-4 text-[#171A1D]" />}
          </button>
          
          {user ? (
            <div className="flex items-center space-x-2">
              <span className="text-[11px] text-[#5F6670] font-bold hidden sm:inline">{user.displayName || user.email} ({user.role})</span>
              <button
                onClick={() => navigate(getDashboardRoute(user.role))}
                className="px-3.5 py-2 bg-[#FBE9E3] hover:bg-[#F8D5CB] border border-[#F5CBC4] text-[#C9573D] rounded-xl text-xs font-bold uppercase transition-all shadow-2xs"
              >
                Go to Dashboard
              </button>
              <button 
                onClick={logout}
                className="px-3.5 py-2 bg-[#F2E7DC] hover:bg-[#E8DED5] border border-[#E8DED5] text-[#171A1D] rounded-xl text-xs font-bold uppercase transition-all"
              >
                Logout
              </button>
            </div>
          ) : null}
        </div>
      </header>

      {/* 2. MAIN CONTENT AREA */}
      <main className="w-full max-w-6xl mx-auto px-6 py-12 md:py-16 flex flex-col items-center justify-center flex-1 z-10 space-y-12">
        
        {/* HERO SECTION */}
        <div className="text-center space-y-4 max-w-2xl">
          {/* Eyebrow badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#F2E7DC]/80 border border-[#E8DED5] text-[11px] font-extrabold uppercase tracking-wider text-[#8A817A]">
            <Sparkles className="w-3.5 h-3.5 text-[#C9573D]" />
            <span>ALL YOUR RESTAURANT OPERATIONS, ONE PLATFORM</span>
          </div>

          {/* Main Heading */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-display font-extrabold tracking-tight text-[#171A1D] leading-[1.12]">
            Welcome to <span className="text-[#C9573D]">RestaurantOS</span>
          </h1>

          {/* Subtitle */}
          <div className="space-y-1 pt-1">
            <p className="text-base sm:text-lg font-bold text-[#171A1D]">
              One Platform. Two Experiences.
            </p>
            <p className="text-sm sm:text-base text-[#5F6670] font-normal leading-relaxed">
              Choose how you'd like to continue.
            </p>
          </div>
        </div>

        {/* 4. TWO MAIN EXPERIENCE CARDS */}
        <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl pt-2">
          
          {/* Card 1: ORDER FOOD (Customer experience) */}
          <motion.div 
            whileHover={{ y: -4 }}
            transition={{ duration: 0.2 }}
            className="h-full"
          >
            <div className="h-full p-8 md:p-10 bg-white border border-[#E8DED5] hover:border-[#C9573D]/40 transition-all flex flex-col justify-between space-y-6 rounded-[24px] shadow-sm hover:shadow-md relative overflow-hidden text-left">
              <div className="space-y-4">
                {/* Icon area: Soft terracotta background */}
                <div className="w-14 h-14 bg-[#FBE9E3] border border-[#F5CBC4] rounded-2xl flex items-center justify-center shadow-2xs">
                  <ShoppingBag className="w-7 h-7 text-[#C9573D]" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-xl md:text-2xl font-display font-extrabold text-[#171A1D] tracking-tight">
                    ORDER FOOD
                  </h2>
                  <p className="text-sm text-[#5F6670] leading-relaxed font-normal">
                    Browse restaurants, scan QR codes, explore menus, place orders, track your food, and enjoy a seamless dining experience.
                  </p>
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-[#E8DED5]">
                {/* Primary button: Terracotta */}
                <button 
                  onClick={handleCustomerContinue}
                  className="w-full py-3.5 px-6 bg-[#C9573D] hover:bg-[#B94732] text-white font-bold text-sm rounded-xl flex items-center justify-center space-x-2 shadow-xs hover:shadow transition-all group"
                >
                  <span>Continue as Customer</span>
                  <span className="transition-transform group-hover:translate-x-1">→</span>
                </button>
                
                {/* Sign In link */}
                <div className="text-center text-xs text-[#5F6670] font-medium pt-1">
                  Already have an account?{' '}
                  <Link to="/customer/login" className="text-[#C9573D] hover:text-[#B94732] font-bold hover:underline">
                    Sign In
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Card 2: GROW YOUR RESTAURANT (Merchant experience) */}
          <motion.div 
            whileHover={{ y: -4 }}
            transition={{ duration: 0.2 }}
            className="h-full"
          >
            <div className="h-full p-8 md:p-10 bg-white border border-[#E8DED5] hover:border-[#147A5A]/40 transition-all flex flex-col justify-between space-y-6 rounded-[24px] shadow-sm hover:shadow-md relative overflow-hidden text-left">
              <div className="space-y-4">
                {/* Icon area: Soft green background */}
                <div className="w-14 h-14 bg-[#E6F5EF] border border-[#C6E7D8] rounded-2xl flex items-center justify-center shadow-2xs">
                  <ChefHat className="w-7 h-7 text-[#147A5A]" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-xl md:text-2xl font-display font-extrabold text-[#171A1D] tracking-tight">
                    GROW YOUR RESTAURANT
                  </h2>
                  <p className="text-sm text-[#5F6670] leading-relaxed font-normal">
                    Digitize your restaurant with RestaurantOS. Manage menus, QR ordering, kitchen operations, waiters, analytics, inventory, billing, and staff—all from one platform.
                  </p>
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-[#E8DED5]">
                {/* Primary button: Natural Green */}
                <button 
                  onClick={() => navigate('/register')}
                  className="w-full py-3.5 px-6 bg-[#147A5A] hover:bg-[#0D6048] text-white font-bold text-sm rounded-xl flex items-center justify-center space-x-2 shadow-xs hover:shadow transition-all group"
                >
                  <span>Create Restaurant</span>
                  <span className="transition-transform group-hover:translate-x-1">→</span>
                </button>
                
                {/* Already part of a restaurant block */}
                <div className="space-y-2.5 text-center pt-2">
                  <p className="text-[10px] text-[#8A817A] font-extrabold uppercase tracking-wider">
                    ALREADY PART OF A RESTAURANT?
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => navigate('/owner/login')}
                      className="w-full py-2.5 px-3 border border-[#147A5A] hover:bg-[#E6F5EF] text-[#147A5A] font-bold text-xs rounded-xl transition-all text-center"
                    >
                      OWNER SIGN IN
                    </button>
                    <button
                      onClick={() => navigate('/staff/login')}
                      className="w-full py-2.5 px-3 border border-[#171A1D] hover:bg-[#F7F1EB] text-[#171A1D] font-bold text-xs rounded-xl transition-all text-center"
                    >
                      STAFF SIGN IN
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* 5. BOTTOM VALUE PROPOSITION STRIP */}
        <div className="w-full max-w-4xl bg-white border border-[#E8DED5] rounded-2xl p-6 shadow-xs">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-left">
            <div className="flex items-start space-x-3">
              <div className="w-9 h-9 rounded-xl bg-[#FBE9E3] text-[#C9573D] flex items-center justify-center shrink-0 mt-0.5">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-[#171A1D]">More Orders</h4>
                <p className="text-[11px] text-[#8A817A] mt-0.5">Reach more customers</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="w-9 h-9 rounded-xl bg-[#E6F5EF] text-[#147A5A] flex items-center justify-center shrink-0 mt-0.5">
                <Layers className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-[#171A1D]">Smarter Operations</h4>
                <p className="text-[11px] text-[#8A817A] mt-0.5">Manage everything easily</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="w-9 h-9 rounded-xl bg-[#FBE9E3] text-[#C9573D] flex items-center justify-center shrink-0 mt-0.5">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-[#171A1D]">Happier Guests</h4>
                <p className="text-[11px] text-[#8A817A] mt-0.5">Better dining experiences</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="w-9 h-9 rounded-xl bg-[#E6F5EF] text-[#147A5A] flex items-center justify-center shrink-0 mt-0.5">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-[#171A1D]">Sustainable Growth</h4>
                <p className="text-[11px] text-[#8A817A] mt-0.5">Built for the future</p>
              </div>
            </div>
          </div>
        </div>

        {/* Developer Switchboard (Role testing panel) */}
        <div className="w-full max-w-4xl pt-2 text-left">
          <button
            onClick={() => setShowSwitcher(!showSwitcher)}
            className="flex items-center space-x-1.5 text-xs text-[#8A817A] hover:text-[#171A1D] transition-colors font-bold uppercase select-none cursor-pointer"
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
              <div className="bg-white p-4 rounded-xl border border-[#E8DED5] flex flex-col justify-between text-xs shadow-2xs">
                <div>
                  <h3 className="font-bold text-[#171A1D]">Customer QR Order</h3>
                  <p className="text-[#5F6670] mt-0.5 mb-3">Simulate table-side QR ordering at Table 3.</p>
                </div>
                <Link to="/r/gourmet-palace-saas/table/3" className="w-full text-center px-3 py-2 bg-[#F7F1EB] hover:bg-[#F2E7DC] border border-[#E8DED5] text-[#171A1D] hover:text-[#C9573D] font-bold rounded-lg transition-all">
                  Scan Table QR
                </Link>
              </div>

              {/* Waiter Portal */}
              <div className="bg-white p-4 rounded-xl border border-[#E8DED5] flex flex-col justify-between text-xs shadow-2xs">
                <div>
                  <h3 className="font-bold text-[#171A1D]">Waiter Dashboard</h3>
                  <p className="text-[#5F6670] mt-0.5 mb-3">Monitor active table matrices and diner alerts.</p>
                </div>
                <button onClick={() => handlePortalNavigate('/staff/login')} className="w-full px-3 py-2 bg-[#F7F1EB] hover:bg-[#F2E7DC] border border-[#E8DED5] text-[#171A1D] hover:text-[#C9573D] font-bold rounded-lg transition-all">
                  Staff Sign In (Waiter)
                </button>
              </div>

              {/* Kitchen Queue */}
              <div className="bg-white p-4 rounded-xl border border-[#E8DED5] flex flex-col justify-between text-xs shadow-2xs">
                <div>
                  <h3 className="font-bold text-[#171A1D]">Kitchen Workspace</h3>
                  <p className="text-[#5F6670] mt-0.5 mb-3">Manage incoming preparation tickets.</p>
                </div>
                <button onClick={() => handlePortalNavigate('/staff/login')} className="w-full px-3 py-2 bg-[#F7F1EB] hover:bg-[#F2E7DC] border border-[#E8DED5] text-[#171A1D] hover:text-[#C9573D] font-bold rounded-lg transition-all">
                  Staff Sign In (Kitchen)
                </button>
              </div>

              {/* Owner Dashboard */}
              <div className="bg-white p-4 rounded-xl border border-[#E8DED5] flex flex-col justify-between text-xs shadow-2xs">
                <div>
                  <h3 className="font-bold text-[#171A1D]">Restaurant Owner</h3>
                  <p className="text-[#5F6670] mt-0.5 mb-3">Check monthly revenue graphs and inventory levels.</p>
                </div>
                <button onClick={() => handlePortalNavigate('/owner/login')} className="w-full px-3 py-2 bg-[#F7F1EB] hover:bg-[#F2E7DC] border border-[#E8DED5] text-[#171A1D] hover:text-[#C9573D] font-bold rounded-lg transition-all">
                  Owner Sign In
                </button>
              </div>

              {/* Admin Portal */}
              <div className="bg-white p-4 rounded-xl border border-[#E8DED5] flex flex-col justify-between text-xs shadow-2xs">
                <div>
                  <h3 className="font-bold text-[#171A1D]">Branch Manager</h3>
                  <p className="text-[#5F6670] mt-0.5 mb-3">Check audit trails and branches configurations.</p>
                </div>
                <button onClick={() => handlePortalNavigate('/staff/login')} className="w-full px-3 py-2 bg-[#F7F1EB] hover:bg-[#F2E7DC] border border-[#E8DED5] text-[#171A1D] hover:text-[#C9573D] font-bold rounded-lg transition-all">
                  Staff Sign In (Admin)
                </button>
              </div>

              {/* Super Admin Dashboard */}
              <div className="bg-white p-4 rounded-xl border border-[#E8DED5] flex flex-col justify-between text-xs shadow-2xs">
                <div>
                  <h3 className="font-bold text-[#171A1D]">Super Admin SaaS</h3>
                  <p className="text-[#5F6670] mt-0.5 mb-3">Check MRR run rates and features access.</p>
                </div>
                <button onClick={() => handlePortalNavigate('/owner/login')} className="w-full px-3 py-2 bg-[#F7F1EB] hover:bg-[#F2E7DC] border border-[#E8DED5] text-[#171A1D] hover:text-[#C9573D] font-bold rounded-lg transition-all">
                  Sign In (Super Admin)
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </main>

      {/* FOOTER */}
      <footer className="w-full border-t border-[#E8DED5] bg-[#F7F1EB]/80 z-20">
        <div className="max-w-7xl mx-auto px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-medium text-[#8A817A]">
          <div>
            <span>&copy; {new Date().getFullYear()} RestaurantOS. All rights reserved.</span>
          </div>
          <div className="flex space-x-6">
            <a href="#" className="hover:text-[#171A1D] transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-[#171A1D] transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-[#171A1D] transition-colors">Support Desk</a>
            <a href="#" className="hover:text-[#171A1D] transition-colors">Contact Us</a>
          </div>
          <div>
            <span className="text-[11px] text-[#8A817A]">Build Version: v1.3.0</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
