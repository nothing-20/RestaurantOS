import React, { useState, useRef, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { Coffee, Calendar, User, Bell, Check, QrCode, X, Camera, ShieldAlert, ShoppingBag, Utensils, Compass, MapPin, Search } from 'lucide-react';
import { collection, query, onSnapshot } from 'firebase/firestore';
import { db } from '../../../config/firebase';
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

  // Real customer notifications from Firestore
  const [notifications, setNotifications] = useState<INotification[]>([]);

  useEffect(() => {
    if (!user?.uid) {
      setNotifications([]);
      return;
    }

    try {
      const notifRef = collection(db, 'users', user.uid, 'notifications');
      const unsub = onSnapshot(query(notifRef), (snap) => {
        const notifList: INotification[] = [];
        snap.forEach(d => {
          const data = d.data();
          notifList.push({
            id: d.id,
            category: data.category || 'Notification',
            title: data.title || 'Alert',
            desc: data.desc || data.description || '',
            timestamp: data.timestamp || 'Just now',
            read: !!data.read
          });
        });
        setNotifications(notifList);
      }, (err) => {
        console.error('Failed to subscribe to customer notifications:', err);
        setNotifications([]);
      });
      return () => unsub();
    } catch (e) {
      setNotifications([]);
    }
  }, [user?.uid]);

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
    <div className="min-h-screen w-full bg-[#FFFCF9] flex flex-col font-sans antialiased relative select-none">
      
      {/* Ambient warm background glow */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[300px] rounded-full bg-[#FFF8F2] blur-[100px] pointer-events-none z-0" />

      {/* TOP APP BAR */}
      <header className="bg-[#FFFCF9]/90 border-b border-[#EEE7E1] sticky top-0 z-40 backdrop-blur-md px-4 py-3 shrink-0 flex items-center justify-between md:px-8 relative z-10 shadow-xs">
        
        {/* LEFT: Branding & Logo & Desktop Navigation */}
        <div className="flex items-center space-x-6 shrink-0">
          <div className="flex items-center space-x-2.5 cursor-pointer" onClick={() => navigate('/customer/home')}>
            <div className="w-9 h-9 bg-[#E85D3F] rounded-xl flex items-center justify-center shadow-md shadow-[#E85D3F]/20">
              <span className="text-white font-display font-extrabold text-xl">R</span>
            </div>
            <div>
              <h1 className="text-sm font-display font-extrabold text-[#242424] tracking-tight">Restaurant<span className="text-[#E85D3F]">OS</span></h1>
            </div>
          </div>

          {/* Location Context Pill */}
          <div className="hidden xl:flex items-center space-x-1.5 bg-[#FFF8F2] border border-[#EEE7E1] px-3.5 py-1.5 rounded-full text-xs text-[#242424] font-medium shadow-xs">
            <MapPin className="w-3.5 h-3.5 text-[#E85D3F]" />
            <span className="font-bold text-[#242424]">Bengaluru, KA</span>
          </div>

          {/* Desktop Navigation links */}
          <nav className="hidden md:flex items-center space-x-1">
            <NavLink
              to="/customer/home"
              className={({ isActive }) => `px-4 py-1.5 rounded-full text-xs font-extrabold transition-all ${isActive ? 'text-[#E85D3F] bg-[#FFF8F2] shadow-xs' : 'text-[#6B6B6B] hover:text-[#242424]'}`}
            >
              Home
            </NavLink>
            <NavLink
              to="/customer/explore"
              className={({ isActive }) => `px-4 py-1.5 rounded-full text-xs font-extrabold transition-all ${isActive ? 'text-[#E85D3F] bg-[#FFF8F2] shadow-xs' : 'text-[#6B6B6B] hover:text-[#242424]'}`}
            >
              Explore
            </NavLink>
            <NavLink
              to="/customer/orders"
              className={({ isActive }) => `px-4 py-1.5 rounded-full text-xs font-extrabold transition-all ${isActive ? 'text-[#E85D3F] bg-[#FFF8F2] shadow-xs' : 'text-[#6B6B6B] hover:text-[#242424]'}`}
            >
              My Orders
            </NavLink>
            <NavLink
              to="/customer/booking"
              className={({ isActive }) => `px-4 py-1.5 rounded-full text-xs font-extrabold transition-all ${isActive ? 'text-[#E85D3F] bg-[#FFF8F2] shadow-xs' : 'text-[#6B6B6B] hover:text-[#242424]'}`}
            >
              Book Table
            </NavLink>
            <NavLink
              to="/customer/profile"
              className={({ isActive }) => `px-4 py-1.5 rounded-full text-xs font-extrabold transition-all ${isActive ? 'text-[#E85D3F] bg-[#FFF8F2] shadow-xs' : 'text-[#6B6B6B] hover:text-[#242424]'}`}
            >
              Profile
            </NavLink>
          </nav>
        </div>

        {/* RIGHT: Notifications bell, Profile Avatar, and Desktop QR trigger */}
        <div className="flex items-center space-x-3 shrink-0">
          
          {/* Desktop QR Scan button */}
          <button
            onClick={() => setIsQrScannerOpen(true)}
            className="hidden md:flex px-4 py-2 bg-[#E85D3F] hover:bg-[#D04B2F] text-white font-extrabold text-xs rounded-full transition-all shadow-md shadow-[#E85D3F]/20 items-center gap-1.5 cursor-pointer"
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>QR Scan</span>
          </button>

          {/* Notification Bell */}
          <div className="relative" ref={notificationRef}>
            <button 
              onClick={() => setIsNotificationOpen(!isNotificationOpen)}
              className={`p-2.5 rounded-full text-[#6B6B6B] hover:text-[#242424] transition-all border ${
                isNotificationOpen 
                  ? 'bg-[#FFF8F2] border-[#E85D3F] text-[#E85D3F]' 
                  : 'bg-white border-[#EEE7E1] hover:border-[#E85D3F]/40'
              }`}
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#E85D3F] rounded-full animate-pulse" />
              )}
            </button>

            {/* Notification dropdown panel */}
            {isNotificationOpen && (
              <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-white border border-[#EEE7E1] rounded-2xl shadow-xl z-50 text-left overflow-hidden">
                <div className="p-3.5 border-b border-[#EEE7E1] bg-[#FFF8F2] flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-extrabold text-[#242424]">Notifications</h4>
                    <span className="text-[9px] text-[#6B6B6B] font-semibold">{unreadCount} unread logs</span>
                  </div>
                  {notifications.length > 0 && (
                    <button 
                      onClick={markAllRead}
                      className="text-[9px] text-[#E85D3F] font-bold hover:underline"
                    >
                      Clear All
                    </button>
                  )}
                </div>

                <div className="max-h-72 overflow-y-auto divide-y divide-[#EEE7E1]">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-xs text-[#6B6B6B] font-medium">
                      No notifications yet.
                    </div>
                  ) : (
                    notifications.map(n => (
                      <div key={n.id} className="p-3.5 hover:bg-[#FFF8F2]/60 transition-colors">
                        <h5 className="text-xs font-bold text-[#242424]">{n.title}</h5>
                        <p className="text-[10.5px] text-[#6B6B6B] mt-0.5">{n.desc}</p>
                        <span className="text-[8.5px] text-[#999999] mt-1 block">
                          {n.timestamp}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Profile Avatar Trigger */}
          <button
            onClick={() => navigate('/customer/profile')}
            className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-extrabold transition-all border ${
              location.pathname === '/customer/profile'
                ? 'bg-[#E85D3F] text-white border-[#E85D3F]'
                : 'bg-[#FFF8F2] text-[#E85D3F] border-[#EEE7E1] hover:border-[#E85D3F]/40'
            }`}
          >
            {(user?.displayName || user?.email || 'GC').substring(0, 2).toUpperCase()}
          </button>

        </div>
      </header>

      <main className="flex-1 overflow-y-auto overflow-x-hidden px-4 py-6 md:px-8 relative bg-[#FFFCF9] w-full max-w-7xl mx-auto z-10">
        <Outlet />
      </main>

      {/* MOBILE BOTTOM NAVIGATION BAR (md:hidden) */}
      <div className="md:hidden h-16 bg-[#FFF8F2]/95 border-t border-[#EEE7E1] backdrop-blur-md flex items-center justify-between px-4 z-40 shrink-0 relative">
        
        {/* HOME */}
        <NavLink
          to="/customer/home"
          className={({ isActive }) => `flex flex-col items-center justify-center w-11 h-12 transition-all ${isActive ? 'text-[#E85D3F]' : 'text-[#6B6B6B] hover:text-[#242424]'}`}
        >
          <Coffee className="w-4.5 h-4.5 mb-0.5" />
          <span className="text-[8.5px] font-extrabold font-sans">Home</span>
        </NavLink>

        {/* EXPLORE */}
        <NavLink
          to="/customer/explore"
          className={({ isActive }) => `flex flex-col items-center justify-center w-11 h-12 transition-all ${isActive ? 'text-[#E85D3F]' : 'text-[#6B6B6B] hover:text-[#242424]'}`}
        >
          <Compass className="w-4.5 h-4.5 mb-0.5" />
          <span className="text-[8.5px] font-extrabold font-sans">Explore</span>
        </NavLink>

        {/* FLOATING CENTER QR SCAN BUTTON */}
        <div className="relative -mt-5">
          <button
            onClick={() => setIsQrScannerOpen(true)}
            className="w-12 h-12 bg-[#E85D3F] hover:bg-[#D04B2F] text-white rounded-full shadow-lg shadow-[#E85D3F]/30 flex items-center justify-center border-4 border-[#FFFCF9] transition-transform active:scale-95 duration-200 z-50 relative cursor-pointer"
          >
            <QrCode className="w-5 h-5" />
          </button>
          <span className="text-[8px] font-extrabold text-[#E85D3F] block text-center mt-0.5">QR Scan</span>
        </div>

        {/* ORDERS */}
        <NavLink
          to="/customer/orders"
          className={({ isActive }) => `flex flex-col items-center justify-center w-11 h-12 transition-all ${isActive ? 'text-[#E85D3F]' : 'text-[#6B6B6B] hover:text-[#242424]'}`}
        >
          <Utensils className="w-4.5 h-4.5 mb-0.5" />
          <span className="text-[8.5px] font-extrabold font-sans">Orders</span>
        </NavLink>

        {/* PROFILE */}
        <NavLink
          to="/customer/profile"
          className={({ isActive }) => `flex flex-col items-center justify-center w-11 h-12 transition-all ${isActive ? 'text-[#E85D3F]' : 'text-[#6B6B6B] hover:text-[#242424]'}`}
        >
          <User className="w-4.5 h-4.5 mb-0.5" />
          <span className="text-[8.5px] font-extrabold font-sans">Profile</span>
        </NavLink>
        
      </div>

      {/* FULL SCREEN CAMERA VIEWFINDER OVERLAY */}
      {isQrScannerOpen && (
        <div className="fixed inset-0 bg-[#FFFCF9]/95 backdrop-blur-md flex items-center justify-center p-6 z-50 overflow-hidden shadow-2xl">
          
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
