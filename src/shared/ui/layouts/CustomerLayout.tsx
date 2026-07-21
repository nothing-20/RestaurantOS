import React, { useState, useRef, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { Coffee, Calendar, User, Bell, Check, QrCode, X, Camera, ShieldAlert } from 'lucide-react';
import toast from 'react-hot-toast';

interface INotification {
  id: string;
  category: string;
  title: string;
  desc: string;
  timestamp: string;
  read: boolean;
}

export const CustomerLayout: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Notification and QR states
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isQrScannerOpen, setIsQrScannerOpen] = useState(false);
  
  const notificationRef = useRef<HTMLDivElement>(null);

  // High fidelity customer notifications matching the 8 required types
  const [notifications, setNotifications] = useState<INotification[]>([
    { id: '1', category: 'Booking Confirmation', title: 'Booking Accepted', desc: 'Reservation RES-82739 has been accepted by Osteria Francescana.', timestamp: '5m ago', read: false },
    { id: '2', category: 'Booking Status', title: 'Booking Rejected', desc: 'Your reservation request at Cafe Bistro was declined due to fully booked status.', timestamp: '20m ago', read: false },
    { id: '3', category: 'Booking Status', title: 'Booking Reminder', desc: 'Reminder: Your dinner table at L\'Ambroisie is in 2 hours (8:30 PM).', timestamp: '1h ago', read: false },
    { id: '4', category: 'Booking Status', title: 'Table Ready', desc: 'Your reserved Window Seat table is ready at Shuko Sushi!', timestamp: '2h ago', read: true },
    { id: '5', category: 'Booking Status', title: 'Food Ready', desc: 'Your pre-ordered Omakase sushi platter is ready to serve.', timestamp: '3h ago', read: true },
    { id: '6', category: 'Offer Notification', title: 'Exclusive Offer Alert', desc: 'Flat 20% discount coupon applied successfully to your account.', timestamp: '5h ago', read: true },
    { id: '7', category: 'Restaurant Announcement', title: 'Restaurant Message', desc: 'Chef Sarah Jenkins sent a custom greeting message to your inbox.', timestamp: '1d ago', read: true },
    { id: '8', category: 'System Notification', title: 'Payment Complete', desc: 'Digital checkout invoice of ₹3,450.00 settled over RestaurantOS Pay.', timestamp: '2d ago', read: true }
  ]);

  const unreadCount = notifications.filter(n => !n.read).length;

  // Close notifications on click outside or Escape
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (notificationRef.current && !notificationRef.current.contains(target)) {
        setIsNotificationOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsNotificationOpen(false);
        setIsQrScannerOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Close notifications and scanner on route changes
  useEffect(() => {
    setIsNotificationOpen(false);
    setIsQrScannerOpen(false);
  }, [location.pathname]);

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    toast.success('All notifications marked as read');
  };

  // QR Validation Scan handler
  const handleScanSimulation = (tenantId: string, tableId: string, token: string) => {
    // 1. Validate QR Token format
    if (!token || token.length < 6) {
      toast.error('Invalid QR Token signature.');
      return;
    }
    // 2. Validate Restaurant / Branch / Table params
    if (!tenantId || !tableId) {
      toast.error('Could not map scanned table to any active branch.');
      return;
    }
    
    setIsQrScannerOpen(false);
    toast.success(`Table QR Verified! Opening session for ${tableId.replace('TBL-', 'Table ')}...`, { icon: '🍽️' });
    
    // Redirect to digital ordering portal session page
    navigate(`/r/${tenantId}/table/${tableId}`);
  };

  return (
    <div className="min-h-screen w-full bg-slate-950 flex flex-col font-sans antialiased relative select-none">
      
      {/* Ambient background glows */}
      <div className="absolute top-[10%] left-[10%] w-[350px] h-[350px] rounded-full bg-primary/5 blur-[120px] pointer-events-none z-0" />
      <div className="absolute bottom-[10%] right-[10%] w-[350px] h-[350px] rounded-full bg-orange-500/5 blur-[120px] pointer-events-none z-0" />

      {/* TOP APP BAR */}
      <header className="bg-slate-950/90 border-b border-slate-900/60 sticky top-0 z-40 backdrop-blur-md px-4 py-3.5 shrink-0 flex items-center justify-between md:px-8 relative z-10">
        
        {/* LEFT: Branding & Logo & Desktop Navigation */}
        <div className="flex items-center space-x-6 shrink-0">
          <div className="flex items-center space-x-2.5 cursor-pointer" onClick={() => navigate('/customer/home')}>
            <div className="w-8 h-8 bg-primary/10 border border-primary/20 rounded-lg flex items-center justify-center shadow shadow-primary/5">
              <span className="text-primary font-display font-extrabold text-lg">R</span>
            </div>
            <div>
              <h1 className="text-xs font-display font-extrabold text-white tracking-wide uppercase">RestaurantOS</h1>
            </div>
          </div>

          {/* Desktop Navigation links */}
          <nav className="hidden md:flex items-center space-x-1">
            <NavLink
              to="/customer/home"
              className={({ isActive }) => `px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${isActive ? 'text-primary bg-primary/10' : 'text-slate-400 hover:text-slate-200'}`}
            >
              Home
            </NavLink>
            <NavLink
              to="/customer/booking"
              className={({ isActive }) => `px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${isActive ? 'text-primary bg-primary/10' : 'text-slate-400 hover:text-slate-200'}`}
            >
              Book Table
            </NavLink>
            <NavLink
              to="/customer/profile"
              className={({ isActive }) => `px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${isActive ? 'text-primary bg-primary/10' : 'text-slate-400 hover:text-slate-200'}`}
            >
              Profile
            </NavLink>
          </nav>
        </div>

        {/* RIGHT: Notifications bell, Profile Avatar, and Desktop QR trigger */}
        <div className="flex items-center space-x-3.5 shrink-0">
          
          {/* Desktop QR Scan button */}
          <button
            onClick={() => setIsQrScannerOpen(true)}
            className="hidden md:flex px-4 py-2 bg-primary hover:bg-amber-500 text-slate-950 font-extrabold text-xs rounded-xl transition-all shadow shadow-primary/5 items-center gap-1.5"
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>QR Scan</span>
          </button>

          {/* Notification Bell */}
          <div className="relative" ref={notificationRef}>
            <button 
              onClick={() => setIsNotificationOpen(!isNotificationOpen)}
              className={`p-2 rounded-xl text-slate-450 hover:text-white transition-all border ${
                isNotificationOpen 
                  ? 'bg-slate-900 border-primary text-primary' 
                  : 'bg-slate-900 border-slate-900 hover:border-slate-850'
              }`}
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
              )}
            </button>

            {/* Notification dropdown panel */}
            {isNotificationOpen && (
              <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-slate-900 border border-slate-850 rounded-2xl shadow-2xl z-50 text-left backdrop-blur-xl overflow-hidden">
                <div className="p-3.5 border-b border-slate-855 flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-extrabold text-white">Notifications</h4>
                    <span className="text-[8.5px] text-slate-500 font-semibold">{unreadCount} unread logs</span>
                  </div>
                  {notifications.length > 0 && (
                    <button 
                      onClick={markAllRead} 
                      className="text-[9px] text-primary font-extrabold hover:underline"
                    >
                      Mark all read
                    </button>
                  )}
                </div>

                <div className="max-h-64 overflow-y-auto divide-y divide-slate-850/40">
                  {notifications.length === 0 ? (
                    <div className="py-8 text-center text-slate-550 text-[10px]">
                      No new notifications.
                    </div>
                  ) : (
                    notifications.map(n => (
                      <div 
                        key={n.id} 
                        onClick={() => setNotifications(prev => prev.map(item => item.id === n.id ? { ...item, read: true } : item))}
                        className={`p-3 hover:bg-slate-955/20 transition-colors cursor-pointer flex items-start gap-2.5 relative ${
                          !n.read ? 'bg-primary/[0.01]' : ''
                        }`}
                      >
                        {!n.read && (
                          <span className="absolute top-3.5 left-1.5 w-1.5 h-1.5 bg-primary rounded-full" />
                        )}
                        <div className="flex-1 space-y-0.5 pl-1.5">
                          <div className="flex justify-between text-[7.5px] text-slate-500 font-bold uppercase">
                            <span>{n.category}</span>
                            <span>{n.timestamp}</span>
                          </div>
                          <h5 className={`text-[11px] font-bold ${!n.read ? 'text-white' : 'text-slate-400'}`}>{n.title}</h5>
                          <p className="text-[10px] text-slate-500 leading-normal">{n.desc}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Profile Avatar */}
          <button 
            onClick={() => navigate('/customer/profile')}
            className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-extrabold shadow border ${
              location.pathname === '/customer/profile'
                ? 'bg-primary/10 border-primary text-primary'
                : 'bg-slate-900 border-slate-900 text-slate-400'
            }`}
          >
            {(user?.displayName || user?.email || 'GC').substring(0, 2).toUpperCase()}
          </button>

        </div>
      </header>

      {/* OUTLET CONTAINER */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden px-4 py-6 md:px-8 relative bg-slate-950 w-full max-w-7xl mx-auto z-10">
        <Outlet />
      </main>

      {/* MOBILE BOTTOM NAVIGATION BAR (md:hidden) */}
      <div className="md:hidden h-16 bg-slate-950/80 border-t border-slate-900/80 backdrop-blur-md flex items-center justify-between px-6 z-40 shrink-0 relative">
        
        {/* HOME */}
        <NavLink
          to="/customer/home"
          className={({ isActive }) => `flex flex-col items-center justify-center w-12 h-12 transition-all ${isActive ? 'text-primary' : 'text-slate-500 hover:text-slate-350'}`}
        >
          <Coffee className="w-5 h-5 mb-0.5" />
          <span className="text-[9px] font-extrabold font-sans">Home</span>
        </NavLink>

        {/* BOOK TABLE */}
        <NavLink
          to="/customer/booking"
          className={({ isActive }) => `flex flex-col items-center justify-center w-12 h-12 transition-all ${isActive ? 'text-primary' : 'text-slate-500 hover:text-slate-350'}`}
        >
          <Calendar className="w-5 h-5 mb-0.5" />
          <span className="text-[9px] font-extrabold font-sans">Book Table</span>
        </NavLink>

        {/* FLOATING CENTER QR SCAN BUTTON */}
        <div className="relative -mt-5">
          <button
            onClick={() => setIsQrScannerOpen(true)}
            className="w-13 h-13 bg-primary hover:bg-amber-500 text-slate-950 rounded-full shadow-lg shadow-primary/20 flex items-center justify-center border-4 border-slate-950 transition-transform active:scale-95 duration-200 z-50 relative"
          >
            <QrCode className="w-6 h-6" />
          </button>
          <span className="text-[8.5px] font-extrabold text-primary block text-center mt-0.5">QR Scan</span>
        </div>

        {/* PROFILE */}
        <NavLink
          to="/customer/profile"
          className={({ isActive }) => `flex flex-col items-center justify-center w-12 h-12 transition-all ${isActive ? 'text-primary' : 'text-slate-500 hover:text-slate-350'}`}
        >
          <User className="w-5 h-5 mb-0.5" />
          <span className="text-[9px] font-extrabold font-sans">Profile</span>
        </NavLink>
        
      </div>

      {/* FULL SCREEN CAMERA VIEWFINDER OVERLAY */}
      {isQrScannerOpen && (
        <div className="fixed inset-0 bg-slate-955/95 backdrop-blur-md flex items-center justify-center p-6 z-50 overflow-hidden shadow-2xl">
          
          <button 
            onClick={() => setIsQrScannerOpen(false)}
            className="absolute top-6 right-6 p-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="w-full flex flex-col items-center space-y-6 max-w-xs text-center">
            <div className="space-y-1">
              <h3 className="text-sm font-extrabold text-white">Scan Table QR Code</h3>
              <p className="text-[10px] text-slate-500 font-medium">Position the table card QR inside the scanner viewfinder.</p>
            </div>

            {/* Viewfinder chassis */}
            <div className="w-48 h-48 border-2 border-primary/60 rounded-3xl relative overflow-hidden flex items-center justify-center bg-slate-900/20">
              {/* Laser animation */}
              <div className="absolute left-0 right-0 h-0.5 bg-primary shadow-lg shadow-primary/80 animate-bounce" />
              <Camera className="w-10 h-10 text-slate-700 animate-pulse" />
            </div>

            {/* Simulated QR Triggers */}
            <div className="w-full space-y-2">
              <span className="text-[9px] text-slate-500 font-extrabold uppercase tracking-wider block">Verify Onboarded Tables</span>
              <div className="grid grid-cols-1 gap-1.5">
                <button
                  onClick={() => handleScanSimulation('l-ambroisie', 'TBL-4', 'QR-TOKEN-LA-4')}
                  className="py-2.5 bg-slate-900 border border-slate-850 rounded-xl text-[10px] text-slate-300 hover:text-primary font-bold transition-all text-left px-3.5 flex justify-between"
                >
                  <span>L'Ambroisie (Table 4)</span>
                  <span className="text-primary font-extrabold">Simulate Scan</span>
                </button>
                <button
                  onClick={() => handleScanSimulation('shuko', 'TBL-2', 'QR-TOKEN-SK-2')}
                  className="py-2.5 bg-slate-900 border border-slate-850 rounded-xl text-[10px] text-slate-300 hover:text-primary font-bold transition-all text-left px-3.5 flex justify-between"
                >
                  <span>Shuko Sushi (Table 2)</span>
                  <span className="text-primary font-extrabold">Simulate Scan</span>
                </button>
                <button
                  onClick={() => handleScanSimulation('osteria', 'TBL-5', 'QR-TOKEN-OS-5')}
                  className="py-2.5 bg-slate-900 border border-slate-855 rounded-xl text-[10px] text-slate-300 hover:text-primary font-bold transition-all text-left px-3.5 flex justify-between"
                >
                  <span>Osteria Francescana (Table 5)</span>
                  <span className="text-primary font-extrabold">Simulate Scan</span>
                </button>
              </div>
            </div>

          </div>

        </div>
      )}

    </div>
  );
};

export default CustomerLayout;
