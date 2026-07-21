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

// UI Kit components
import Card from '../../../components/ui/Card/Card';
import Badge from '../../../components/ui/Badge/Badge';
import LoadingSpinner from '../../../components/ui/LoadingSpinner/LoadingSpinner';
import toast from 'react-hot-toast';
import { 
  Coffee, 
  DollarSign, 
  User, 
  AlertTriangle, 
  Check, 
  Clock,
  CheckSquare,
  UtensilsCrossed,
  ChefHat,
  Filter,
  Bell,
  Trash2,
  AlertOctagon
} from 'lucide-react';

export const WaiterAlerts: React.FC = () => {
  const { user } = useAuth();
  
  const [requests, setRequests] = useState<IServiceRequest[]>([]);
  const [waiterRequests, setWaiterRequests] = useState<any[]>([]);
  const [readyOrders, setReadyOrders] = useState<IOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
          if (data.status !== 'Completed') {
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
    requests.forEach(r => {
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

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'Need Water':
      case 'Request Water':
      case 'Water':
        return <Coffee className="w-4 h-4 text-sky-400" />;
      case 'Need Bill':
      case 'Request Bill':
      case 'Bill':
        return <DollarSign className="w-4 h-4 text-emerald-500" />;
      case 'Kitchen Ready':
        return <UtensilsCrossed className="w-4 h-4 text-emerald-455" />;
      case 'Manager Call':
      case 'Manager Message':
        return <AlertOctagon className="w-4 h-4 text-rose-500 animate-pulse" />;
      default:
        return <Bell className="w-4 h-4 text-indigo-400" />;
    }
  };

  const getMinutesElapsed = (isoStr: string) => {
    if (!isoStr) return 'Just now';
    const diff = (Date.now() - new Date(isoStr).getTime()) / 60000;
    if (diff < 1) return 'Just now';
    return `${Math.round(diff)}m ago`;
  };

  return (
    <div className="space-y-6 text-left select-none pb-24">
      <div>
        <h1 className="text-2xl font-display font-extrabold text-textPearl">Customer Alerts Center</h1>
        <p className="text-xs text-mutedAsh font-semibold">
          Real-time service alerts, kitchen orders ready, and diner requests console.
        </p>
      </div>

      {/* Filter Toolbar */}
      <Card className="p-4 bg-slate-900/40 border-slate-850 grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div className="space-y-1">
          <label className="text-[10px] text-slate-500 font-extrabold uppercase">Priority</label>
          <select
            value={filterPriority}
            onChange={e => setFilterPriority(e.target.value)}
            className="w-full bg-slate-955 border border-slate-800 rounded-xl p-2 text-xs text-slate-300 outline-none"
          >
            <option value="all">All Priorities</option>
            <option value="critical">💥 Critical</option>
            <option value="high">🔴 High</option>
            <option value="medium">🟡 Medium</option>
            <option value="low">⚪ Low</option>
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] text-slate-500 font-extrabold uppercase">Table</label>
          <select
            value={filterTable}
            onChange={e => setFilterTable(e.target.value)}
            className="w-full bg-slate-955 border border-slate-800 rounded-xl p-2 text-xs text-slate-300 outline-none"
          >
            <option value="all">All Tables</option>
            {uniqueTables.map(num => (
              <option key={num} value={num}>Table {num}</option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] text-slate-500 font-extrabold uppercase">Status</label>
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="w-full bg-slate-955 border border-slate-800 rounded-xl p-2 text-xs text-slate-300 outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Accepted">Accepted</option>
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] text-slate-500 font-extrabold uppercase">Alert Type</label>
          <select
            value={filterType}
            onChange={e => setFilterType(e.target.value)}
            className="w-full bg-slate-955 border border-slate-800 rounded-xl p-2 text-xs text-slate-300 outline-none"
          >
            <option value="all">All Types</option>
            {uniqueTypes.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
      </Card>

      {/* Alerts Feed */}
      {filteredAlerts.length === 0 ? (
        <Card className="p-12 text-center border-slate-850 bg-slate-900/10 rounded-3xl text-slate-500">
          <Bell className="w-10 h-10 text-slate-700 mx-auto mb-3 animate-pulse" />
          <p className="text-sm font-semibold">No active customer service alerts currently.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAlerts.map(alert => {
            const isCritical = alert.priority === 'critical';
            return (
              <Card
                key={alert.id}
                className={`p-5 border text-left rounded-2xl flex flex-col justify-between space-y-4 hover:brightness-110 transition-all ${
                  isCritical 
                    ? 'border-rose-500/30 bg-rose-500/5 ring-1 ring-rose-500/15'
                    : 'border-slate-850 bg-slate-900/20'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-slate-950 border border-slate-800 rounded-xl">
                      {getAlertIcon(alert.type)}
                    </div>
                    <div>
                      <h3 className="font-extrabold text-sm text-textPearl">{alert.type}</h3>
                      <span className="text-[9px] text-slate-500 font-extrabold uppercase">Table {alert.tableNumber}</span>
                    </div>
                  </div>
                  <Badge variant={isCritical ? 'danger' : alert.priority === 'high' ? 'warning' : 'muted'} className="uppercase">
                    {alert.priority}
                  </Badge>
                </div>

                <div className="text-xs text-slate-400 space-y-1 font-semibold">
                  <div>
                    <span className="text-slate-500">Order ID:</span>{' '}
                    <span className="font-mono text-[10px] text-slate-300">#{alert.orderId.substring(0, 10)}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Assigned Waiter:</span>{' '}
                    <span className="text-slate-350">{alert.assignedWaiter}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Request Details:</span>{' '}
                    <p className="text-[11px] text-slate-200 font-bold leading-relaxed">{alert.description}</p>
                  </div>
                  <div className="flex items-center space-x-1.5 text-[10px] text-slate-500 pt-1 font-bold">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{getMinutesElapsed(alert.createdAt)}</span>
                  </div>
                </div>

                {/* Operations Control Center Buttons */}
                <div className="flex gap-2 pt-2 border-t border-slate-800/40">
                  {alert.status === 'Pending' && alert.rawType === 'waiter_request' && (
                    <button
                      onClick={() => handleAcceptAlert(alert)}
                      className="flex-1 py-2 bg-primary text-slate-955 text-xs font-bold rounded-xl transition-all"
                    >
                      Accept
                    </button>
                  )}
                  <button
                    onClick={() => handleResolveAlert(alert)}
                    className="flex-1 py-2 bg-emerald-500 text-slate-955 text-xs font-bold rounded-xl transition-all"
                  >
                    Resolve
                  </button>
                  <button
                    onClick={() => handleEscalateAlert(alert)}
                    className="flex-1 py-2 bg-rose-500/10 hover:bg-rose-500/25 border border-rose-500/30 text-rose-400 text-xs font-bold rounded-xl transition-all"
                  >
                    Escalate
                  </button>
                  <button
                    onClick={() => handleDismissAlert(alert)}
                    className="p-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-400 rounded-xl transition-all"
                    title="Dismiss"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default WaiterAlerts;
