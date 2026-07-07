import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { db } from '../../../config/firebase';
import { 
  collection, 
  onSnapshot, 
  query, 
  where, 
  doc, 
  updateDoc, 
  deleteDoc, 
  getDocs 
} from 'firebase/firestore';
import { 
  LogOut, 
  Bell, 
  User, 
  Search, 
  Terminal, 
  AlertTriangle,
  X,
  ChevronRight,
  Database
} from 'lucide-react';
import toast from 'react-hot-toast';

export const Navbar: React.FC = () => {
  const { user, role, logout } = useAuth();
  const tenantId = user?.tenantId;

  // Search & Command Palette Modal state
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIdx, setSelectedIdx] = useState(0);

  // Notification states
  const [showNotifications, setShowNotifications] = useState(false);
  const [alerts, setAlerts] = useState<any[]>([]);

  // Search Data States (cached on focus/open)
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [tables, setTables] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [hasLoadedData, setHasLoadedData] = useState(false);

  // References
  const searchInputRef = useRef<HTMLInputElement>(null);
  const paletteRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);

  // Listen to alerts for notification bell
  useEffect(() => {
    if (!tenantId) return;

    const q = query(collection(db, 'restaurants', tenantId, 'alerts'), where('read', '==', false));
    const unsub = onSnapshot(q, (snap) => {
      const list: any[] = [];
      snap.forEach(d => list.push({ id: d.id, ...d.data() }));
      setAlerts(list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    });

    return () => unsub();
  }, [tenantId]);

  // Load search pool data when search is initialized
  const loadSearchData = async () => {
    if (!tenantId || hasLoadedData) return;
    try {
      // 1. Menu items
      const menuSnap = await getDocs(collection(db, 'restaurants', tenantId, 'menu/default/items'));
      const menuList: any[] = [];
      menuSnap.forEach(d => menuList.push({ id: d.id, type: 'Menu Item', label: d.data().name, path: '/dashboard/owner/menu' }));
      setMenuItems(menuList);

      // 2. Tables
      const tablesSnap = await getDocs(collection(db, 'restaurants', tenantId, 'tables'));
      const tablesList: any[] = [];
      tablesSnap.forEach(d => tablesList.push({ id: d.id, type: 'Table', label: `Table ${d.data().number} (${d.data().status})`, path: '/dashboard/owner/tables' }));
      setTables(tablesList);

      // 3. Employees
      const empSnap = await getDocs(query(collection(db, 'employees'), where('tenantId', '==', tenantId)));
      const empList: any[] = [];
      empSnap.forEach(d => empList.push({ id: d.id, type: 'Employee', label: `${d.data().name} (${d.data().role})`, path: '/dashboard/owner/staff' }));
      setEmployees(empList);

      // 4. Inventory
      const invSnap = await getDocs(collection(db, 'restaurants', tenantId, 'inventory'));
      const invList: any[] = [];
      invSnap.forEach(d => invList.push({ id: d.id, type: 'Inventory', label: `${d.data().name} (${d.data().currentStock} ${d.data().unit})`, path: '/dashboard/owner/inventory' }));
      setInventory(invList);

      setHasLoadedData(true);
    } catch (err) {
      console.error('Failed to pre-fetch search options', err);
    }
  };

  // Keyboard shortcut listener Ctrl + K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
        setShowNotifications(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Pre-load data on search open
  useEffect(() => {
    if (isOpen) {
      loadSearchData();
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Click outside listener for dropdowns
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notificationsRef.current && !notificationsRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Define static commands
  const commands = useMemo(() => [
    { id: 'cmd-order', type: 'Quick Action', label: 'Create Order', action: () => window.location.href = '/dashboard/waiter' },
    { id: 'cmd-kitchen', type: 'Navigation', label: 'Open Kitchen Display System (KDS)', action: () => window.location.href = '/dashboard/kitchen' },
    { id: 'cmd-billing', type: 'Navigation', label: 'Open Billing POS Register', action: () => window.location.href = '/dashboard/owner/billing' },
    { id: 'cmd-inventory', type: 'Navigation', label: 'Open Inventory Manager', action: () => window.location.href = '/dashboard/owner/inventory' },
    { id: 'cmd-staff', type: 'Navigation', label: 'Add Employee Profile', action: () => window.location.href = '/dashboard/owner/staff' },
    { id: 'cmd-analytics', type: 'Navigation', label: 'Open BI Analytics', action: () => window.location.href = '/dashboard/owner/analytics' },
    { id: 'cmd-settings', type: 'Navigation', label: 'Open Settings Panel', action: () => window.location.href = '/dashboard/owner/settings' },
    { id: 'cmd-demo', type: 'Demo Reset', label: 'Load Demo mode preset', action: () => window.location.href = '/dashboard/owner/settings' }
  ], []);

  // Combine and filter search results
  const filteredResults = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    const searchPool = [...commands, ...menuItems, ...tables, ...employees, ...inventory];
    if (!q) return commands.slice(0, 5); // default commands list

    return searchPool.filter(item => 
      item.label.toLowerCase().includes(q) || 
      item.type.toLowerCase().includes(q)
    ).slice(0, 8);
  }, [searchQuery, commands, menuItems, tables, employees, inventory]);

  // Navigate keyboard controls
  const handleNavKeys = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIdx(prev => (prev + 1) % filteredResults.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIdx(prev => (prev - 1 + filteredResults.length) % filteredResults.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredResults[selectedIdx]) {
        executeResult(filteredResults[selectedIdx]);
      }
    }
  };

  const executeResult = (item: any) => {
    setIsOpen(false);
    setSearchQuery('');
    if (item.action) {
      item.action();
    } else if (item.path) {
      window.location.href = item.path;
    }
  };

  // Notification resolve triggers
  const handleDismissAlert = async (alertId: string) => {
    if (!tenantId) return;
    try {
      const docRef = doc(db, 'restaurants', tenantId, 'alerts', alertId);
      await updateDoc(docRef, { read: true });
      toast.success('Alert dismissed');
    } catch (err) {
      console.error(err);
      toast.error('Failed to dismiss alert.');
    }
  };

  const handleResolveAlert = async (alert: any) => {
    if (!tenantId) return;
    try {
      const docRef = doc(db, 'restaurants', tenantId, 'alerts', alert.id);
      await deleteDoc(docRef);
      toast.success('Alert resolved!');
      
      // Auto-route to resolve action
      if (alert.title.includes('Stock')) {
        window.location.href = '/dashboard/owner/inventory';
      } else if (alert.title.includes('CSAT')) {
        window.location.href = '/dashboard/owner/strategy';
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to resolve alert.');
    }
  };

  return (
    <header className="h-16 border-b border-slate-800/40 bg-slate-955/40 backdrop-blur-md flex items-center justify-between px-6 z-20">
      
      {/* Search Input trigger on left */}
      <div className="flex items-center space-x-4">
        <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500 hidden sm:inline-block">
          Tenant: {user?.tenantId || 'SaaS Global'}
        </span>
        <button 
          onClick={() => setIsOpen(true)}
          className="flex items-center space-x-2.5 px-3 py-1.5 rounded-full border border-slate-800 bg-slate-950/40 hover:border-slate-700/60 text-slate-400 hover:text-slate-300 text-xs font-semibold select-none transition-all duration-200"
        >
          <Search className="w-3.5 h-3.5" />
          <span>Quick Search...</span>
          <kbd className="bg-slate-900 border border-slate-800 px-1.5 py-0.5 rounded text-[9px] font-mono leading-none tracking-normal">
            Ctrl K
          </kbd>
        </button>
      </div>

      <div className="flex items-center space-x-4">
        
        {/* Unified Notification Center dropdown */}
        <div className="relative" ref={notificationsRef}>
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 text-mutedAsh hover:text-primary transition-colors relative rounded-lg hover:bg-slate-900/60"
          >
            <Bell className="w-5 h-5" />
            {alerts.length > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-primary animate-pulse" />
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2.5 w-80 rounded-2xl border border-slate-850 bg-slate-955/95 shadow-2xl p-4 space-y-3 z-50 text-left backdrop-blur-lg">
              <div className="flex items-center justify-between pb-2 border-b border-slate-850">
                <span className="text-xs font-bold text-textPearl flex items-center gap-1.5">
                  <Bell className="w-4 h-4 text-primary" />
                  <span>Unread Notifications</span>
                </span>
                <span className="text-[9px] px-2 py-0.5 bg-slate-900 border border-slate-800 rounded-full font-mono text-slate-400">
                  {alerts.length} New
                </span>
              </div>

              <div className="max-h-64 overflow-y-auto space-y-2.5 scrollbar-thin">
                {alerts.map((a) => (
                  <div key={a.id} className="p-2.5 bg-slate-950/40 border border-slate-855 rounded-xl space-y-2 text-xs">
                    <div className="flex justify-between items-start">
                      <span className="font-bold text-textPearl flex items-center gap-1">
                        <AlertTriangle className={`w-3.5 h-3.5 ${a.severity === 'critical' ? 'text-rose-500' : 'text-amber-500'}`} />
                        {a.title}
                      </span>
                      <button 
                        onClick={() => handleDismissAlert(a.id)}
                        className="text-slate-500 hover:text-slate-300"
                        title="Dismiss alert"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <p className="text-[10px] text-slate-400 font-semibold">{a.message}</p>
                    <div className="flex justify-end pt-1">
                      <button
                        onClick={() => handleResolveAlert(a)}
                        className="text-[9px] font-black text-primary hover:underline uppercase tracking-wider"
                      >
                        Resolve Issue
                      </button>
                    </div>
                  </div>
                ))}

                {alerts.length === 0 && (
                  <div className="text-center py-6 text-slate-500 italic text-xs font-semibold">
                    No active unread notifications.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* User profile details */}
        <div className="flex items-center space-x-3 pl-2 border-l border-slate-800/60">
          <div className="w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center border border-slate-800 text-slate-350 font-bold text-xs">
            {user?.displayName ? user.displayName.slice(0, 2).toUpperCase() : <User className="w-4 h-4" />}
          </div>
          <div className="hidden md:flex flex-col text-left">
            <span className="text-xs font-bold text-textPearl truncate max-w-[120px]">{user?.displayName || 'User'}</span>
            <span className="text-[9px] text-primary uppercase font-black tracking-widest">{role || 'staff'}</span>
          </div>
        </div>

        {/* Logout */}
        <button 
          onClick={logout} 
          className="p-2 text-mutedAsh hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
          title="Sign Out"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>

      {/* Global Command Palette Overlay Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-slate-950/80 z-50 flex items-start justify-center pt-24 px-4 backdrop-blur-sm">
          <div 
            ref={paletteRef}
            className="w-full max-w-xl bg-slate-955 border border-slate-850 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[420px]"
          >
            {/* Header Input */}
            <div className="p-4 border-b border-slate-850 flex items-center space-x-3 bg-slate-950/40">
              <Search className="w-4 h-4 text-slate-400" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search menu, tables, staff, inventory or type action..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setSelectedIdx(0);
                }}
                onKeyDown={handleNavKeys}
                className="w-full bg-transparent outline-none border-none text-xs text-textPearl placeholder-slate-500"
              />
              <button 
                onClick={() => setIsOpen(false)}
                className="p-1 rounded bg-slate-900 border border-slate-800 text-slate-500 hover:text-slate-300"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Results body */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1.5 scrollbar-thin">
              <span className="text-[9px] font-bold text-slate-550 uppercase tracking-widest px-3 py-1.5 block">
                {searchQuery ? 'Matching entries' : 'Recommended actions'}
              </span>

              {filteredResults.map((item, idx) => {
                const isSelected = idx === selectedIdx;
                let badgeColor = 'bg-slate-900 border-slate-800 text-slate-400';
                if (item.type === 'Quick Action') badgeColor = 'bg-primary/10 border-primary/20 text-primary';
                if (item.type === 'Demo Reset') badgeColor = 'bg-amber-500/10 border-amber-500/20 text-amber-500';

                return (
                  <div
                    key={item.id}
                    onClick={() => executeResult(item)}
                    className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer select-none border transition-all ${isSelected ? 'border-primary/40 bg-primary/5 text-textPearl' : 'border-transparent text-slate-450 hover:bg-slate-950/30'}`}
                  >
                    <div className="flex items-center space-x-3 min-w-0">
                      <Terminal className={`w-3.5 h-3.5 ${isSelected ? 'text-primary' : 'text-slate-500'}`} />
                      <span className="text-xs font-semibold truncate">{item.label}</span>
                    </div>
                    
                    <div className="flex items-center space-x-2 shrink-0">
                      <span className={`text-[9px] px-2 py-0.5 rounded-full border font-mono ${badgeColor}`}>
                        {item.type}
                      </span>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-650" />
                    </div>
                  </div>
                );
              })}

              {filteredResults.length === 0 && (
                <div className="text-center py-8 text-slate-500 italic text-xs font-semibold">
                  No matching items or actions found.
                </div>
              )}
            </div>

            {/* Palette Footer */}
            <div className="p-3 border-t border-slate-850 bg-slate-950/20 flex justify-between items-center text-[10px] text-slate-550 font-bold font-mono">
              <span className="flex items-center gap-1.5">
                <span>↑↓ Navigate</span>
                <span>•</span>
                <span>↵ Select</span>
              </span>
              <span>ESC to Close</span>
            </div>

          </div>
        </div>
      )}

    </header>
  );
};

export default Navbar;
