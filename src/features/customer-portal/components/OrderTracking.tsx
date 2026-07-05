import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, onSnapshot, getDoc } from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { formatPrice } from '../../../utils/format';

// UI Kit components
import Card from '../../../components/ui/Card/Card';
import Button from '../../../components/ui/Button/Button';
import Badge from '../../../components/ui/Badge/Badge';
import LoadingSpinner from '../../../components/ui/LoadingSpinner/LoadingSpinner';

// Icons
import { Check, ArrowLeft, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

export const OrderTracking: React.FC = () => {
  const { tenantId, orderId } = useParams<{ tenantId: string; orderId: string }>();
  const navigate = useNavigate();

  const [order, setOrder] = useState<any | null>(null);
  const [restaurantName, setRestaurantName] = useState('Gourmet Restaurant');
  const [isLoading, setIsLoading] = useState(true);

  const steps = [
    { key: 'PLACED', label: 'Order Received', desc: 'Your ticket is on the kitchen queue.' },
    { key: 'ACCEPTED', label: 'Preparing', desc: 'The kitchen staff has accepted your ticket.' },
    { key: 'PREPARING', label: 'Cooking', desc: 'Your chef is currently preparing the dishes.' },
    { key: 'READY', label: 'Ready', desc: 'Food is plated and ready for pickup.' },
    { key: 'DELIVERED', label: 'Served', desc: 'Delivered to your table. Bon Appétit!' }
  ];

  const getActiveStepIndex = (status: string) => {
    switch (status) {
      case 'PLACED': return 0;
      case 'ACCEPTED': return 1;
      case 'PREPARING': return 2;
      case 'READY': return 3;
      case 'DELIVERED': return 4;
      default: return 0;
    }
  };

  useEffect(() => {
    if (!tenantId || !orderId) return;

    const fetchTenantName = async () => {
      try {
        const docRef = doc(db, 'tenants', tenantId);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          setRestaurantName(snap.data().restaurantName || snap.data().name || 'Gourmet Restaurant');
        }
      } catch (e) {
        console.error(e);
      }
    };
    fetchTenantName();

    const orderDocRef = doc(db, 'restaurants', tenantId, 'orders', orderId);
    const unsubscribe = onSnapshot(orderDocRef, (docSnap) => {
      if (docSnap.exists()) {
        setOrder({ id: docSnap.id, ...docSnap.data() });
      } else {
        toast.error('Order not found.');
      }
      setIsLoading(false);
    }, (err) => {
      console.error(err);
      toast.error('Failed to update tracking details.');
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [tenantId, orderId]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <LoadingSpinner label="Connecting to kitchen sync..." />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center select-none">
        <AlertTriangle className="w-12 h-12 text-slate-500 mb-3" />
        <h2 className="text-lg font-bold text-textPearl mb-1">No Active Orders found</h2>
        <p className="text-xs text-mutedAsh mb-4">We couldn't retrieve this order reference.</p>
        <Button onClick={() => navigate('/customer/restaurants')}>Go Discovery Page</Button>
      </div>
    );
  }

  const activeIndex = getActiveStepIndex(order.status);
  const isCancelled = order.status === 'CANCELLED';

  return (
    <div className="min-h-screen bg-slate-950 pb-16 text-left relative overflow-hidden select-none">
      <div className="absolute top-[-10%] left-[-15%] w-[600px] h-[600px] rounded-full bg-primary/10 blur-[150px] pointer-events-none" />

      <header className="bg-slate-900/40 border-b border-slate-850/60 sticky top-0 z-30 backdrop-blur-md">
        <div className="max-w-xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => navigate(`/customer/restaurant/${tenantId}/menu?table=${order.tableNumber || '1'}`)}
              className="p-2 bg-slate-800 hover:bg-slate-755 border border-slate-750 text-slate-400 hover:text-textPearl rounded-xl transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h1 className="text-sm font-display font-extrabold text-textPearl leading-tight">Order Tracking</h1>
              <span className="text-[10px] text-primary font-bold uppercase tracking-wider">ID: {orderId}</span>
            </div>
          </div>
          <Badge variant={isCancelled ? 'danger' : activeIndex === 4 ? 'success' : 'warning'}>
            {isCancelled ? 'Cancelled' : activeIndex === 4 ? 'Served' : 'In Progress'}
          </Badge>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-6 py-8 space-y-6 relative z-10">
        <Card className="p-6 border-slate-850 bg-slate-900/30 rounded-3xl space-y-5">
          <div className="text-center space-y-1">
            <h2 className="text-base font-display font-extrabold text-textPearl">{restaurantName}</h2>
            <span className="text-[11px] text-slate-550 font-bold block uppercase tracking-wider">Table #{order.tableNumber || 'Bar'}</span>
          </div>

          {isCancelled ? (
            <div className="p-4 bg-red-500/10 border border-red-500/25 rounded-2xl flex items-center gap-3 text-red-400 text-xs font-semibold">
              <AlertTriangle className="w-6 h-6" />
              <span>This order has been cancelled by the kitchen. Please consult the waiter staff.</span>
            </div>
          ) : (
            <div className="relative pl-6 border-l-2 border-slate-850 space-y-6 ml-3 py-1">
              {steps.map((step, idx) => {
                const isCompleted = idx < activeIndex;
                const isActive = idx === activeIndex;

                return (
                  <div key={step.key} className="relative flex items-start gap-4">
                    <div className={`absolute -left-[35px] w-6 h-6 rounded-full flex items-center justify-center border text-[10px] font-bold transition-all ${
                      isCompleted
                        ? 'bg-emerald-500 border-emerald-500 text-slate-950 shadow-md'
                        : isActive
                          ? 'bg-primary border-primary text-background shadow-lg shadow-primary/25 animate-pulse'
                          : 'bg-slate-900 border-slate-800 text-slate-550'
                    }`}>
                      {isCompleted ? <Check className="w-3.5 h-3.5" /> : idx + 1}
                    </div>

                    <div className="space-y-0.5">
                      <h3 className={`text-xs font-bold transition-colors ${
                        isActive ? 'text-primary' : isCompleted ? 'text-textPearl' : 'text-slate-500'
                      }`}>
                        {step.label}
                      </h3>
                      <p className={`text-[10px] transition-colors leading-relaxed ${
                        isActive ? 'text-slate-350 font-semibold' : 'text-slate-555'
                      }`}>
                        {step.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        <Card className="p-6 border-slate-850 bg-slate-900/30 rounded-3xl space-y-4">
          <h3 className="text-xs font-bold text-textPearl uppercase tracking-wider pb-2 border-b border-slate-850/60">Ordered Items</h3>
          
          <div className="space-y-3">
            {order.items?.map((item: any, idx: number) => (
              <div key={idx} className="flex justify-between items-start text-xs font-semibold">
                <div className="space-y-0.5">
                  <span className="text-slate-350">{item.name} x{item.count}</span>
                  {item.notes ? (
                    <p className="text-[9px] text-primary font-semibold">Instructions: {item.notes}</p>
                  ) : null}
                </div>
                <span className="text-textPearl">{formatPrice(item.pricePerUnit * item.count)}</span>
              </div>
            ))}
          </div>

          {order.specialInstructions ? (
            <div className="p-3 bg-slate-950/40 border border-slate-850 rounded-xl space-y-0.5">
              <span className="text-[9px] text-slate-500 font-bold uppercase block tracking-wider">Chef Instructions</span>
              <p className="text-[10px] text-slate-400 font-semibold italic">"{order.specialInstructions}"</p>
            </div>
          ) : null}

          <div className="bg-slate-950/30 border border-slate-850 p-4 rounded-2xl text-xs font-semibold text-slate-450 space-y-2 pt-3">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span className="text-textPearl">{formatPrice(order.subtotal || 0)}</span>
            </div>
            <div className="flex justify-between">
              <span>Tax & Service Charge</span>
              <span className="text-textPearl">{formatPrice(order.tax || 0)}</span>
            </div>
            <div className="flex justify-between text-textPearl font-extrabold text-sm pt-2.5 border-t border-slate-850/60">
              <span>Grand Total</span>
              <span className="text-primary">{formatPrice(order.total || 0)}</span>
            </div>
          </div>
        </Card>
      </main>
    </div>
  );
};

export default OrderTracking;
