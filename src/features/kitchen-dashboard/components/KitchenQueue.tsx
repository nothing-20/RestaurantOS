import React, { useEffect, useState } from 'react';
import { 
  collection, 
  onSnapshot, 
  doc, 
  updateDoc 
} from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { useAuth } from '../../../context/AuthContext';
import { IOrder } from '../../../types';
import { formatPrice } from '../../../utils/format';

// UI Kit Primitives
import Card from '../../../components/ui/Card/Card';
import Badge from '../../../components/ui/Badge/Badge';
import LoadingSpinner from '../../../components/ui/LoadingSpinner/LoadingSpinner';

// Hot Toast notifications
import toast from 'react-hot-toast';
import { 
  Clock, 
  User, 
  Coffee, 
  CheckCircle2, 
  Play, 
  Check, 
  XCircle, 
  AlertTriangle 
} from 'lucide-react';

export const KitchenQueue: React.FC = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<IOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'new' | 'preparing' | 'ready' | 'completed'>('new');

  // Real-time listener to restaurants/{restaurantId}/orders
  useEffect(() => {
    if (!user?.tenantId) return;

    setIsLoading(true);
    const colRef = collection(db, 'restaurants', user.tenantId, 'orders');

    const unsubscribe = onSnapshot(
      colRef,
      (snapshot) => {
        const list: IOrder[] = [];
        snapshot.forEach((docSnap) => {
          list.push({ ...docSnap.data() } as IOrder);
        });
        
        // Sort ascending (older orders first for processing queue)
        list.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        
        setOrders(list);
        setIsLoading(false);
      },
      (error) => {
        console.error('Firestore listener failure', error);
        toast.error('Failed to connect to real-time order stream.');
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  // Advance status handler
  const handleUpdateStatus = async (orderId: string, nextStatus: IOrder['status']) => {
    if (!user?.tenantId) return;
    try {
      const docRef = doc(db, 'restaurants', user.tenantId, 'orders', orderId);
      await updateDoc(docRef, { status: nextStatus });
      toast.success(`Order status updated to ${nextStatus}`, { id: 'status-update-toast' });
    } catch (e) {
      console.error(e);
      toast.error('Failed to update order status.');
    }
  };

  // Grouping partitions
  const getFilteredOrders = () => {
    switch (activeTab) {
      case 'new':
        return orders.filter(o => o.status === 'PLACED' || o.status === 'ACCEPTED');
      case 'preparing':
        return orders.filter(o => o.status === 'PREPARING');
      case 'ready':
        return orders.filter(o => o.status === 'READY');
      case 'completed':
        return orders.filter(o => o.status === 'DELIVERED' || o.status === 'CANCELLED');
      default:
        return [];
    }
  };

  const currentTickets = getFilteredOrders();

  // Helper to format minutes elapsed
  const getMinutesElapsed = (createdAtStr: string) => {
    const elapsedMs = new Date().getTime() - new Date(createdAtStr).getTime();
    const elapsedMins = Math.floor(elapsedMs / 60000);
    if (elapsedMins < 1) return 'Just now';
    return `${elapsedMins}m ago`;
  };

  const getStatusBadge = (status: IOrder['status']) => {
    switch (status) {
      case 'PLACED':
        return <Badge variant="primary">New</Badge>;
      case 'ACCEPTED':
        return <Badge variant="warning">Accepted</Badge>;
      case 'PREPARING':
        return <Badge variant="warning" className="animate-pulse">Preparing</Badge>;
      case 'READY':
        return <Badge variant="success">Ready</Badge>;
      case 'DELIVERED':
        return <Badge variant="muted">Delivered</Badge>;
      case 'CANCELLED':
        return <Badge variant="danger">Cancelled</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 text-left select-none">
      {/* Header Info */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-display font-extrabold text-textPearl">Kitchen Workspace</h1>
          <p className="text-xs text-mutedAsh font-semibold">Active cooking tickets on the line.</p>
        </div>
        
        {/* Count indicators */}
        <div className="flex space-x-2 bg-slate-900 border border-slate-850 p-1.5 rounded-xl text-xs font-bold text-slate-400">
          <span className="px-2.5 py-1 rounded bg-slate-800 text-textPearl">Queue: {orders.filter(o => o.status !== 'DELIVERED' && o.status !== 'CANCELLED').length}</span>
        </div>
      </div>

      {/* Tabs list switches */}
      <div className="flex items-center space-x-2 p-1 border border-slate-850 bg-slate-900/30 rounded-2xl max-w-lg select-none">
        {(['new', 'preparing', 'ready', 'completed'] as const).map((tab) => {
          const count = orders.filter(o => {
            if (tab === 'new') return o.status === 'PLACED' || o.status === 'ACCEPTED';
            if (tab === 'preparing') return o.status === 'PREPARING';
            if (tab === 'ready') return o.status === 'READY';
            return o.status === 'DELIVERED' || o.status === 'CANCELLED';
          }).length;

          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 flex items-center justify-center space-x-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all duration-300 ${
                activeTab === tab 
                  ? 'bg-slate-800 text-primary border border-slate-850'
                  : 'text-slate-400 hover:text-textPearl hover:bg-slate-900/20'
              }`}
            >
              <span>{tab}</span>
              <span className={`px-1.5 py-0.5 rounded-md text-[10px] ${activeTab === tab ? 'bg-primary text-background' : 'bg-slate-800 text-slate-500'}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Queue Grid tickets */}
      {isLoading ? (
        <div className="h-64 flex items-center justify-center">
          <LoadingSpinner label="Fetching tickets queue..." />
        </div>
      ) : currentTickets.length === 0 ? (
        <div className="h-64 flex flex-col items-center justify-center text-center border border-dashed border-slate-850 rounded-3xl bg-slate-900/10">
          <CheckCircle2 className="w-10 h-10 text-slate-700 mb-2" />
          <p className="text-sm font-semibold text-slate-450">All caught up! No tickets in this section.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {currentTickets.map((order) => (
            <Card 
              key={order.orderId}
              className={`border-slate-850 bg-slate-900/40 p-5 rounded-2xl flex flex-col justify-between space-y-4 hover:border-slate-800 transition-all ${
                order.status === 'PLACED' ? 'ring-1 ring-primary/25 border-primary/20' : ''
              }`}
            >
              {/* Card Title Header */}
              <div className="flex justify-between items-start pb-3.5 border-b border-slate-850/60">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-display font-extrabold text-base text-textPearl">#{order.orderId.split('-')[1] || order.orderId}</span>
                    {getStatusBadge(order.status)}
                  </div>
                  <span className="text-[10px] font-bold text-primary uppercase tracking-wider mt-0.5">Table {order.tableNumber}</span>
                </div>
                <div className="flex items-center space-x-1 text-[10px] text-slate-500 font-semibold">
                  <Clock className="w-3 h-3" />
                  <span>{getMinutesElapsed(order.createdAt)}</span>
                </div>
              </div>

              {/* Items checklist */}
              <div className="flex-1 space-y-2.5">
                <div className="flex items-center space-x-1.5 text-xs text-slate-450 font-semibold mb-2">
                  <Coffee className="w-3.5 h-3.5" />
                  <span>Items</span>
                </div>
                <div className="space-y-2">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex items-start justify-between text-xs">
                      <div className="flex-1 pr-4">
                        <div className="flex items-center space-x-1.5">
                          <span className="font-bold text-textPearl">x{item.count}</span>
                          <span className="text-slate-300 font-semibold">{item.name}</span>
                        </div>
                        {item.notes ? (
                          <p className="text-[10px] text-primary italic pl-6 mt-0.5">"{item.notes}"</p>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Special Instructions at Order level */}
                {/* @ts-ignore */}
                {order.specialInstructions ? (
                  <div className="mt-4 p-3 bg-red-500/5 border border-red-500/10 rounded-xl">
                    <span className="text-[10px] uppercase font-bold text-red-400 tracking-wider flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      Kitchen Note
                    </span>
                    {/* @ts-ignore */}
                    <p className="text-[11px] text-red-300 mt-1 font-medium">"{order.specialInstructions}"</p>
                  </div>
                ) : null}
              </div>

              {/* Action operations controls */}
              <div className="pt-4 border-t border-slate-850/60 flex items-center justify-between gap-3">
                <div className="text-left shrink-0">
                  <span className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">Total Charge</span>
                  <div className="text-sm font-bold text-slate-300">{formatPrice(order.total)}</div>
                </div>

                {/* Transitions workflows buttons */}
                <div className="flex-1 flex justify-end space-x-2">
                  {order.status === 'PLACED' ? (
                    <button
                      onClick={() => handleUpdateStatus(order.orderId, 'ACCEPTED')}
                      className="px-3.5 py-1.5 bg-primary hover:bg-primary-hover text-background text-xs font-bold rounded-lg transition-colors flex items-center space-x-1"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Accept</span>
                    </button>
                  ) : null}

                  {order.status === 'ACCEPTED' ? (
                    <button
                      onClick={() => handleUpdateStatus(order.orderId, 'PREPARING')}
                      className="px-3.5 py-1.5 bg-yellow-500 hover:bg-yellow-600 text-slate-950 text-xs font-bold rounded-lg transition-colors flex items-center space-x-1"
                    >
                      <Play className="w-3.5 h-3.5" />
                      <span>Cook</span>
                    </button>
                  ) : null}

                  {order.status === 'PREPARING' ? (
                    <button
                      onClick={() => handleUpdateStatus(order.orderId, 'READY')}
                      className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-xs font-bold rounded-lg transition-colors flex items-center space-x-1"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Ready</span>
                    </button>
                  ) : null}

                  {order.status === 'READY' ? (
                    <button
                      onClick={() => handleUpdateStatus(order.orderId, 'DELIVERED')}
                      className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-lg transition-colors"
                    >
                      Deliver
                    </button>
                  ) : null}

                  {/* Cancel helper for uncompleted states */}
                  {order.status !== 'DELIVERED' && order.status !== 'CANCELLED' ? (
                    <button
                      onClick={() => handleUpdateStatus(order.orderId, 'CANCELLED')}
                      className="p-1.5 hover:bg-red-500/10 text-slate-500 hover:text-red-500 rounded-lg transition-colors"
                      title="Cancel Ticket"
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                  ) : null}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
export default KitchenQueue;
