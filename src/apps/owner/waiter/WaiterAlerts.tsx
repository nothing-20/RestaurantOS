import React, { useEffect, useState, useCallback } from 'react';
import { 
  collection, 
  onSnapshot, 
  doc, 
  deleteDoc,
  updateDoc,
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

// Hot Toast notifications
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
  ChefHat
} from 'lucide-react';

type TAlertTab = 'ready_orders' | 'qr_alerts' | 'customer_requests';

export const WaiterAlerts: React.FC = () => {
  const { user } = useAuth();
  
  const [requests, setRequests] = useState<IServiceRequest[]>([]);
  const [waiterRequests, setWaiterRequests] = useState<any[]>([]);
  const [readyOrders, setReadyOrders] = useState<IOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Default to kitchen-ready tab (kitchen-first operational flow)
  const [activeTab, setActiveTab] = useState<TAlertTab>('ready_orders');

  // ── Subscribe to READY orders from kitchen ──────────────────────────────────
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

  // ── Subscribe to Legacy QR Table Alerts ─────────────────────────────────────
  useEffect(() => {
    if (!user?.tenantId) return;

    setIsLoading(true);
    const colRef = collection(db, 'restaurants', user.tenantId, 'requests');

    const unsubscribe = onSnapshot(
      colRef,
      (snapshot) => {
        const list: IServiceRequest[] = [];
        snapshot.forEach((docSnap) => {
          list.push({ ...docSnap.data() } as IServiceRequest);
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

  // ── Subscribe to Call Waiter Assistance Requests ─────────────────────────────
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

  // ── Mark order as DELIVERED ──────────────────────────────────────────────────
  const handleMarkDelivered = useCallback(async (orderId: string) => {
    if (!user?.tenantId) return;
    try {
      const docRef = doc(db, 'restaurants', user.tenantId, 'orders', orderId);
      const timelineEvent = {
        type: 'DELIVERED',
        title: 'Delivered',
        description: `Delivered by Waiter ${user.displayName || user.email}`,
        timestamp: new Date().toISOString(),
        performedBy: user.displayName || 'Waiter'
      };
      await updateDoc(docRef, { 
        status: 'DELIVERED', 
        deliveredAt: new Date().toISOString(),
        timeline: arrayUnion(timelineEvent)
      });
      toast.success('Order marked as Delivered! ✓', { id: `deliver-${orderId}` });
    } catch (e) {
      console.error(e);
      toast.error('Failed to mark order as delivered.');
    }
  }, [user?.tenantId, user?.displayName]);

  // ── Clear Legacy QR Alert ────────────────────────────────────────────────────
  const handleResolveAlert = async (id: string) => {
    if (!user?.tenantId) return;
    try {
      const docRef = doc(db, 'restaurants', user.tenantId, 'requests', id);
      await deleteDoc(docRef);
      toast.success('Request marked as completed!', { id: 'alert-clear-toast' });
    } catch (e) {
      console.error(e);
      toast.error('Failed to clear request.');
    }
  };

  // ── Accept / Complete Call Waiter Requests ───────────────────────────────────
  const handleUpdateStatus = async (requestId: string, nextStatus: 'Accepted' | 'Completed') => {
    if (!user?.tenantId) return;
    try {
      const docRef = doc(db, 'restaurants', user.tenantId, 'waiterRequests', requestId);
      await updateDoc(docRef, { status: nextStatus });
      toast.success(`Request marked as ${nextStatus}!`);
    } catch (e) {
      console.error(e);
      toast.error('Failed to update request.');
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'Call Waiter':
      case 'Request Waiter':
        return <User className="w-5 h-5 text-primary" />;
      case 'Water':
      case 'Need Water':
        return <Coffee className="w-5 h-5 text-sky-400" />;
      case 'Bill':
      case 'Ready to Pay':
        return <DollarSign className="w-5 h-5 text-emerald-500" />;
      default:
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
    }
  };

  const getMinutesElapsed = (createdAtStr: string) => {
    if (!createdAtStr) return 'Just now';
    const elapsedMs = new Date().getTime() - new Date(createdAtStr).getTime();
    const elapsedMins = Math.floor(elapsedMs / 60000);
    if (elapsedMins < 1) return 'Just now';
    return `${elapsedMins}m ago`;
  };

  const pendingCustomerRequestsCount = waiterRequests.filter(r => r.status === 'Pending').length;

  return (
    <div className="space-y-6 text-left select-none pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-extrabold text-textPearl">Waiter Alerts Hub</h1>
          <p className="text-xs text-mutedAsh font-semibold">
            Kitchen pickup alerts, QR table notifications, and guest assistance requests.
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-805 p-1 rounded-xl flex items-center space-x-1 self-start flex-wrap gap-y-1">
          <button
            onClick={() => setActiveTab('ready_orders')}
            className={`relative px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'ready_orders'
                ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
                : 'text-slate-400 hover:text-textPearl'
            }`}
          >
            <UtensilsCrossed className="w-3.5 h-3.5" />
            Kitchen Ready
            {readyOrders.length > 0 && (
              <span className="w-4 h-4 rounded-full bg-emerald-500 text-slate-950 text-[9px] font-extrabold flex items-center justify-center animate-pulse">
                {readyOrders.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('qr_alerts')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'qr_alerts'
                ? 'bg-slate-800 text-textPearl'
                : 'text-slate-400 hover:text-textPearl'
            }`}
          >
            QR Alerts ({requests.length})
          </button>

          <button
            onClick={() => setActiveTab('customer_requests')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'customer_requests'
                ? 'bg-slate-800 text-textPearl'
                : 'text-slate-400 hover:text-textPearl'
            }`}
          >
            Diner Requests ({waiterRequests.length})
            {pendingCustomerRequestsCount > 0 && (
              <span className="w-2.5 h-2.5 bg-primary rounded-full animate-pulse" />
            )}
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="h-64 flex items-center justify-center">
          <LoadingSpinner label="Connecting to requests feed..." />
        </div>
      ) : activeTab === 'ready_orders' ? (
        readyOrders.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-center border border-dashed border-slate-850 rounded-3xl bg-slate-900/10">
            <ChefHat className="w-10 h-10 text-slate-705 mb-3" />
            <p className="text-sm font-semibold text-slate-500">No kitchen orders ready for pickup yet.</p>
            <p className="text-xs text-slate-600 mt-1">Orders appear here when kitchen marks them Ready.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {readyOrders.map((order) => (
              <Card
                key={order.orderId}
                className="p-0 border-emerald-500/20 bg-emerald-950/10 overflow-hidden rounded-2xl ring-1 ring-emerald-500/10"
              >
                <div className="px-4 py-3 bg-emerald-900/10 border-b border-emerald-500/15 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-sm font-extrabold text-emerald-300">
                      Table {order.tableNumber}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 text-[10px] text-slate-500">
                    <Clock className="w-3 h-3" />
                    <span>{getMinutesElapsed(order.createdAt)}</span>
                    <span className="text-slate-700">·</span>
                    <span className="font-mono">#{(order.orderId || '').substring(0, 8)}</span>
                  </div>
                </div>

                <div className="p-4 space-y-2">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex items-start space-x-2 text-xs">
                      <span className="font-extrabold text-emerald-400 min-w-[20px]">×{item.count}</span>
                      <div className="flex-1">
                        <span className="font-semibold text-slate-300">{item.name}</span>
                        {item.notes && (
                          <p className="text-[10px] text-amber-400 italic mt-0.5">"{item.notes}"</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="px-4 pb-4">
                  <button
                    onClick={() => handleMarkDelivered(order.orderId)}
                    className="w-full py-2.5 rounded-xl text-xs font-extrabold uppercase tracking-wider border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-slate-950 transition-all flex items-center justify-center space-x-1.5"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Mark Delivered to Table</span>
                  </button>
                </div>
              </Card>
            ))}
          </div>
        )
      ) : activeTab === 'qr_alerts' ? (
        requests.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-center border border-dashed border-slate-850 rounded-3xl bg-slate-900/10">
            <Check className="w-10 h-10 text-slate-705 mb-2" />
            <p className="text-sm font-semibold text-slate-450">Zero active service alerts.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {requests.map((req) => (
              <Card 
                key={req.id}
                className="p-5 border-slate-850 bg-slate-900/40 flex items-center justify-between space-x-4 hover:border-slate-800 transition-all ring-1 ring-primary/10"
              >
                <div className="flex items-center space-x-3.5">
                  <div className="w-10 h-10 rounded-xl bg-slate-955 border border-slate-800 flex items-center justify-center shrink-0">
                    {getAlertIcon(req.type)}
                  </div>
                  
                  <div className="space-y-1 text-left">
                    <div className="flex items-center space-x-2">
                      <h3 className="font-display font-bold text-sm text-textPearl">{req.type}</h3>
                      <Badge variant="warning">Table {req.tableNumber}</Badge>
                    </div>
                    <div className="flex items-center space-x-1 text-[10px] text-slate-500 font-semibold">
                      <Clock className="w-3 h-3" />
                      <span>{getMinutesElapsed(req.createdAt)}</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleResolveAlert(req.id)}
                  className="p-2.5 bg-emerald-500/10 hover:bg-emerald-500 border border-emerald-500/20 hover:border-emerald-600 text-emerald-500 hover:text-slate-950 rounded-xl transition-all"
                  title="Mark Completed"
                >
                  <Check className="w-4 h-4" />
                </button>
              </Card>
            ))}
          </div>
        )
      ) : (
        waiterRequests.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-center border border-dashed border-slate-850 rounded-3xl bg-slate-900/10">
            <CheckSquare className="w-10 h-10 text-slate-705 mb-2" />
            <p className="text-sm font-semibold text-slate-450">No diner requests pending. Keep it up!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {waiterRequests.map((req) => (
              <Card 
                key={req.id}
                className="p-5 border-slate-855 bg-slate-900/40 flex flex-col justify-between gap-4 hover:border-slate-800 transition-all ring-1 ring-primary/10"
              >
                <div className="flex items-start justify-between space-x-4">
                  <div className="flex items-center space-x-3.5">
                    <div className="w-10 h-10 rounded-xl bg-slate-955 border border-slate-800 flex items-center justify-center shrink-0">
                      {getAlertIcon(req.requestType)}
                    </div>
                    
                    <div className="space-y-1 text-left">
                      <div className="flex items-center space-x-2">
                        <h3 className="font-display font-bold text-sm text-textPearl">{req.requestType}</h3>
                        <Badge variant="warning">Table {req.tableNumber}</Badge>
                      </div>
                      <div className="flex items-center space-x-1 text-[10px] text-slate-500 font-semibold">
                        <Clock className="w-3 h-3" />
                        <span>{getMinutesElapsed(req.createdAt)}</span>
                      </div>
                    </div>
                  </div>

                  <Badge variant={req.status === 'Accepted' ? 'success' : 'warning'}>
                    {req.status === 'Accepted' ? 'Accepted' : 'Pending'}
                  </Badge>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-slate-850/60 w-full">
                  {req.status === 'Pending' && (
                    <button
                      onClick={() => handleUpdateStatus(req.id, 'Accepted')}
                      className="flex-1 py-2 bg-primary/10 hover:bg-primary border border-primary/20 hover:border-primary text-primary hover:text-slate-950 text-xs font-bold rounded-xl transition-all"
                    >
                      Accept
                    </button>
                  )}
                  <button
                    onClick={() => handleUpdateStatus(req.id, 'Completed')}
                    className="flex-1 py-2 bg-emerald-500/10 hover:bg-emerald-500 border border-emerald-500/20 hover:border-emerald-600 text-emerald-500 hover:text-slate-950 text-xs font-bold rounded-xl transition-all"
                  >
                    Completed
                  </button>
                </div>
              </Card>
            ))}
          </div>
        )
      )}
    </div>
  );
};

export default WaiterAlerts;
