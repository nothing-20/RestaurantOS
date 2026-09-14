import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { 
  collection, 
  onSnapshot, 
  doc, 
  deleteDoc, 
  updateDoc, 
  addDoc, 
  query, 
  where, 
  arrayUnion 
} from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { useAuth } from '../../../context/AuthContext';
import { IServiceRequest, IOrder } from '../../../types';
import toast from 'react-hot-toast';
import { 
  Coffee, 
  DollarSign, 
  User, 
  AlertTriangle, 
  Check, 
  Clock, 
  UtensilsCrossed, 
  Bell, 
  Trash2, 
  AlertOctagon,
  Users
} from 'lucide-react';

export const WaiterAlerts: React.FC = () => {
  const { user } = useAuth();
  
  const [requests, setRequests] = useState<IServiceRequest[]>([]);
  const [waiterRequests, setWaiterRequests] = useState<any[]>([]);
  const [readyOrders, setReadyOrders] = useState<IOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Live ticking clock for Front of House service status
  const [currentTime, setCurrentTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Filters state
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterTable, setFilterTable] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');

  // Subscribe to READY orders from kitchen
  useEffect(() => {
    if (!user?.tenantId) return;

    const colRef = collection(db, 'restaurants', user.tenantId, 'orders');
    const readyQuery = query(colRef, where('status', '==', 'READY'));

    const unsubscribe = onSnapshot(
      readyQuery,
      (snapshot) => {
        const list: IOrder[] = [];
        snapshot.forEach((docSnap) => {
          list.push({ ...docSnap.data() } as IOrder);
        });
        list.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        setReadyOrders(list);
      },
      (error) => {
        console.error(error);
        toast.error('Failed to connect to kitchen ready orders stream.');
      }
    );

    return () => unsubscribe();
  }, [user?.tenantId]);

  // Subscribe to Legacy QR Table Alerts
  useEffect(() => {
    if (!user?.tenantId) return;

    setIsLoading(true);
    const colRef = collection(db, 'restaurants', user.tenantId, 'requests');

    const unsubscribe = onSnapshot(
      colRef,
      (snapshot) => {
        const list: IServiceRequest[] = [];
        snapshot.forEach((docSnap) => {
          list.push({ id: docSnap.id, ...docSnap.data() } as IServiceRequest);
        });
        list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setRequests(list);
        setIsLoading(false);
      },
      (error) => {
        console.error(error);
        toast.error('Failed to load customer requests feed.');
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user?.tenantId]);

  // Subscribe to Call Waiter Assistance Requests
  useEffect(() => {
    if (!user?.tenantId) return;

    const colRef = collection(db, 'restaurants', user.tenantId, 'waiterRequests');

    const unsubscribe = onSnapshot(
      colRef,
      (snapshot) => {
        const list: any[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          const status = (data.status || '').toLowerCase();
          if (status !== 'completed' && status !== 'cancelled' && status !== 'rejected') {
            list.push({ id: docSnap.id, ...data });
          }
        });
        list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setWaiterRequests(list);
      },
      (error) => {
        console.error(error);
        toast.error('Failed to load customer requests list.');
      }
    );

    return () => unsubscribe();
  }, [user?.tenantId]);

  // Actions
  const handleAcceptAlert = async (alert: any) => {
    if (!user?.tenantId) return;
    try {
      if (alert.rawType === 'waiter_request') {
        const docRef = doc(db, 'restaurants', user.tenantId, 'waiterRequests', alert.id);
        await updateDoc(docRef, { 
          status: 'Accepted',
          acceptedBy: user.displayName || user.email || 'Waiter'
        });
      } else {
        toast.error('Only table alerts require acceptance claim.');
        return;
      }
      toast.success('Alert accepted for service.');
    } catch (e) {
      console.error(e);
      toast.error('Failed to accept alert.');
    }
  };

  const handleResolveAlert = async (alert: any) => {
    if (!user?.tenantId) return;
    try {
      if (alert.rawType === 'ready_order') {
        const docRef = doc(db, 'restaurants', user.tenantId, 'orders', alert.orderId);
        const timelineEvent = {
          type: 'DELIVERED',
          title: 'Served',
          description: `Delivered by Waiter ${user.displayName || user.email}`,
          timestamp: new Date().toISOString(),
          performedBy: user.displayName || 'Waiter'
        };
        await updateDoc(docRef, { 
          status: 'DELIVERED', 
          deliveredAt: new Date().toISOString(),
          timeline: arrayUnion(timelineEvent)
        });
      } else if (alert.rawType === 'qr_request') {
        const docRef = doc(db, 'restaurants', user.tenantId, 'requests', alert.id);
        await deleteDoc(docRef);
      } else if (alert.rawType === 'waiter_request') {
        const docRef = doc(db, 'restaurants', user.tenantId, 'waiterRequests', alert.id);
        await updateDoc(docRef, { 
          status: 'Completed',
          resolvedAt: new Date().toISOString()
        });
      }
      toast.success('Alert resolved!');
    } catch (e) {
      console.error(e);
      toast.error('Failed to resolve alert.');
    }
  };

  const handleEscalateAlert = async (alert: any) => {
    if (!user?.tenantId) return;
    try {
      const docRef = collection(db, 'restaurants', user.tenantId, 'waiterRequests');
      await addDoc(docRef, {
        tenantId: user.tenantId,
        tableNumber: Number(alert.tableNumber) || alert.tableNumber,
        requestType: 'Manager Call',
        status: 'Pending',
        priority: 'critical',
        createdAt: new Date().toISOString(),
        description: `CRITICAL ESCALATION for Alert: "${alert.type}" (Table ${alert.tableNumber})`,
        acceptedBy: '',
        resolvedAt: '',
        orderId: alert.orderId || '—'
      });
      toast.success('Alert escalated to manager console.');
    } catch (e) {
      console.error(e);
      toast.error('Failed to escalate alert.');
    }
  };

  const handleDismissAlert = async (alert: any) => {
    if (!user?.tenantId) return;
    try {
      if (alert.rawType === 'qr_request') {
        const docRef = doc(db, 'restaurants', user.tenantId, 'requests', alert.id);
        await deleteDoc(docRef);
      } else if (alert.rawType === 'waiter_request') {
        const docRef = doc(db, 'restaurants', user.tenantId, 'waiterRequests', alert.id);
        await deleteDoc(docRef);
      } else {
        toast.error('Kitchen ready alerts cannot be dismissed, only delivered.');
        return;
      }
      toast.success('Alert dismissed.');
    } catch (e) {
      console.error(e);
      toast.error('Failed to dismiss alert.');
    }
  };

  // Compile unified alerts stream
  const combinedAlerts = useMemo(() => {
    const list: any[] = [];
    
    // 1. Kitchen Ready Alerts
    readyOrders.forEach(o => {
      list.push({
        id: `ready-${o.orderId}`,
        orderId: o.orderId,
        tableNumber: String(o.tableNumber),
        type: 'Kitchen Ready',
        priority: 'high',
        createdAt: o.createdAt,
        description: `Order #${o.orderId.substring(0, 8)} is ready for table pickup.`,
        status: 'Pending',
        assignedWaiter: o.waiterName || 'Unassigned',
        rawType: 'ready_order',
        rawObj: o
      });
    });

    // 2. Legacy QR Alerts
    requests.forEach((r: any) => {
      list.push({
        id: r.id || `qr-${r.createdAt}`,
        orderId: r.orderId || '—',
        tableNumber: String(r.tableNumber),
        type: r.type || 'Need Waiter',
        priority: r.type === 'Bill' ? 'high' : 'medium',
        createdAt: r.createdAt,
        description: r.description || `Table QR alert: ${r.type}`,
        status: 'Pending',
        assignedWaiter: 'Unassigned',
        rawType: 'qr_request',
        rawObj: r
      });
    });

    // 3. Diner Call Waiter Requests
    waiterRequests.forEach(r => {
      list.push({
        id: r.id,
        orderId: r.orderId || '—',
        tableNumber: String(r.tableNumber),
        type: r.requestType || 'Need Waiter',
        priority: r.priority || 'medium',
        createdAt: r.createdAt,
        description: r.description || `${r.requestType} request for Table ${r.tableNumber}`,
        status: r.status || 'Pending',
        assignedWaiter: r.acceptedBy || 'Unassigned',
        rawType: 'waiter_request',
        rawObj: r
      });
    });

    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [readyOrders, requests, waiterRequests]);

  // Derived filter helper arrays
  const uniqueTables = useMemo(() => {
    const set = new Set<string>();
    combinedAlerts.forEach(a => set.add(a.tableNumber));
    return Array.from(set).sort((a, b) => Number(a) - Number(b));
  }, [combinedAlerts]);

  const uniqueTypes = useMemo(() => {
    const set = new Set<string>();
    combinedAlerts.forEach(a => set.add(a.type));
    return Array.from(set).sort();
  }, [combinedAlerts]);

  const filteredAlerts = useMemo(() => {
    return combinedAlerts.filter(a => {
      const matchesPriority = filterPriority === 'all' || a.priority === filterPriority;
      const matchesTable = filterTable === 'all' || a.tableNumber === filterTable;
      const matchesStatus = filterStatus === 'all' || a.status === filterStatus;
      const matchesType = filterType === 'all' || a.type === filterType;
      return matchesPriority && matchesTable && matchesStatus && matchesType;
    });
  }, [combinedAlerts, filterPriority, filterTable, filterStatus, filterType]);

  // Real operational metrics derived from active streams
  const activeTablesCount = useMemo(() => new Set(combinedAlerts.map(a => a.tableNumber)).size, [combinedAlerts]);
  const customerRequestsCount = useMemo(() => combinedAlerts.filter(a => a.rawType === 'waiter_request' || a.rawType === 'qr_request').length, [combinedAlerts]);
  const billRequestsCount = useMemo(() => combinedAlerts.filter(a => a.type === 'Bill' || a.type === 'Need Bill' || a.type === 'Request Bill').length, [combinedAlerts]);
  const readyOrdersCount = readyOrders.length;

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'Need Water':
      case 'Request Water':
      case 'Water':
        return <Coffee className="w-4 h-4 text-[#D79A24]" />;
      case 'Need Bill':
      case 'Request Bill':
      case 'Bill':
        return <DollarSign className="w-4 h-4 text-[#287A55]" />;
      case 'Kitchen Ready':
        return <UtensilsCrossed className="w-4 h-4 text-[#C84A38]" />;
      case 'Manager Call':
      case 'Manager Message':
        return <AlertOctagon className="w-4 h-4 text-[#C7463A]" />;
      default:
        return <Bell className="w-4 h-4 text-[#D79A24]" />;
    }
  };

  const getMinutesElapsed = (isoStr: string) => {
    if (!isoStr) return 'Just now';
    const diff = (Date.now() - new Date(isoStr).getTime()) / 60000;
    if (diff < 1) return 'Just now';
    return `${Math.round(diff)}m ago`;
  };

  return (
    <div className="space-y-6 text-left select-none pb-24 font-sans">
      
      {/* ── 1. Front of House Hero Header ─────────────────────────────── */}
      <div className="relative overflow-hidden rounded-xl bg-white border border-[#E3DED5] p-5 md:p-6 shadow-[0_2px_10px_rgba(30,30,20,0.06)]">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-widest text-[#5F6762]">
              FRONT OF HOUSE
            </span>
            <h1 className="font-serif text-3xl md:text-4xl font-bold text-[#18201D] tracking-tight mt-0.5">
              Today's Service
            </h1>
            <p className="text-xs md:text-sm text-[#5F6762] mt-1 font-normal font-sans">
              Keep every table moving smoothly and every guest looked after.
            </p>
          </div>

          <div className="flex items-center space-x-4 shrink-0 bg-[#F7F4EE] px-4 py-3 rounded-xl border border-[#E3DED5]">
            <div className="text-right">
              <div className="text-xs font-medium text-[#5F6762]">
                {currentTime.toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })}
              </div>
              <div className="text-lg font-serif font-bold text-[#18201D] tracking-tight leading-none mt-0.5">
                {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
              </div>
            </div>
            <div className="h-7 w-[1px] bg-[#E3DED5]" />
            <div className="flex items-center space-x-1.5 text-xs font-bold text-[#287A55]">
              <span className="w-2 h-2 rounded-full bg-[#287A55] animate-pulse" />
              <span>Service Live</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── 2. Service Operational Metrics Row ─────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 select-none font-sans">
        {/* Active Tables */}
        <div className="bg-white border border-[#E3DED5] rounded-xl p-4 shadow-[0_2px_10px_rgba(30,30,20,0.06)] flex flex-col justify-between hover:border-[#D1C9BC] transition-all text-left">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-[#5F6762] tracking-wide uppercase">
              Active Tables
            </span>
            <div className="w-6 h-6 rounded-md bg-[#F7F4EE] flex items-center justify-center text-[#18201D]">
              <Users className="w-3.5 h-3.5 text-[#18201D]" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-bold text-[#18201D] tabular-nums tracking-tight font-sans">
              {activeTablesCount}
            </div>
            <p className="text-xs text-[#5F6762] mt-1 font-medium">Currently seated</p>
          </div>
        </div>

        {/* Customer Requests */}
        <div className="bg-white border border-[#E3DED5] rounded-xl p-4 shadow-[0_2px_10px_rgba(30,30,20,0.06)] flex flex-col justify-between hover:border-[#D1C9BC] transition-all text-left">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-[#5F6762] tracking-wide uppercase">
              Customer Requests
            </span>
            <div className="w-6 h-6 rounded-md bg-[#F9E8E4] flex items-center justify-center text-[#C84A38]">
              <Bell className="w-3.5 h-3.5 text-[#C84A38]" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-bold text-[#18201D] tabular-nums tracking-tight font-sans">
              {customerRequestsCount}
            </div>
            <p className="text-xs text-[#5F6762] mt-1 font-medium">Need attention</p>
          </div>
        </div>

        {/* Bills */}
        <div className="bg-white border border-[#E3DED5] rounded-xl p-4 shadow-[0_2px_10px_rgba(30,30,20,0.06)] flex flex-col justify-between hover:border-[#D1C9BC] transition-all text-left">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-[#5F6762] tracking-wide uppercase">
              Bills
            </span>
            <div className="w-6 h-6 rounded-md bg-[#E8F3ED] flex items-center justify-center text-[#287A55]">
              <DollarSign className="w-3.5 h-3.5 text-[#287A55]" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-bold text-[#18201D] tabular-nums tracking-tight font-sans">
              {billRequestsCount}
            </div>
            <p className="text-xs text-[#5F6762] mt-1 font-medium">Awaiting service</p>
          </div>
        </div>

        {/* Ready Orders */}
        <div className="bg-white border border-[#E3DED5] rounded-xl p-4 shadow-[0_2px_10px_rgba(30,30,20,0.06)] flex flex-col justify-between hover:border-[#D1C9BC] transition-all text-left">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-[#5F6762] tracking-wide uppercase">
              Ready Orders
            </span>
            <div className="w-6 h-6 rounded-md bg-[#E8F3ED] flex items-center justify-center text-[#287A55]">
              <UtensilsCrossed className="w-3.5 h-3.5 text-[#287A55]" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-bold text-[#18201D] tabular-nums tracking-tight font-sans">
              {readyOrdersCount}
            </div>
            <p className="text-xs text-[#5F6762] mt-1 font-medium">Kitchen pickup</p>
          </div>
        </div>
      </div>

      {/* ── 3. Section Title & Live Counter ────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2">
        <div>
          <h2 className="font-serif text-xl md:text-2xl font-bold text-[#18201D] tracking-tight">
            Customer Requests
          </h2>
          <p className="text-xs text-[#5F6762] mt-0.5">
            Requests from your tables that need action.
          </p>
        </div>
        <span className="text-xs font-semibold text-[#5F6762] self-start sm:self-auto bg-white border border-[#E3DED5] px-3 py-1 rounded-lg shadow-none">
          Showing <strong className="text-[#18201D]">{filteredAlerts.length}</strong> active requests
        </span>
      </div>

      {/* ── 4. Filter Toolbar ─────────────────────────────────────────── */}
      <div className="bg-white border border-[#E3DED5] rounded-xl p-4 shadow-[0_1px_3px_rgba(30,30,20,0.04)] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="space-y-1">
          <label className="text-[10px] text-[#5F6762] font-extrabold uppercase tracking-wider">Priority</label>
          <select
            value={filterPriority}
            onChange={e => setFilterPriority(e.target.value)}
            className="w-full bg-[#F7F4EE] border border-[#E3DED5] rounded-lg px-3 py-2 text-xs font-semibold text-[#18201D] outline-none cursor-pointer focus:border-[#13241F]"
          >
            <option value="all">All Priorities</option>
            <option value="critical">💥 Critical</option>
            <option value="high">🔴 High</option>
            <option value="medium">🟡 Medium</option>
            <option value="low">Normal / Low</option>
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] text-[#5F6762] font-extrabold uppercase tracking-wider">Table</label>
          <select
            value={filterTable}
            onChange={e => setFilterTable(e.target.value)}
            className="w-full bg-[#F7F4EE] border border-[#E3DED5] rounded-lg px-3 py-2 text-xs font-semibold text-[#18201D] outline-none cursor-pointer focus:border-[#13241F]"
          >
            <option value="all">All Tables</option>
            {uniqueTables.map(num => (
              <option key={num} value={num}>Table {num}</option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] text-[#5F6762] font-extrabold uppercase tracking-wider">Status</label>
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="w-full bg-[#F7F4EE] border border-[#E3DED5] rounded-lg px-3 py-2 text-xs font-semibold text-[#18201D] outline-none cursor-pointer focus:border-[#13241F]"
          >
            <option value="all">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Accepted">Accepted</option>
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] text-[#5F6762] font-extrabold uppercase tracking-wider">Alert Type</label>
          <select
            value={filterType}
            onChange={e => setFilterType(e.target.value)}
            className="w-full bg-[#F7F4EE] border border-[#E3DED5] rounded-lg px-3 py-2 text-xs font-semibold text-[#18201D] outline-none cursor-pointer focus:border-[#13241F]"
          >
            <option value="all">All Types</option>
            {uniqueTypes.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
      </div>

      {/* ── 5. Customer Alerts Grid ───────────────────────────────────── */}
      {filteredAlerts.length === 0 ? (
        <div className="bg-white border border-[#E3DED5] rounded-xl p-12 text-center shadow-[0_1px_3px_rgba(30,30,20,0.04)]">
          <Bell className="w-8 h-8 text-[#287A55] mx-auto mb-2.5 opacity-80" />
          <h3 className="font-serif text-base font-bold text-[#18201D]">All caught up</h3>
          <p className="text-xs text-[#5F6762] mt-0.5">No active customer service requests currently.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
          {filteredAlerts.map(alert => {
            const isBill = alert.type === 'Bill' || alert.type === 'Need Bill' || alert.type === 'Request Bill';
            const isCritical = alert.priority === 'critical';
            const isHigh = alert.priority === 'high';
            const isMedium = alert.priority === 'medium';
            const isUnassigned = !alert.assignedWaiter || alert.assignedWaiter === 'Unassigned';

            // Top status border accent
            let topBorderClass = 'border-t-[3px] border-t-[#E3DED5]';
            if (isBill) topBorderClass = 'border-t-[3px] border-t-[#287A55]';
            else if (isCritical) topBorderClass = 'border-t-[3px] border-t-[#C7463A]';
            else if (isHigh) topBorderClass = 'border-t-[3px] border-t-[#C84A38]';
            else if (isMedium) topBorderClass = 'border-t-[3px] border-t-[#D79A24]';

            return (
              <div
                key={alert.id}
                className={`bg-white border border-[#E3DED5] rounded-xl p-5 shadow-[0_2px_10px_rgba(30,30,20,0.06)] flex flex-col justify-between hover:border-[#D1C9BC] transition-all text-left font-sans ${topBorderClass}`}
              >
                <div className="space-y-3.5">
                  {/* Top Row: Icon + Table Number + Title + Priority badge */}
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex items-start space-x-3 min-w-0">
                      <div className={`p-2 rounded-lg border shrink-0 ${
                        isBill 
                          ? 'bg-[#E8F3ED] border-[#287A55]/30 text-[#287A55]' 
                          : isCritical 
                          ? 'bg-[#F9E8E4] border-[#C7463A]/30 text-[#C7463A]' 
                          : 'bg-[#FBF9F5] border-[#E3DED5] text-[#18201D]'
                      }`}>
                        {getAlertIcon(alert.type)}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center space-x-1.5 flex-wrap">
                          <span className="font-bold text-sm md:text-base text-[#18201D] tracking-tight">
                            TABLE {alert.tableNumber}
                          </span>
                          <span className="text-[10px] font-bold uppercase tracking-wider bg-[#F7F4EE] border border-[#E3DED5] text-[#5F6762] px-1.5 py-0.2 rounded">
                            Dine-In
                          </span>
                        </div>
                        <p className="text-xs font-semibold text-[#18201D] truncate mt-0.5">
                          {alert.type}
                        </p>
                      </div>
                    </div>

                    {/* Semantic priority badge */}
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full shrink-0 border ${
                      isCritical 
                        ? 'bg-[#F9E8E4] text-[#C7463A] border-[#C7463A]/30 font-extrabold'
                        : isHigh
                        ? 'bg-[#F9E8E4] text-[#C84A38] border-[#C84A38]/30'
                        : isMedium
                        ? 'bg-[#F8EED8] text-[#D79A24] border-[#D79A24]/30'
                        : 'bg-[#E8F3ED] text-[#287A55] border-[#287A55]/30'
                    }`}>
                      {alert.priority}
                    </span>
                  </div>

                  {/* Order ID */}
                  {alert.orderId && alert.orderId !== '—' && (
                    <div className="text-[11px] text-[#5F6762]">
                      <span className="font-mono">#ORD-{alert.orderId.replace(/^ORD-/i, '').substring(0, 10)}</span>
                    </div>
                  )}

                  {/* Assigned Waiter */}
                  <div className="pt-2 border-t border-[#F7F4EE]">
                    <span className="text-[10px] font-bold text-[#7A817C] uppercase tracking-wider block">
                      Assigned Waiter
                    </span>
                    <span className={`text-xs font-semibold mt-0.5 block ${isUnassigned ? 'text-[#D79A24]' : 'text-[#18201D]'}`}>
                      {isUnassigned ? '● Unassigned' : alert.assignedWaiter}
                    </span>
                  </div>

                  {/* Request Details */}
                  <div className="pt-2 border-t border-[#F7F4EE]">
                    <span className="text-[10px] font-bold text-[#7A817C] uppercase tracking-wider block">
                      Request Details
                    </span>
                    <p className="text-xs font-medium text-[#18201D] leading-relaxed mt-0.5">
                      {alert.description}
                    </p>
                  </div>

                  {/* Timestamp Age */}
                  <div className="flex items-center space-x-1.5 text-[11px] text-[#5F6762] pt-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{getMinutesElapsed(alert.createdAt)}</span>
                  </div>
                </div>

                {/* Operations Control Action Buttons */}
                <div className="flex items-center gap-2 pt-4 mt-3 border-t border-[#E3DED5]">
                  {alert.status === 'Pending' && alert.rawType === 'waiter_request' && (
                    <button
                      onClick={() => handleAcceptAlert(alert)}
                      className="flex-1 py-2 bg-[#287A55] hover:bg-[#206345] text-white text-xs font-bold rounded-lg transition-all shadow-sm flex items-center justify-center space-x-1"
                    >
                      <Check className="w-3.5 h-3.5" strokeWidth={2.5} />
                      <span>Accept</span>
                    </button>
                  )}

                  <button
                    onClick={() => handleResolveAlert(alert)}
                    className="flex-1 py-2 bg-white hover:bg-[#E8F3ED] text-[#287A55] border border-[#287A55] text-xs font-bold rounded-lg transition-all text-center"
                  >
                    Resolve
                  </button>

                  <button
                    onClick={() => handleEscalateAlert(alert)}
                    className="flex-1 py-2 bg-[#F9E8E4] hover:bg-[#F2D7D2] border border-[#E3DED5] text-[#C7463A] text-xs font-bold rounded-lg transition-all text-center"
                  >
                    Escalate
                  </button>

                  <button
                    onClick={() => handleDismissAlert(alert)}
                    className="p-2 bg-white hover:bg-[#F9E8E4] border border-[#E3DED5] text-[#5F6762] hover:text-[#C7463A] rounded-lg transition-all shrink-0"
                    title="Dismiss Alert"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default WaiterAlerts;
