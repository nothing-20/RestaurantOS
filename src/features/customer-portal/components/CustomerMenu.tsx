import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { collection, getDocs, doc, getDoc, setDoc, query, onSnapshot } from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { IMenuItem, IOrderItem } from '../../../types';
import { useCart } from '../../../context/CartContext';
import { formatPrice } from '../../../utils/format';
import { useAuth } from '../../../context/AuthContext';

// UI Kit components
import Card from '../../../components/ui/Card/Card';
import Button from '../../../components/ui/Button/Button';
import Badge from '../../../components/ui/Badge/Badge';
import SearchBar from '../../../components/ui/SearchBar/SearchBar';
import Modal from '../../../components/ui/Modal/Modal';
import LoadingSpinner from '../../../components/ui/LoadingSpinner/LoadingSpinner';

// Icons
import { Star, ShoppingBag, Plus, Minus, Trash2, ArrowLeft, Clock, AlertTriangle, Bell, DollarSign, Check, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export const CustomerMenu: React.FC = () => {
  const { tenantId } = useParams<{ tenantId: string }>();
  const [searchParams] = useSearchParams();
  const tableId = searchParams.get('table') || '1';
  const navigate = useNavigate();
  const { user } = useAuth();

  const {
    cartItems,
    addItem,
    updateQuantity,
    removeItem,
    clearCart,
    cartSubtotal,
  } = useCart();

  // Database States
  const [menuItems, setMenuItems] = useState<IMenuItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<IMenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filtering & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [categories, setCategories] = useState<string[]>([]);
  const [showVegOnly, setShowVegOnly] = useState(false);
  const [showOffersOnly, setShowOffersOnly] = useState(false);
  const [showPopularOnly, setShowPopularOnly] = useState(false);

  // Modal / Panel States
  const [selectedItem, setSelectedItem] = useState<IMenuItem | null>(null);
  const [addItemCount, setAddItemCount] = useState(1);
  const [itemNotes, setItemNotes] = useState('');

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  const [restaurantName, setRestaurantName] = useState('Gourmet Restaurant');

  // Real-time Enhancements States
  const [tableOrders, setTableOrders] = useState<any[]>([]);
  const [activeRequests, setActiveRequests] = useState<any[]>([]);
  const [waiterOnTheWayMessage, setWaiterOnTheWayMessage] = useState<string | null>(null);
  const [isOrderSuccessOpen, setIsOrderSuccessOpen] = useState(false);
  const [successOrderId, setSuccessOrderId] = useState('');

  // Modals Visibility
  const [isTrackingOpen, setIsTrackingOpen] = useState(false);
  const [isBillOpen, setIsBillOpen] = useState(false);
  const [isCallWaiterOpen, setIsCallWaiterOpen] = useState(false);
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);

  const fetchTenant = async () => {
    if (!tenantId) return;
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

  const fetchMenu = async () => {
    if (!tenantId) return;
    setIsLoading(true);
    try {
      const colRef = collection(db, 'restaurants', tenantId, 'menu');
      const querySnap = await getDocs(query(colRef));
      const items: IMenuItem[] = [];
      const catSet = new Set<string>();

      querySnap.forEach((doc) => {
        const item = { id: doc.id, ...doc.data() } as IMenuItem;
        items.push(item);
        if (item.category) catSet.add(item.category);
      });

      setMenuItems(items);
      setFilteredItems(items);
      setCategories(Array.from(catSet));
    } catch (e) {
      console.error(e);
      toast.error('Failed to load restaurant menu.');
    } finally {
      setIsLoading(false);
    }
  };

  // Real-time table orders listener
  useEffect(() => {
    if (!tenantId || !tableId) return;

    const colRef = collection(db, 'restaurants', tenantId, 'orders');
    const unsubscribe = onSnapshot(colRef, (snapshot) => {
      const list: any[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        if (String(data.tableNumber) === String(tableId)) {
          list.push({ id: doc.id, ...data });
        }
      });
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setTableOrders(list);
    }, (err) => {
      console.error('Failed to subscribe to table orders', err);
    });

    return () => unsubscribe();
  }, [tenantId, tableId]);

  // Real-time waiter requests listener
  useEffect(() => {
    if (!tenantId || !tableId) return;

    const colRef = collection(db, 'restaurants', tenantId, 'waiterRequests');
    const unsubscribe = onSnapshot(colRef, (snapshot) => {
      const list: any[] = [];
      let onTheWay: string | null = null;
      snapshot.forEach((doc) => {
        const data = doc.data();
        if (String(data.tableNumber) === String(tableId) && data.status !== 'Completed') {
          list.push({ id: doc.id, ...data });
          if (data.status === 'Accepted') {
            onTheWay = `Waiter is on the way (Request: ${data.requestType})`;
          }
        }
      });
      setActiveRequests(list);
      setWaiterOnTheWayMessage(onTheWay);
    }, (err) => {
      console.error('Failed to subscribe to waiter requests', err);
    });

    return () => unsubscribe();
  }, [tenantId, tableId]);

  useEffect(() => {
    fetchTenant();
    fetchMenu();
  }, [tenantId]);

  useEffect(() => {
    let filtered = [...menuItems];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.name.toLowerCase().includes(q) ||
          item.description.toLowerCase().includes(q)
      );
    }

    if (activeCategory !== 'all') {
      filtered = filtered.filter((item) => item.category === activeCategory);
    }

    if (showVegOnly) {
      filtered = filtered.filter((item) => item.veg || item.isVeg);
    }

    if (showOffersOnly) {
      filtered = filtered.filter((item) => item.discountPrice && item.discountPrice < item.price);
    }

    if (showPopularOnly) {
      filtered = filtered.filter((item) => (item.rating || 0) >= 4.5);
    }

    setFilteredItems(filtered);
  }, [searchQuery, activeCategory, showVegOnly, showOffersOnly, showPopularOnly, menuItems]);

  const handleSelectItem = (item: IMenuItem) => {
    if (item.available === false) {
      toast.error('This dish is currently out of stock.');
      return;
    }
    setSelectedItem(item);
    setAddItemCount(1);
    setItemNotes('');
  };

  const handleAddToCart = () => {
    if (!selectedItem) return;
    addItem(selectedItem, addItemCount, itemNotes);
    toast.success(`${selectedItem.name} added to cart!`);
    setSelectedItem(null);
  };

  const gstCharge = Math.round(cartSubtotal * 0.05);
  const serviceCharge = Math.round(cartSubtotal * 0.05);
  const cartTotalVal = cartSubtotal + gstCharge + serviceCharge;

  // Submit Order logic (stay on menu, clear cart, show success modal)
  const handlePlaceOrder = async () => {
    if (!tenantId || !tableId) return;
    if (cartItems.length === 0) return;

    setIsPlacingOrder(true);
    try {
      const orderId = `ORD-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      const docRef = doc(db, 'restaurants', tenantId, 'orders', orderId);

      const itemsList = cartItems.map((item) => ({
        itemId: item.itemId,
        name: item.name,
        count: item.count,
        notes: item.notes,
        pricePerUnit: item.pricePerUnit,
      }));

      await setDoc(docRef, {
        orderId,
        customerId: user?.uid || 'guest-uid',
        customerName: user?.displayName || user?.email || 'Guest Diner',
        restaurantId: tenantId,
        tenantId,
        tableNumber: tableId,
        items: itemsList,
        subtotal: cartSubtotal,
        tax: gstCharge + serviceCharge,
        total: cartTotalVal,
        status: 'PLACED',
        paymentStatus: 'PENDING',
        specialInstructions,
        createdAt: new Date().toISOString(),
      });

      // Clear states
      clearCart();
      setSpecialInstructions('');
      setIsCartOpen(false);
      
      // Success modal
      setSuccessOrderId(orderId);
      setIsOrderSuccessOpen(true);
      toast.success('Order placed successfully!', { id: 'order-placed-success' });
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Failed to place order.');
    } finally {
      setIsPlacingOrder(false);
    }
  };

  // Submit waiter request
  const handleCallWaiter = async (requestType: string) => {
    if (!tenantId || !tableId) return;
    setIsSubmittingRequest(true);
    try {
      const requestId = `WR-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      const docRef = doc(db, 'restaurants', tenantId, 'waiterRequests', requestId);
      await setDoc(docRef, {
        id: requestId,
        tableNumber: tableId,
        customerId: user?.uid || 'guest-uid',
        requestType,
        status: 'Pending',
        createdAt: new Date().toISOString()
      });
      toast.success(`Request for "${requestType}" sent to staff!`);
      setIsCallWaiterOpen(false);
    } catch (e) {
      console.error(e);
      toast.error('Failed to submit request.');
    } finally {
      setIsSubmittingRequest(false);
    }
  };

  // Live Bill aggregation logic
  const billItems: { [key: string]: { name: string; count: number; pricePerUnit: number } } = {};
  let billSubtotal = 0;
  
  tableOrders
    .filter((o) => o.status !== 'CANCELLED')
    .forEach((o) => {
      o.items?.forEach((item: any) => {
        const key = item.itemId + '_' + item.pricePerUnit;
        if (billItems[key]) {
          billItems[key].count += item.count;
        } else {
          billItems[key] = {
            name: item.name,
            count: item.count,
            pricePerUnit: item.pricePerUnit
          };
        }
        billSubtotal += item.pricePerUnit * item.count;
      });
    });

  const billGst = Math.round(billSubtotal * 0.05);
  const billService = Math.round(billSubtotal * 0.05);
  const billTotal = billSubtotal + billGst + billService;

  const totalItemsCount = cartItems.reduce((acc, curr) => acc + curr.count, 0);

  const getTrackingStepIndex = (status: string) => {
    switch (status) {
      case 'PLACED': return 0;
      case 'ACCEPTED': return 1;
      case 'PREPARING': return 2;
      case 'READY': return 3;
      case 'DELIVERED': return 4;
      default: return 0;
    }
  };

  const trackingSteps = ['Received', 'Preparing', 'Cooking', 'Ready', 'Served'];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <LoadingSpinner label="Fetching menu card deck..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-955 pb-28 text-left relative overflow-hidden select-none">
      <div className="absolute top-[-10%] left-[-15%] w-[600px] h-[600px] rounded-full bg-primary/10 blur-[150px] pointer-events-none" />

      {/* TOP HEADER */}
      <header className="bg-slate-900/40 border-b border-slate-850/60 sticky top-0 z-30 backdrop-blur-md">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => navigate(`/customer/restaurant/${tenantId}`)}
              className="p-2 bg-slate-800 hover:bg-slate-755 border border-slate-750 text-slate-400 hover:text-textPearl rounded-xl transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h1 className="text-sm font-display font-extrabold text-textPearl leading-tight">{restaurantName}</h1>
              <span className="text-[10px] text-primary font-bold uppercase tracking-wider">Table #{tableId}</span>
            </div>
          </div>

          {/* Desktop Floating Action Buttons */}
          <div className="hidden md:flex items-center space-x-2">
            <button
              onClick={() => setIsTrackingOpen(true)}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-750 border border-slate-700/60 text-slate-350 hover:text-primary text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all relative"
            >
              <Clock className="w-4 h-4" />
              <span>Track Orders</span>
              {tableOrders.length > 0 && (
                <Badge variant="warning">{tableOrders.length}</Badge>
              )}
            </button>

            <button
              onClick={() => setIsBillOpen(true)}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-750 border border-slate-700/60 text-slate-350 hover:text-primary text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all"
            >
              <DollarSign className="w-4 h-4 text-emerald-500" />
              <span>Live Bill</span>
            </button>

            <button
              onClick={() => setIsCallWaiterOpen(true)}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-750 border border-slate-700/60 text-slate-350 hover:text-primary text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all relative"
            >
              <Bell className="w-4 h-4" />
              <span>Call Waiter</span>
              {activeRequests.length > 0 && (
                <span className="w-2 h-2 bg-primary rounded-full animate-ping" />
              )}
            </button>

            <button
              onClick={() => setIsCartOpen(true)}
              className="relative p-2.5 bg-slate-800 hover:bg-slate-755 border border-slate-750 text-slate-350 hover:text-textPearl rounded-xl transition-all"
            >
              <ShoppingBag className="w-4 h-4" />
              {totalItemsCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-primary text-background text-[10px] font-extrabold rounded-full flex items-center justify-center border border-slate-950">
                  {totalItemsCount}
                </span>
              )}
            </button>
          </div>

          {/* Mobile minimal cart toggle */}
          <div className="md:hidden">
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative p-2.5 bg-slate-800 border border-slate-750 text-slate-350 rounded-xl"
            >
              <ShoppingBag className="w-4 h-4" />
              {totalItemsCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-primary text-background text-[10px] font-extrabold rounded-full flex items-center justify-center border border-slate-950">
                  {totalItemsCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Real-time Waiter Service Alert Banner */}
      {waiterOnTheWayMessage && (
        <div className="bg-emerald-500/10 border border-emerald-500/35 p-3.5 rounded-2xl mx-6 mt-4 max-w-4xl md:mx-auto flex items-center justify-between text-emerald-400 text-xs font-bold animate-pulse shadow-lg shadow-emerald-500/5 select-none z-25 relative">
          <span>🔔 {waiterOnTheWayMessage}</span>
        </div>
      )}

      {/* MAIN CONTAINER */}
      <main className="max-w-4xl mx-auto px-6 py-6 space-y-6 relative z-10">
        <SearchBar
          placeholder="Search for delicious dishes, pizzas, biryanis..."
          value={searchQuery}
          onSearchChange={setSearchQuery}
        />

        <div className="space-y-4">
          <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-none select-none">
            <button
              onClick={() => setActiveCategory('all')}
              className={`px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-300 border ${
                activeCategory === 'all'
                  ? 'bg-primary border-primary text-background font-extrabold'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-textPearl'
              }`}
            >
              All Items
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-300 border ${
                  activeCategory === cat
                    ? 'bg-primary border-primary text-background font-extrabold'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-textPearl'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="flex items-center space-x-2 pb-2">
            <button
              onClick={() => setShowVegOnly(!showVegOnly)}
              className={`px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase transition-all duration-300 border ${
                showVegOnly
                  ? 'bg-accent border-accent text-white'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-textPearl'
              }`}
            >
              Veg Only
            </button>

            <button
              onClick={() => setShowOffersOnly(!showOffersOnly)}
              className={`px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase transition-all duration-300 border ${
                showOffersOnly
                  ? 'bg-emerald-500 border-emerald-500 text-slate-950'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-textPearl'
              }`}
            >
              Offers
            </button>

            <button
              onClick={() => setShowPopularOnly(!showPopularOnly)}
              className={`px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase transition-all duration-300 border ${
                showPopularOnly
                  ? 'bg-amber-500 border-amber-500 text-slate-950'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-textPearl'
              }`}
            >
              Popular
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredItems.length === 0 ? (
            <div className="col-span-full py-16 text-center border border-dashed border-slate-850 rounded-2xl bg-slate-900/10">
              <AlertTriangle className="w-8 h-8 text-slate-650 mx-auto mb-2" />
              <p className="text-sm text-slate-400 font-semibold">No items match your query.</p>
            </div>
          ) : (
            filteredItems.map((item) => {
              const isItemVeg = item.veg || item.isVeg;
              const hasOffer = item.discountPrice && item.discountPrice < item.price;

              return (
                <Card
                  key={item.id}
                  className={`p-4 border-slate-850 bg-slate-900/30 hover:border-slate-800 hover:bg-slate-900/60 flex items-start justify-between space-x-4 cursor-pointer transition-all ${
                    item.available === false ? 'opacity-40' : ''
                  }`}
                  onClick={() => handleSelectItem(item)}
                >
                  <div className="flex-1 flex flex-col text-left space-y-1">
                    <div className="flex items-center space-x-2">
                      <h3 className="font-display font-extrabold text-sm text-textPearl leading-tight">{item.name}</h3>
                      <Badge variant={isItemVeg ? 'success' : 'danger'}>
                        {isItemVeg ? 'Veg' : 'Non-Veg'}
                      </Badge>
                    </div>
                    <p className="text-[11px] text-mutedAsh font-medium line-clamp-2 leading-relaxed">{item.description}</p>
                    
                    <div className="flex items-center space-x-2 pt-1.5">
                      {hasOffer ? (
                        <>
                          <span className="text-sm font-extrabold text-textPearl">{formatPrice(item.discountPrice!)}</span>
                          <span className="text-[10px] text-slate-500 line-through">{formatPrice(item.price)}</span>
                        </>
                      ) : (
                        <span className="text-sm font-extrabold text-textPearl">{formatPrice(item.price)}</span>
                      )}
                    </div>

                    <div className="flex items-center space-x-3 pt-2 text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
                      {item.rating && (
                        <div className="flex items-center text-amber-500">
                          <Star className="w-3.5 h-3.5 fill-current mr-0.5" />
                          <span>{item.rating.toFixed(1)}</span>
                        </div>
                      )}
                      <div className="flex items-center space-x-1">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{item.preparationTime || 15} mins</span>
                      </div>
                    </div>
                  </div>

                  {item.imageUrl && (
                    <div className="w-20 h-20 rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 shrink-0 shadow-lg">
                      <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                    </div>
                  )}
                </Card>
              );
            })
          )}
        </div>
      </main>

      {/* FLOAT BASKET BAR (Desktop Only to avoid overlap with mobile bottom bar) */}
      {totalItemsCount > 0 && (
        <div className="hidden md:block fixed bottom-6 inset-x-4 z-40 max-w-lg mx-auto">
          <button
            onClick={() => setIsCartOpen(true)}
            className="w-full bg-primary hover:bg-primary-hover text-background font-display font-bold p-4 rounded-2xl flex items-center justify-between shadow-2xl shadow-primary/20"
          >
            <div className="flex items-center space-x-3.5">
              <ShoppingBag className="w-5 h-5" />
              <span>Checkout Basket ({totalItemsCount} items)</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span>{formatPrice(cartTotalVal)}</span>
              <ChevronRight className="w-4 h-4" />
            </div>
          </button>
        </div>
      )}

      {/* Mobile Sticky Bottom Action Bar */}
      <div className="md:hidden fixed bottom-0 inset-x-0 bg-slate-900/90 border-t border-slate-800 p-3.5 z-40 flex items-center justify-around shadow-2xl backdrop-blur-md">
        <button
          onClick={() => setIsTrackingOpen(true)}
          className="flex flex-col items-center justify-center gap-1.5 text-[10px] font-bold text-slate-400 hover:text-primary transition-colors relative w-16"
        >
          <Clock className="w-5 h-5 text-slate-300" />
          <span>Track</span>
          {tableOrders.length > 0 && (
            <span className="absolute top-[-4px] right-2 w-4 h-4 bg-primary text-background text-[9px] font-extrabold rounded-full flex items-center justify-center border border-slate-900">
              {tableOrders.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setIsBillOpen(true)}
          className="flex flex-col items-center justify-center gap-1.5 text-[10px] font-bold text-slate-400 hover:text-primary transition-colors w-16"
        >
          <DollarSign className="w-5 h-5 text-emerald-500 font-extrabold" />
          <span>Bill</span>
        </button>

        <button
          onClick={() => setIsCallWaiterOpen(true)}
          className="flex flex-col items-center justify-center gap-1.5 text-[10px] font-bold text-slate-400 hover:text-primary transition-colors relative w-16"
        >
          <Bell className="w-5 h-5 text-slate-300" />
          <span>Call Waiter</span>
          {activeRequests.length > 0 && (
            <span className="absolute top-[-3px] right-1.5 w-2.5 h-2.5 bg-primary rounded-full animate-ping" />
          )}
        </button>

        <button
          onClick={() => setIsCartOpen(true)}
          className="flex flex-col items-center justify-center gap-1.5 text-[10px] font-bold text-slate-400 hover:text-primary transition-colors relative w-16"
        >
          <ShoppingBag className="w-5 h-5 text-slate-300" />
          <span>Basket</span>
          {totalItemsCount > 0 && (
            <span className="absolute top-[-4px] right-2 w-4 h-4 bg-primary text-background text-[9px] font-extrabold rounded-full flex items-center justify-center border border-slate-900">
              {totalItemsCount}
            </span>
          )}
        </button>
      </div>

      {/* Modal Item Details */}
      <Modal
        isOpen={selectedItem !== null}
        onClose={() => setSelectedItem(null)}
        title={selectedItem?.name || 'Dish Details'}
      >
        {selectedItem && (
          <div className="space-y-4 text-left">
            {selectedItem.imageUrl && (
              <div className="w-full h-44 rounded-2xl overflow-hidden border border-slate-800 bg-slate-950">
                <img src={selectedItem.imageUrl} alt={selectedItem.name} className="w-full h-full object-cover" />
              </div>
            )}
            
            <p className="text-xs text-slate-400 font-medium leading-relaxed">{selectedItem.description}</p>
            
            <div className="flex items-center justify-between py-3 border-y border-slate-850">
              <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Quantity</span>
              <div className="flex items-center space-x-3.5">
                <button
                  onClick={() => setAddItemCount((prev) => Math.max(1, prev - 1))}
                  className="p-1.5 bg-slate-800 hover:bg-slate-750 text-slate-350 hover:text-textPearl rounded-xl transition-all"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="text-sm font-bold text-textPearl w-5 text-center">{addItemCount}</span>
                <button
                  onClick={() => setAddItemCount((prev) => prev + 1)}
                  className="p-1.5 bg-slate-800 hover:bg-slate-750 text-slate-350 hover:text-textPearl rounded-xl transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <Button
              onClick={handleAddToCart}
              className="w-full"
            >
              Add To Cart • {formatPrice((selectedItem.discountPrice || selectedItem.price) * addItemCount)}
            </Button>
          </div>
        )}
      </Modal>

      {/* Cart Basket Slide-out */}
      <Modal
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        title="Diner Basket"
      >
        <div className="space-y-4 text-left">
          {cartItems.length === 0 ? (
            <p className="text-center py-8 text-xs text-slate-500 font-bold uppercase">Your basket is empty.</p>
          ) : (
            <>
              <div className="space-y-3.5 divide-y divide-slate-850/60 max-h-60 overflow-y-auto pr-1">
                {cartItems.map((item) => (
                  <div key={item.itemId} className="flex items-start justify-between pt-3.5 first:pt-0">
                    <div className="flex-1 space-y-1">
                      <h4 className="text-xs font-bold text-textPearl leading-tight">{item.name}</h4>
                      {item.notes ? (
                        <p className="text-[10px] text-primary font-semibold">Instructions: {item.notes}</p>
                      ) : null}
                      <div className="text-[10px] text-slate-450 font-semibold">{formatPrice(item.pricePerUnit)} each</div>
                    </div>

                    <div className="flex items-center space-x-3.5 ml-4">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => updateQuantity(item.itemId, item.count - 1)}
                          className="p-1 bg-slate-800 hover:bg-slate-750 text-slate-400 hover:text-textPearl rounded-lg transition-all"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="text-xs font-extrabold text-textPearl w-4 text-center">{item.count}</span>
                        <button
                          onClick={() => updateQuantity(item.itemId, item.count + 1)}
                          className="p-1 bg-slate-800 hover:bg-slate-750 text-slate-400 hover:text-textPearl rounded-lg transition-all"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <button
                        onClick={() => removeItem(item.itemId)}
                        className="p-1 text-slate-500 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-1.5 pt-2">
                <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">Cooking Instructions</label>
                <textarea
                  placeholder="E.g., No spicy food, Make it extra hot, Water with lemon..."
                  value={specialInstructions}
                  onChange={(e) => setSpecialInstructions(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 focus:border-primary rounded-xl p-3 text-xs font-semibold text-textPearl outline-none"
                  rows={2}
                />
              </div>

              <div className="bg-slate-950/40 border border-slate-850 p-4 rounded-2xl space-y-2 text-xs font-semibold text-slate-400">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="text-textPearl">{formatPrice(cartSubtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>GST (5%)</span>
                  <span className="text-textPearl">{formatPrice(gstCharge)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Service Charge (5%)</span>
                  <span className="text-textPearl">{formatPrice(serviceCharge)}</span>
                </div>
                <div className="flex justify-between text-textPearl font-extrabold text-sm pt-2.5 border-t border-slate-850/60">
                  <span>Grand Total</span>
                  <span className="text-primary">{formatPrice(cartTotalVal)}</span>
                </div>
              </div>

              <Button
                onClick={handlePlaceOrder}
                className="w-full mt-2"
                isLoading={isPlacingOrder}
              >
                Confirm & Place Order
              </Button>
            </>
          )}
        </div>
      </Modal>

      {/* Real-time Order Tracking Drawer */}
      <Modal
        isOpen={isTrackingOpen}
        onClose={() => setIsTrackingOpen(false)}
        title="Live Order Tracking"
      >
        <div className="space-y-4 text-left max-h-[70vh] overflow-y-auto pr-1">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Active Table Orders</p>
          
          {tableOrders.length === 0 ? (
            <div className="py-8 text-center border border-dashed border-slate-800 rounded-2xl bg-slate-900/10">
              <Clock className="w-8 h-8 text-slate-700 mx-auto mb-2" />
              <p className="text-xs text-slate-400 font-semibold">No orders placed from this table yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {tableOrders.map((orderItem) => {
                const activeIndex = getTrackingStepIndex(orderItem.status);
                const isOrderCancelled = orderItem.status === 'CANCELLED';
                const dateStr = new Date(orderItem.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                return (
                  <Card key={orderItem.id} className="p-4.5 border-slate-850 bg-slate-950/40 rounded-2xl space-y-4">
                    <div className="flex items-center justify-between pb-2.5 border-b border-slate-850">
                      <div>
                        <span className="text-xs font-extrabold text-textPearl block">{orderItem.orderId || orderItem.id.substring(0, 10)}</span>
                        <span className="text-[9px] text-slate-550 font-bold block">Ordered at {dateStr}</span>
                      </div>
                      <Badge variant={isOrderCancelled ? 'danger' : activeIndex === 4 ? 'success' : 'warning'}>
                        {isOrderCancelled ? 'Cancelled' : trackingSteps[activeIndex]}
                      </Badge>
                    </div>

                    {/* Ordered Items list */}
                    <div className="text-[11px] font-semibold text-slate-400 space-y-1">
                      {orderItem.items?.map((item: any, idx: number) => (
                        <div key={idx} className="flex justify-between">
                          <span>• {item.name} x{item.count}</span>
                          <span className="text-textPearl">{formatPrice(item.pricePerUnit * item.count)}</span>
                        </div>
                      ))}
                    </div>

                    {isOrderCancelled ? (
                      <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-bold rounded-xl flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4" />
                        <span>Order cancelled by kitchen.</span>
                      </div>
                    ) : (
                      /* Live progress timeline */
                      <div className="pt-2">
                        <div className="flex items-center justify-between text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                          <span>Prep Stage Progress</span>
                          <span className="text-primary">{Math.round((activeIndex / 4) * 100)}%</span>
                        </div>
                        {/* Stepper bubbles */}
                        <div className="flex items-center justify-between relative px-2.5">
                          <div className="absolute top-1/2 left-4 right-4 h-[2px] bg-slate-850 -translate-y-1/2 z-0" />
                          <div 
                            className="absolute top-1/2 left-4 h-[2px] bg-primary -translate-y-1/2 z-0 transition-all duration-500" 
                            style={{ width: `${(activeIndex / 4) * 90}%` }}
                          />
                          {trackingSteps.map((step, idx) => {
                            const isDone = idx < activeIndex;
                            const isCur = idx === activeIndex;
                            return (
                              <div key={idx} className="flex flex-col items-center gap-1.5 relative z-10">
                                <div className={`w-5 h-5 rounded-full flex items-center justify-center border text-[9px] font-bold transition-all ${
                                  isDone
                                    ? 'bg-emerald-500 border-emerald-500 text-slate-950'
                                    : isCur
                                      ? 'bg-primary border-primary text-background ring-4 ring-primary/10'
                                      : 'bg-slate-900 border-slate-800 text-slate-500'
                                }`}>
                                  {isDone ? <Check className="w-3 h-3" /> : idx + 1}
                                </div>
                                <span className={`text-[8px] font-extrabold uppercase ${
                                  isCur ? 'text-primary' : isDone ? 'text-slate-350' : 'text-slate-550'
                                }`}>
                                  {step}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </Modal>

      {/* Real-time Live Running Bill Drawer */}
      <Modal
        isOpen={isBillOpen}
        onClose={() => setIsBillOpen(false)}
        title="Live running Bill"
      >
        <div className="space-y-5 text-left">
          <div className="pb-3.5 border-b border-slate-850">
            <h3 className="text-base font-display font-extrabold text-textPearl leading-tight">{restaurantName}</h3>
            <span className="text-[10px] text-primary font-bold uppercase tracking-wider block mt-1">Table Seating #{tableId}</span>
            <span className="text-[9px] text-slate-500 font-bold block mt-0.5">Running calculation across all table orders</span>
          </div>

          {Object.keys(billItems).length === 0 ? (
            <div className="py-8 text-center border border-dashed border-slate-850 rounded-2xl bg-slate-900/10">
              <DollarSign className="w-8 h-8 text-slate-700 mx-auto mb-2" />
              <p className="text-xs text-slate-450 font-semibold">Running bill is empty. Orders are pending.</p>
            </div>
          ) : (
            <>
              {/* Aggregated itemizations */}
              <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
                {Object.values(billItems).map((item: any, idx: number) => (
                  <div key={idx} className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-350">{item.name} x{item.count}</span>
                    <span className="text-textPearl">{formatPrice(item.pricePerUnit * item.count)}</span>
                  </div>
                ))}
              </div>

              {/* Running invoicing calculations */}
              <div className="bg-slate-950/40 border border-slate-850 p-4.5 rounded-2xl space-y-2.5 text-xs font-semibold text-slate-450 pt-3">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="text-textPearl">{formatPrice(billSubtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>GST (5%)</span>
                  <span className="text-textPearl">{formatPrice(billGst)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Service Charge (5%)</span>
                  <span className="text-textPearl">{formatPrice(billService)}</span>
                </div>
                <div className="flex justify-between text-textPearl font-extrabold text-sm pt-2.5 border-t border-slate-850/60">
                  <span>Running Grand Total</span>
                  <span className="text-primary">{formatPrice(billTotal)}</span>
                </div>
              </div>

              <div className="p-3 bg-primary/10 border border-primary/20 text-primary text-[10px] font-bold rounded-xl text-center">
                <span>Running invoice automatically syncs with kitchen updates.</span>
              </div>
            </>
          )}
        </div>
      </Modal>

      {/* Call Waiter popup Modal */}
      <Modal
        isOpen={isCallWaiterOpen}
        onClose={() => setIsCallWaiterOpen(false)}
        title="Need Assistance?"
      >
        <div className="space-y-4 text-left">
          <p className="text-xs text-slate-450 font-semibold leading-relaxed">
            Select a category below. Our waiting staff will receive your table alert on their request hub.
          </p>

          <div className="grid grid-cols-2 gap-3 pt-2">
            {[
              'Request Waiter',
              'Need Water',
              'Need Plates',
              'Ready to Pay',
              'Cleaning Required',
              'Other Assistance'
            ].map((option) => (
              <button
                key={option}
                onClick={() => handleCallWaiter(option)}
                disabled={isSubmittingRequest}
                className="p-4 bg-slate-950/45 hover:bg-slate-900 border border-slate-850 hover:border-primary text-slate-350 hover:text-primary text-xs font-bold rounded-2xl flex flex-col items-center justify-center text-center gap-2.5 transition-all shadow-md group"
              >
                <div className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-450 group-hover:text-primary transition-all">
                  <Bell className="w-4 h-4" />
                </div>
                <span>{option}</span>
              </button>
            ))}
          </div>
        </div>
      </Modal>

      {/* Order Success Confirmation Visual Popup */}
      <Modal
        isOpen={isOrderSuccessOpen}
        onClose={() => setIsOrderSuccessOpen(false)}
        title="Order Dispatched!"
      >
        <div className="py-4 text-center space-y-4">
          <div className="w-14 h-14 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-full flex items-center justify-center mx-auto">
            <Check className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h3 className="font-display font-extrabold text-base text-textPearl">Order Placed Successfully!</h3>
            <p className="text-xs text-slate-450 leading-relaxed font-semibold px-2">
              Your ticket (Reference: {successOrderId}) has been queued. You can track its live status in the "Track Orders" drawer.
            </p>
          </div>
          <Button
            onClick={() => setIsOrderSuccessOpen(false)}
            className="w-full"
          >
            Continue Ordering Food
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default CustomerMenu;
