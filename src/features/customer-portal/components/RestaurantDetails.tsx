import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, getDocs, onSnapshot } from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { ITenant } from '../../../types';

// UI Kit components
import Card from '../../../components/ui/Card/Card';
import Button from '../../../components/ui/Button/Button';
import Badge from '../../../components/ui/Badge/Badge';
import Modal from '../../../components/ui/Modal/Modal';
import LoadingSpinner from '../../../components/ui/LoadingSpinner/LoadingSpinner';

// Icons
import { Star, MapPin, Clock, Table, QrCode, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';

export const RestaurantDetails: React.FC = () => {
  const { tenantId } = useParams<{ tenantId: string }>();
  const navigate = useNavigate();

  const [restaurant, setRestaurant] = useState<ITenant | null>(null);
  const [tables, setTables] = useState<any[]>([]);
  const [occupiedTableNumbers, setOccupiedTableNumbers] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // QR Modal States
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [qrTenantInput, setQrTenantInput] = useState(tenantId || '');
  const [qrTableInput, setQrTableInput] = useState('1');
  const [isVerifyingQr, setIsVerifyingQr] = useState(false);

  // Manual Selection modal
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);

  const fetchRestaurantAndData = async () => {
    if (!tenantId) return;
    setIsLoading(true);
    try {
      // 1. Fetch Tenant details
      const tenantRef = doc(db, 'tenants', tenantId);
      const tenantSnap = await getDoc(tenantRef);
      if (tenantSnap.exists()) {
        setRestaurant({ id: tenantSnap.id, ...tenantSnap.data() } as ITenant);
      } else {
        toast.error('Restaurant not found.');
        navigate('/customer/restaurants');
        return;
      }
    } catch (e) {
      console.error('Failed to load restaurant details', e);
      toast.error('Error loading restaurant.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRestaurantAndData();
  }, [tenantId]);

  // Real-time subscription to tables list
  useEffect(() => {
    if (!tenantId) return;
    const tablesRef = collection(db, 'restaurants', tenantId, 'tables');
    
    const unsubscribe = onSnapshot(tablesRef, (snapshot) => {
      const list: any[] = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() });
      });
      list.sort((a, b) => parseInt(a.tableNumber || a.number || '0') - parseInt(b.tableNumber || b.number || '0'));
      setTables(list);
    }, (err) => {
      console.error('Failed to subscribe to tables collection:', err);
    });

    return () => unsubscribe();
  }, [tenantId]);

  // Real-time subscription to active orders to track table occupancy
  useEffect(() => {
    if (!tenantId) return;
    const ordersRef = collection(db, 'restaurants', tenantId, 'orders');
    
    const unsubscribe = onSnapshot(ordersRef, (snapshot) => {
      const activeTables: string[] = [];
      snapshot.forEach((doc) => {
        const order = doc.data();
        if (order.tableNumber && order.status !== 'DELIVERED' && order.status !== 'CANCELLED') {
          activeTables.push(String(order.tableNumber));
        }
      });
      setOccupiedTableNumbers(activeTables);
    }, (err) => {
      console.error('Failed to subscribe to table orders occupancy', err);
    });

    return () => unsubscribe();
  }, [tenantId]);

  // QR verification logic
  const handleVerifyQr = async () => {
    if (!qrTenantInput.trim()) {
      toast.error('Tenant ID is required.');
      return;
    }
    if (!qrTableInput.trim()) {
      toast.error('Table number is required.');
      return;
    }

    setIsVerifyingQr(true);
    try {
      const tenantRef = doc(db, 'tenants', qrTenantInput.trim());
      const tenantSnap = await getDoc(tenantRef);

      if (!tenantSnap.exists()) {
        toast.error('Invalid QR Code: Restaurant does not exist.');
        setIsVerifyingQr(false);
        return;
      }

      const tableRef = doc(db, 'restaurants', qrTenantInput.trim(), 'tables', `TBL-${qrTableInput}`);
      const tableSnap = await getDoc(tableRef);

      if (!tableSnap.exists()) {
        toast.error(`Invalid QR Code: Table #${qrTableInput} does not exist in this restaurant.`);
        setIsVerifyingQr(false);
        return;
      }

      if (occupiedTableNumbers.includes(qrTableInput)) {
        toast.error(`Table #${qrTableInput} is currently occupied.`);
        setIsVerifyingQr(false);
        return;
      }

      toast.success('QR Code verified! Joining menu session...');
      setIsQrModalOpen(false);
      navigate(`/customer/restaurant/${qrTenantInput.trim()}/menu?table=${qrTableInput}`);
    } catch (e) {
      console.error(e);
      toast.error('Failed to verify QR Code.');
    } finally {
      setIsVerifyingQr(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <LoadingSpinner label="Opening restaurant registry..." />
      </div>
    );
  }

  if (!restaurant) return null;

  const rName = restaurant.restaurantName || restaurant.name || 'Gourmet Restaurant';
  const rLogo = restaurant.logo || restaurant.logoUrl || 'https://picsum.photos/200/200?random=logo';
  const rCover = restaurant.coverImage || 'https://picsum.photos/800/600?random=cover';
  const rCuisine = restaurant.cuisine || 'Fine Dining';
  const rRating = restaurant.rating || 4.5;
  const rAddr = typeof restaurant.address === 'string' ? restaurant.address : `${restaurant.address?.street}, ${restaurant.address?.city}`;
  
  const totalTablesCount = tables.length || 8;
  const freeTablesCount = totalTablesCount - occupiedTableNumbers.length;

  return (
    <div className="min-h-screen bg-slate-950 pb-16 text-left relative overflow-hidden select-none">
      <div className="absolute top-[-10%] left-[-15%] w-[600px] h-[600px] rounded-full bg-primary/10 blur-[150px] pointer-events-none" />

      <div className="w-full h-64 relative bg-slate-950">
        <img src={rCover} alt={rName} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
        
        <button
          onClick={() => navigate('/customer/restaurants')}
          className="absolute top-6 left-6 p-2.5 bg-slate-900/80 hover:bg-slate-800 border border-slate-750/70 text-slate-350 hover:text-textPearl rounded-2xl transition-all backdrop-blur-md"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
      </div>

      <main className="max-w-4xl mx-auto px-6 -mt-20 relative z-10 space-y-6">
        <Card className="p-8 border-slate-850 bg-slate-900/60 backdrop-blur-md rounded-3xl space-y-6 shadow-2xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 rounded-2xl border border-slate-800 bg-slate-900 overflow-hidden shrink-0 flex items-center justify-center shadow-lg">
                <img src={rLogo} alt={rName} className="w-full h-full object-cover" />
              </div>
              <div className="space-y-1">
                <h1 className="text-2xl font-display font-extrabold text-textPearl leading-tight">{rName}</h1>
                <span className="text-xs text-primary font-bold uppercase tracking-wider">{rCuisine}</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center space-x-1.5 bg-amber-500/10 border border-amber-500/20 text-amber-500 px-3.5 py-1.5 rounded-xl text-sm font-bold shadow-lg shadow-amber-500/5">
                <Star className="w-4 h-4 fill-current animate-pulse" />
                <span>{rRating.toFixed(1)}</span>
              </div>
              
              <div className="bg-slate-955 border border-slate-800 px-3.5 py-1.5 rounded-xl text-xs font-bold text-slate-350 flex items-center space-x-1.5">
                <Table className="w-4 h-4 text-primary" />
                <span>{freeTablesCount} / {totalTablesCount} Free</span>
              </div>
            </div>
          </div>

          {restaurant.description ? (
            <p className="text-xs text-slate-400 leading-relaxed font-semibold">
              {restaurant.description}
            </p>
          ) : null}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-slate-950/40 border border-slate-850 rounded-2xl text-xs font-medium text-slate-300">
            <div className="flex items-start space-x-2.5">
              <MapPin className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <span>{rAddr}</span>
            </div>
            <div className="flex items-center space-x-2.5">
              <Clock className="w-4 h-4 text-primary" />
              <span>Open: 11:00 AM - 11:00 PM</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
            <button
              onClick={() => setIsQrModalOpen(true)}
              className="p-5 border border-slate-800 hover:border-primary bg-slate-950/45 hover:bg-slate-900/40 text-slate-350 hover:text-primary rounded-2xl flex flex-col items-center gap-3.5 transition-all duration-300 group shadow-lg"
            >
              <div className="w-12 h-12 bg-primary/10 border border-primary/20 rounded-xl flex items-center justify-center shadow-md shadow-primary/5 transition-transform duration-300 group-hover:scale-105">
                <QrCode className="w-6 h-6 text-primary" />
              </div>
              <div className="text-center space-y-0.5">
                <span className="text-sm font-bold text-textPearl">SCAN TABLE QR</span>
                <p className="text-[10px] text-slate-500 font-semibold">Instantly check in via QR code payload.</p>
              </div>
            </button>

            <button
              onClick={() => setIsManualModalOpen(true)}
              className="p-5 border border-slate-800 hover:border-primary bg-slate-950/45 hover:bg-slate-900/40 text-slate-350 hover:text-primary rounded-2xl flex flex-col items-center gap-3.5 transition-all duration-300 group shadow-lg"
            >
              <div className="w-12 h-12 bg-primary/10 border border-primary/20 rounded-xl flex items-center justify-center shadow-md shadow-primary/5 transition-transform duration-300 group-hover:scale-105">
                <Table className="w-6 h-6 text-primary" />
              </div>
              <div className="text-center space-y-0.5">
                <span className="text-sm font-bold text-textPearl">SELECT TABLE MANUALLY</span>
                <p className="text-[10px] text-slate-500 font-semibold">Choose from available dining table slots.</p>
              </div>
            </button>
          </div>
        </Card>
      </main>

      <Modal
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
        title="Simulated QR Scanner"
      >
        <div className="space-y-5 text-left">
          <div className="h-40 bg-slate-950 border border-slate-850 rounded-2xl relative flex flex-col items-center justify-center p-6 text-center select-none overflow-hidden">
            <div className="absolute inset-x-0 top-0 h-0.5 bg-primary/75 animate-bounce shadow-lg shadow-primary" />
            <QrCode className="w-14 h-14 text-primary animate-pulse mb-2" />
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Align Code Inside Frame</span>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold text-slate-450 block mb-1">DECODED TENANT ID</label>
                <input
                  type="text"
                  value={qrTenantInput}
                  onChange={(e) => setQrTenantInput(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-textPearl focus:border-primary outline-none"
                  disabled={isVerifyingQr}
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-450 block mb-1">DECODED TABLE #</label>
                <select
                  value={qrTableInput}
                  onChange={(e) => setQrTableInput(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-textPearl focus:border-primary outline-none cursor-pointer"
                  disabled={isVerifyingQr}
                >
                  {Array.from({ length: 8 }, (_, i) => (
                    <option key={i + 1} value={String(i + 1)}>Table #{i + 1}</option>
                  ))}
                </select>
              </div>
            </div>

            <Button
              onClick={handleVerifyQr}
              className="w-full"
              isLoading={isVerifyingQr}
            >
              Verify QR Code & Open Menu
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isManualModalOpen}
        onClose={() => setIsManualModalOpen(false)}
        title="Choose a Dining Table"
      >
        <div className="space-y-5 text-left">
          <p className="text-xs text-slate-450 font-semibold leading-relaxed">
            Select an active table below. Occupied tables have active kitchen/waiter tickets and are disabled.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {tables.length === 0 ? (
              <div className="col-span-full py-8 text-center text-xs text-slate-500 font-semibold">
                No tables are currently configured for this restaurant.
              </div>
            ) : (
              tables.map((t) => {
                const tableNum = t.tableNumber || t.number;
                const isOccupied = occupiedTableNumbers.includes(tableNum) || t.status === 'Occupied' || t.status === 'Cleaning' || !t.isActive;

                return (
                  <button
                    key={t.id}
                    onClick={() => {
                      if (isOccupied) return;
                      setIsManualModalOpen(false);
                      navigate(`/customer/restaurant/${tenantId}/menu?table=${tableNum}`);
                    }}
                    disabled={isOccupied}
                    className={`p-4 rounded-2xl border text-center flex flex-col items-center justify-center gap-1.5 transition-all select-none ${
                      isOccupied
                        ? 'bg-slate-950 border-slate-900/60 opacity-40 cursor-not-allowed text-slate-555'
                        : 'bg-slate-900/40 border-slate-850 hover:border-primary text-slate-355 hover:text-primary cursor-pointer hover:bg-slate-900'
                    }`}
                  >
                    <Table className={`w-5 h-5 ${isOccupied ? 'text-slate-650' : 'text-primary'}`} />
                    <span className="text-xs font-bold text-textPearl">Table {tableNum}</span>
                    <Badge variant={isOccupied ? 'danger' : 'success'}>
                      {isOccupied ? 'Occupied' : 'Available'}
                    </Badge>
                  </button>
                );
              })
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default RestaurantDetails;
