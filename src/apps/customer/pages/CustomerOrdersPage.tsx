import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, onSnapshot, getDocs } from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { useAuth } from '../../../context/AuthContext';
import { formatPrice } from '../../../shared/utils/format';

import Card from '../../../components/ui/Card/Card';
import Badge from '../../../components/ui/Badge/Badge';
import Button from '../../../components/ui/Button/Button';
import LoadingSpinner from '../../../components/ui/LoadingSpinner/LoadingSpinner';

import { 
  Utensils, Clock, ChevronRight, ShoppingBag, 
  CheckCircle2, AlertTriangle, ArrowRight, RefreshCw, Calendar
} from 'lucide-react';

export const CustomerOrdersPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [activeOrders, setActiveOrders] = useState<any[]>([]);
  const [pastOrders, setPastOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch active session orders and customer order history from Firestore
  useEffect(() => {
    setIsLoading(true);

    const savedSessionStr = sessionStorage.getItem('restaurantos_dining_session') || localStorage.getItem('restaurantos_dining_session');
    let sessionTenantId = '';
    let sessionId = '';
    if (savedSessionStr) {
      try {
        const parsed = JSON.parse(savedSessionStr);
        sessionTenantId = parsed.restaurantId || parsed.tenantId || '';
        sessionId = parsed.sessionId || '';
      } catch (e) {
        console.error('Failed to parse cached session', e);
      }
    }

    if (!sessionTenantId && !user?.uid) {
      setActiveOrders([]);
      setPastOrders([]);
      setIsLoading(false);
      return;
    }

    const targetTenant = sessionTenantId;
    if (!targetTenant) {
      // Query user orders from user's orders collection if no active tenant session
      const userOrdersRef = collection(db, 'users', user!.uid, 'orders');
      const unsubUserOrders = onSnapshot(userOrdersRef, (snap) => {
        const active: any[] = [];
        const past: any[] = [];
        snap.forEach(d => {
          const data = d.data();
          const orderObj = { id: d.id, ...data };
          const statusUpper = (data.status || 'NEW').toUpperCase();
          if (['COMPLETED', 'CANCELLED'].includes(statusUpper)) {
            past.push(orderObj);
          } else {
            active.push(orderObj);
          }
        });
        active.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
        past.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
        setActiveOrders(active);
        setPastOrders(past);
        setIsLoading(false);
      }, (err) => {
        console.error('Failed to fetch customer user orders:', err);
        setActiveOrders([]);
        setPastOrders([]);
        setIsLoading(false);
      });
      return () => unsubUserOrders();
    }

    // Real-time listener for tenant orders filtered by customerId
    const ordersRef = collection(db, 'restaurants', targetTenant, 'orders');
    const qOrders = user?.uid ? query(ordersRef, where('customerId', '==', user.uid)) : ordersRef;
    const unsub = onSnapshot(qOrders, (snap) => {
      const active: any[] = [];
      const past: any[] = [];

      snap.forEach(d => {
        const data = d.data();
        const orderObj = { id: d.id, ...data };
        const statusUpper = (data.status || 'NEW').toUpperCase();

        if (['COMPLETED', 'CANCELLED'].includes(statusUpper)) {
          past.push(orderObj);
        } else {
          active.push(orderObj);
        }
      });

      // Sort newest orders first
      active.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      past.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

      setActiveOrders(active);
      setPastOrders(past);
      setIsLoading(false);
    }, (err) => {
      console.error('Failed to fetch tenant orders:', err);
      setActiveOrders([]);
      setPastOrders([]);
      setIsLoading(false);
    });

    return () => unsub();
  }, [user]);

  const getStatusBadge = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'NEW':
      case 'PLACED':
        return <Badge variant="warning">Order Received</Badge>;
      case 'ACCEPTED':
      case 'CONFIRMED':
        return <Badge variant="primary">Accepted</Badge>;
      case 'PREPARING':
        return <Badge variant="warning">Preparing</Badge>;
      case 'READY':
        return <Badge variant="success">Ready</Badge>;
      case 'DELIVERED':
      case 'SERVED':
      case 'COMPLETED':
        return <Badge variant="success">Served</Badge>;
      case 'CANCELLED':
        return <Badge variant="danger">Cancelled</Badge>;
      default:
        return <Badge variant="primary">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="py-20 text-center select-none">
        <LoadingSpinner label="Retrieving your orders history..." />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 text-left select-none pb-16">
      
      {/* HEADER */}
      <div className="space-y-1">
        <h1 className="text-2xl font-display font-extrabold text-[#242424]">Your Orders</h1>
        <p className="text-xs text-[#6B6B6B] font-medium">Track active kitchen orders and view dining receipt history.</p>
      </div>

      {/* ACTIVE ORDERS SECTION */}
      <div className="space-y-3">
        <div className="flex justify-between items-center pr-1">
          <h2 className="text-xs font-extrabold uppercase tracking-widest text-[#E85D3F] flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            <span>Active Orders ({activeOrders.length})</span>
          </h2>
        </div>

        {activeOrders.length === 0 ? (
          <div className="p-10 text-center bg-white border border-[#EEE7E1] rounded-3xl space-y-3 shadow-xs">
            <div className="w-12 h-12 bg-[#FFF8F2] border border-[#EEE7E1] rounded-2xl flex items-center justify-center text-[#E85D3F] mx-auto">
              <Utensils className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-extrabold text-[#242424]">Your next delicious order is waiting.</h3>
              <p className="text-xs text-[#6B6B6B]">Discover restaurants near you and place your first order!</p>
            </div>
            <button
              onClick={() => navigate('/customer/home')}
              className="px-5 py-2.5 bg-[#E85D3F] hover:bg-[#D04B2F] text-white text-xs font-extrabold rounded-xl transition-all shadow-md shadow-[#E85D3F]/20 cursor-pointer"
            >
              Explore Restaurants
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {activeOrders.map(order => (
              <Card
                key={order.id}
                className="p-5 bg-white border border-[#EEE7E1] hover:border-[#E85D3F]/40 rounded-3xl space-y-4 shadow-xs hover:shadow-md transition-all"
              >
                <div className="flex justify-between items-start pb-3 border-b border-[#EEE7E1]">
                  <div className="space-y-0.5">
                    <span className="text-[9px] text-[#6B6B6B] font-bold uppercase tracking-wider block">Order ID</span>
                    <span className="text-xs font-extrabold text-[#242424]">#{order.orderId || order.id}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getStatusBadge(order.status)}
                    <span className="text-[10px] bg-[#FFF8F2] border border-[#EEE7E1] px-2.5 py-1 rounded-full text-[#242424] font-bold">
                      Table #{order.tableNumber || order.tableId?.replace('TBL-', '') || '01'}
                    </span>
                  </div>
                </div>

                {/* Items Summary */}
                <div className="space-y-1.5 text-xs">
                  {order.items?.map((item: any, idx: number) => (
                    <div key={idx} className="flex justify-between text-[#242424] font-semibold">
                      <span>{item.name} x{item.count || item.quantity || 1}</span>
                      <span className="font-mono text-[#6B6B6B]">{formatPrice(item.pricePerUnit * (item.count || 1))}</span>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between items-center pt-3 border-t border-[#EEE7E1] text-xs">
                  <div>
                    <span className="text-[9px] text-[#6B6B6B] font-bold uppercase block">Total Amount</span>
                    <strong className="text-base text-[#E85D3F] font-extrabold">{formatPrice(order.total || order.totalAmount || 0)}</strong>
                  </div>
                  <Button
                    onClick={() => navigate(`/customer/restaurant/${order.tenantId || 'l-ambroisie'}/order/${order.orderId || order.id}`)}
                    className="bg-[#E85D3F] hover:bg-[#D04B2F] text-white text-xs font-extrabold py-2.5 px-4 rounded-xl flex items-center gap-1 shadow-md shadow-[#E85D3F]/20 cursor-pointer"
                  >
                    <span>Track Live Status</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* PAST ORDERS HISTORY SECTION */}
      <div className="space-y-3 pt-4">
        <h2 className="text-xs font-extrabold uppercase tracking-widest text-[#6B6B6B] flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-[#E85D3F]" />
          <span>Past Orders ({pastOrders.length})</span>
        </h2>

        {pastOrders.length === 0 ? (
          <div className="p-8 text-center bg-white border border-[#EEE7E1] rounded-3xl text-xs text-[#6B6B6B] shadow-xs">
            No completed order logs found.
          </div>
        ) : (
          <div className="space-y-3">
            {pastOrders.map(order => (
              <Card key={order.id} className="p-4 bg-white border border-[#EEE7E1] hover:border-[#E85D3F]/40 rounded-2xl flex items-center justify-between shadow-xs transition-all">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-extrabold text-[#242424]">Order #{order.orderId || order.id}</span>
                    {getStatusBadge(order.status)}
                  </div>
                  <div className="text-[10.5px] text-[#6B6B6B] font-medium flex items-center space-x-2">
                    <span>Table #{order.tableNumber || '01'}</span>
                    <span>•</span>
                    <span>{order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'Recent'}</span>
                    <span>•</span>
                    <span>{order.items?.length || 0} items</span>
                  </div>
                </div>
                <div className="text-right space-y-1">
                  <span className="text-sm font-extrabold text-[#242424] block">{formatPrice(order.total || order.totalAmount || 0)}</span>
                  <button
                    onClick={() => navigate(`/customer/restaurant/${order.tenantId || 'l-ambroisie'}/menu`)}
                    className="text-xs bg-[#FFF8F2] border border-[#EEE7E1] hover:border-[#E85D3F]/40 text-[#E85D3F] px-3 py-1 rounded-xl font-extrabold transition-all cursor-pointer"
                  >
                    Order Again
                  </button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};

export default CustomerOrdersPage;
