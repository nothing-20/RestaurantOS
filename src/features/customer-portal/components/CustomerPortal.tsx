import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  collection, 
  getDocs, 
  doc, 
  setDoc, 
  query, 
  where 
} from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { getMenuItemPath } from '../../../firebase/collections';
import { IMenuItem, IOrderItem } from '../../../types';
import { useCart } from '../../../context/CartContext';
import { formatPrice } from '../../../utils/format';
import { useAuth } from '../../../context/AuthContext';

// UI Kit components
import Button from '../../../components/ui/Button/Button';
import Input from '../../../components/ui/Input/Input';
import TextArea from '../../../components/ui/TextArea/TextArea';
import Card from '../../../components/ui/Card/Card';
import Badge from '../../../components/ui/Badge/Badge';
import SearchBar from '../../../components/ui/SearchBar/SearchBar';
import Modal from '../../../components/ui/Modal/Modal';
import LoadingSpinner from '../../../components/ui/LoadingSpinner/LoadingSpinner';

// Hot Toast notifications
import toast from 'react-hot-toast';
import { 
  ShoppingBag, 
  Plus, 
  Minus, 
  Trash2, 
  ChevronRight, 
  Clock, 
  AlertTriangle,
  CheckCircle2,
  User,
  Coffee
} from 'lucide-react';

export const CustomerPortal: React.FC = () => {
  const { tenantId, tableId } = useParams<{ tenantId: string; tableId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const { 
    cartItems, 
    addItem, 
    updateQuantity, 
    removeItem, 
    clearCart,
    cartSubtotal, 
    cartTax, 
    cartTotal 
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

  // Modal / Panel States
  const [selectedItem, setSelectedItem] = useState<IMenuItem | null>(null);
  const [addItemCount, setAddItemCount] = useState(1);
  const [itemNotes, setItemNotes] = useState('');
  
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isOrderSuccess, setIsOrderSuccess] = useState(false);
  
  // Checkout Input States
  const [customerName, setCustomerName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [tableNumber, setTableNumber] = useState(tableId || '');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  useEffect(() => {
    if (user) {
      setCustomerName(user.displayName || '');
      setPhoneNumber(user.phoneNumber || '');
    }
  }, [user]);

  // Call Waiter / Assistance Request states
  const [isServiceOpen, setIsServiceOpen] = useState(false);
  const [isCallingService, setIsCallingService] = useState(false);

  const handleRequestService = async (type: string) => {
    if (!tenantId) return;
    setIsCallingService(true);
    try {
      const requestId = `REQ-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      const docRef = doc(db, 'restaurants', tenantId, 'requests', requestId);
      await setDoc(docRef, {
        id: requestId,
        tableNumber: tableId || 'Bar',
        type,
        status: 'pending',
        createdAt: new Date().toISOString()
      });
      toast.success(`${type} request sent to waiter!`);
      setIsServiceOpen(false);
    } catch (e: any) {
      console.error(e);
      toast.error('Failed to submit request.');
    } finally {
      setIsCallingService(false);
    }
  };

  // Fetch menu collection restaurants/{tenantId}/menu
  const fetchMenu = async () => {
    if (!tenantId) return;
    setIsLoading(true);
    try {
      const colRef = collection(db, getMenuItemPath(tenantId));
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
    } catch (e: any) {
      console.error(e);
      toast.error('Failed to load restaurant menu catalog.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMenu();
  }, [tenantId]);

  // Filters logic
  useEffect(() => {
    let filtered = [...menuItems];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(item => 
        item.name.toLowerCase().includes(q) || 
        item.description.toLowerCase().includes(q)
      );
    }

    if (activeCategory !== 'all') {
      filtered = filtered.filter(item => item.category === activeCategory);
    }

    if (showVegOnly) {
      filtered = filtered.filter(item => item.veg);
    }

    setFilteredItems(filtered);
  }, [searchQuery, activeCategory, showVegOnly, menuItems]);

  const handleSelectItem = (item: IMenuItem) => {
    if (!item.available) {
      toast.error('This dish is currently out of stock.', { id: 'out-of-stock-alert' });
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

  // Place Order transaction writing restaurants/{tenantId}/orders
  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantId) return;

    if (!customerName.trim()) {
      toast.error('Please enter your name.');
      return;
    }
    if (!phoneNumber.trim() || phoneNumber.length < 8) {
      toast.error('Please enter a valid phone number.');
      return;
    }
    if (!tableNumber.trim()) {
      toast.error('Please verify your table number.');
      return;
    }

    setIsPlacingOrder(true);
    try {
      const orderId = `ORD-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      const docRef = doc(db, 'restaurants', tenantId, 'orders', orderId);

      const itemsList = cartItems.map(item => ({
        itemId: item.itemId,
        name: item.name,
        count: item.count,
        notes: item.notes,
        pricePerUnit: item.pricePerUnit
      }));

      await setDoc(docRef, {
        orderId,
        customerId: user?.uid || 'guest-uid',
        customerName,
        phone: phoneNumber,
        restaurantId: tenantId,
        tenantId,
        tableNumber,
        items: itemsList,
        subtotal: cartSubtotal,
        tax: gstCharge + serviceCharge,
        total: cartTotalVal,
        status: 'PLACED',
        paymentStatus: 'PENDING',
        specialInstructions,
        createdAt: new Date().toISOString()
      });

      clearCart();
      setIsCheckoutOpen(false);
      setIsOrderSuccess(true);
      toast.success('Order placed successfully!', { id: 'order-success-toast' });
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Failed to place order. Try again.');
    } finally {
      setIsPlacingOrder(false);
    }
  };

  const totalItemsCount = cartItems.reduce((acc, curr) => acc + curr.count, 0);
  const gstCharge = Math.round(cartSubtotal * 0.05);
  const serviceCharge = Math.round(cartSubtotal * 0.05);
  const cartTotalVal = cartSubtotal + gstCharge + serviceCharge;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <LoadingSpinner label="Fetching restaurant menu..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 pb-24 text-left">
      {/* Mobile-friendly banner */}
      <div className="bg-slate-900 border-b border-slate-800/60 p-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-extrabold text-textPearl">Welcome to Diner Portal</h1>
          <p className="text-xs text-primary font-bold uppercase tracking-wider mt-0.5">Table #{tableId || 'Bar'}</p>
        </div>
        <button
          onClick={() => setIsServiceOpen(true)}
          className="px-3.5 py-2 bg-slate-800 hover:bg-slate-750 border border-slate-700/60 text-slate-350 hover:text-textPearl text-xs font-bold rounded-xl transition-all"
        >
          Call Waiter
        </button>
      </div>

      {/* Menu Filters */}
      <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">
        <SearchBar 
          placeholder="Search dishes..."
          value={searchQuery}
          onSearchChange={setSearchQuery}
        />

        {/* Categories Horizontal Scroll */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-1 select-none">
          <button
            onClick={() => setActiveCategory('all')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-300 ${
              activeCategory === 'all'
                ? 'bg-primary text-background'
                : 'bg-slate-900 text-slate-400 hover:text-textPearl border border-slate-850'
            }`}
          >
            All Items
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-300 ${
                activeCategory === cat
                  ? 'bg-primary text-background'
                  : 'bg-slate-900 text-slate-400 hover:text-textPearl border border-slate-850'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Veg/Nonveg quick filter toggle */}
        <div className="flex items-center justify-between py-1 border-b border-slate-800/40">
          <span className="text-xs text-slate-400">Show Vegetarian Items Only</span>
          <button
            onClick={() => setShowVegOnly(!showVegOnly)}
            className={`w-10 h-5 rounded-full p-0.5 transition-colors duration-300 ${showVegOnly ? 'bg-accent' : 'bg-slate-800'}`}
          >
            <div className={`w-4 h-4 bg-white rounded-full transform transition-transform duration-300 ${showVegOnly ? 'translate-x-5' : 'translate-x-0'}`} />
          </button>
        </div>

        {/* Menu Cards List Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
          {filteredItems.length === 0 ? (
            <div className="col-span-full py-12 text-center border border-dashed border-slate-850 rounded-2xl bg-slate-900/10">
              <AlertTriangle className="w-8 h-8 text-slate-650 mx-auto mb-2" />
              <p className="text-sm text-slate-400 font-semibold">No items match your filters.</p>
            </div>
          ) : (
            filteredItems.map((item) => (
              <Card 
                key={item.id} 
                className={`p-4 border-slate-850 bg-slate-900/40 flex items-start justify-between space-x-4 cursor-pointer hover:border-slate-800 hover:bg-slate-900/60 ${!item.available ? 'opacity-55' : ''}`}
                onClick={() => handleSelectItem(item)}
              >
                <div className="flex-1 flex flex-col text-left space-y-1">
                  <div className="flex items-center space-x-2">
                    <h3 className="font-display font-bold text-sm text-textPearl">{item.name}</h3>
                    {item.veg ? <Badge variant="success">Veg</Badge> : <Badge variant="danger">Non-Veg</Badge>}
                  </div>
                  <p className="text-xs text-mutedAsh line-clamp-2 pr-2">{item.description}</p>
                  
                  {/* Prices display block */}
                  <div className="flex items-center space-x-2 pt-1">
                    {item.discountPrice && item.discountPrice < item.price ? (
                      <>
                        <span className="text-sm font-semibold text-textPearl">{formatPrice(item.discountPrice)}</span>
                        <span className="text-xs text-primary line-through">{formatPrice(item.price)}</span>
                      </>
                    ) : (
                      <span className="text-sm font-semibold text-textPearl">{formatPrice(item.price)}</span>
                    )}
                  </div>

                  <div className="flex items-center space-x-1.5 pt-1.5 text-[10px] text-slate-500 font-medium">
                    <Clock className="w-3 h-3" />
                    <span>{item.preparationTime} mins prep</span>
                  </div>
                </div>

                {/* Card Item image thumbnail */}
                {item.imageUrl ? (
                  <div className="w-20 h-20 rounded-xl overflow-hidden border border-slate-800 bg-slate-900 shrink-0">
                    <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                  </div>
                ) : null}
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Floating View Cart bar */}
      {totalItemsCount > 0 ? (
        <div className="fixed bottom-6 inset-x-4 z-40 max-w-xl mx-auto">
          <button
            onClick={() => setIsCartOpen(true)}
            className="w-full bg-primary hover:bg-primary-hover text-background font-display font-bold p-4 rounded-2xl flex items-center justify-between shadow-2xl shadow-primary/20 animate-in slide-in-from-bottom-4 duration-300"
          >
            <div className="flex items-center space-x-3">
              <ShoppingBag className="w-5 h-5" />
              <span>View Cart ({totalItemsCount} items)</span>
            </div>
            <div className="flex items-center space-x-1">
              <span>{formatPrice(cartTotal)}</span>
              <ChevronRight className="w-4 h-4" />
            </div>
          </button>
        </div>
      ) : null}

      {/* Modal Item Details & Notes */}
      <Modal
        isOpen={selectedItem !== null}
        onClose={() => setSelectedItem(null)}
        title={selectedItem?.name || 'Dish Details'}
      >
        {selectedItem && (
          <div className="space-y-4 text-left">
            {selectedItem.imageUrl ? (
              <div className="w-full h-44 rounded-xl overflow-hidden border border-slate-800 bg-slate-900">
                <img src={selectedItem.imageUrl} alt={selectedItem.name} className="w-full h-full object-cover" />
              </div>
            ) : null}
            
            <p className="text-xs text-mutedAsh">{selectedItem.description}</p>
            
            <div className="flex items-center justify-between py-2 border-y border-slate-800/40">
              <span className="text-xs text-slate-400 font-semibold">Quantity</span>
              <div className="flex items-center space-x-3.5">
                <button
                  onClick={() => setAddItemCount(prev => Math.max(1, prev - 1))}
                  className="p-1 bg-slate-800 text-slate-400 hover:text-textPearl rounded-lg"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="text-sm font-semibold text-textPearl">{addItemCount}</span>
                <button
                  onClick={() => setAddItemCount(prev => prev + 1)}
                  className="p-1 bg-slate-800 text-slate-400 hover:text-textPearl rounded-lg"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <TextArea 
              label="Preparation Instructions (optional)"
              placeholder="E.g. Extra spicy, No onions, Sauce on the side."
              value={itemNotes}
              onChange={(e) => setItemNotes(e.target.value)}
              rows={2}
            />

            <Button 
              onClick={handleAddToCart}
              className="w-full"
            >
              Add to Basket • {formatPrice((selectedItem.discountPrice || selectedItem.price) * addItemCount)}
            </Button>
          </div>
        )}
      </Modal>

      {/* Slide-out Cart details page */}
      <Modal
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        title="Your Basket"
      >
        <div className="space-y-4 text-left">
          {cartItems.length === 0 ? (
            <p className="text-center py-6 text-xs text-slate-500">Your basket is empty.</p>
          ) : (
            <div className="space-y-3 divide-y divide-slate-850">
              {cartItems.map((item) => (
                <div key={item.itemId} className="flex items-start justify-between pt-3 first:pt-0">
                  <div className="flex-1 space-y-1">
                    <h4 className="text-xs font-semibold text-textPearl">{item.name}</h4>
                    {item.notes ? (
                      <p className="text-[10px] text-primary">Note: {item.notes}</p>
                    ) : null}
                    <div className="text-xs text-slate-400">{formatPrice(item.pricePerUnit)} each</div>
                  </div>

                  <div className="flex items-center space-x-3.5 ml-4">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => updateQuantity(item.itemId, item.count - 1)}
                        className="p-1 bg-slate-800 text-slate-400 hover:text-textPearl rounded-lg"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-xs font-semibold text-textPearl w-4 text-center">{item.count}</span>
                      <button
                        onClick={() => updateQuantity(item.itemId, item.count + 1)}
                        className="p-1 bg-slate-800 text-slate-400 hover:text-textPearl rounded-lg"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <button
                      onClick={() => removeItem(item.itemId)}
                      className="p-1 text-slate-500 hover:text-red-500"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pricing calculations details */}
          <div className="border-t border-slate-800/40 pt-4 space-y-2 text-xs">
            <div className="flex justify-between text-slate-400">
              <span>Subtotal</span>
              <span>{formatPrice(cartSubtotal)}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>GST (5%)</span>
              <span>{formatPrice(gstCharge)}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Service Charge (5%)</span>
              <span>{formatPrice(serviceCharge)}</span>
            </div>
            <div className="flex justify-between text-textPearl font-semibold text-sm pt-2 border-t border-slate-800/20">
              <span>Grand Total</span>
              <span>{formatPrice(cartTotalVal)}</span>
            </div>
          </div>

          <Button
            className="w-full mt-4"
            disabled={cartItems.length === 0}
            onClick={() => {
              setIsCartOpen(false);
              setIsCheckoutOpen(true);
            }}
          >
            Proceed to Checkout
          </Button>
        </div>
      </Modal>

      {/* Checkout Input panel */}
      <Modal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        title="Diner Checkout"
      >
        <form onSubmit={handlePlaceOrder} className="space-y-4 text-left">
          <Input 
            label="Your Name"
            type="text"
            placeholder="John Doe"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            disabled={isPlacingOrder}
            required
          />

          <Input 
            label="Phone Number"
            type="tel"
            placeholder="123-456-7890"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            disabled={isPlacingOrder}
            required
          />

          <Input 
            label="Table Number"
            type="text"
            value={tableNumber}
            onChange={(e) => setTableNumber(e.target.value)}
            disabled={isPlacingOrder}
            required
          />

          <TextArea 
            label="Special Cooking Instructions"
            placeholder="E.g. Ring once ready, Sauce separately."
            value={specialInstructions}
            onChange={(e) => setSpecialInstructions(e.target.value)}
            disabled={isPlacingOrder}
            rows={2}
          />

          {/* Order Summary box */}
          <div className="bg-slate-950/40 border border-slate-850 p-4 rounded-xl space-y-2">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Order Summary</span>
            <div className="text-xs space-y-1">
              {cartItems.map((item) => (
                <div key={item.itemId} className="flex justify-between text-slate-300">
                  <span>{item.name} x{item.count}</span>
                  <span>{formatPrice(item.pricePerUnit * item.count)}</span>
                </div>
              ))}
            </div>
          </div>

          <Button
            type="submit"
            className="w-full"
            isLoading={isPlacingOrder}
          >
            Confirm & Place Order • {formatPrice(cartTotalVal)}
          </Button>
        </form>
      </Modal>

      {/* Order Success visual screen */}
      <Modal
        isOpen={isOrderSuccess}
        onClose={() => setIsOrderSuccess(false)}
        title="Order Dispatched"
      >
        <div className="py-6 text-center space-y-4 text-left">
          <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-full flex items-center justify-center mx-auto animate-pulse">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div className="space-y-1.5">
            <h3 className="font-display font-extrabold text-base text-textPearl">Order Placed Successfully!</h3>
            <p className="text-xs text-mutedAsh">
              Your ticket has been sent to the kitchen prep line. Please sit back and relax. We'll alert you once it is ready.
            </p>
          </div>
          <Button 
            onClick={() => setIsOrderSuccess(false)}
            className="w-full"
          >
            Browse More Dishes
          </Button>
        </div>
      </Modal>

      {/* Call Service Modal */}
      <Modal
        isOpen={isServiceOpen}
        onClose={() => setIsServiceOpen(false)}
        title="Request Assistance"
      >
        <div className="space-y-3.5 text-center">
          <p className="text-xs text-mutedAsh mb-4">
            Select a service request below. Your table waiter will be notified immediately.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => handleRequestService('Call Waiter')}
              disabled={isCallingService}
              className="p-4 bg-slate-900 border border-slate-800 hover:border-primary text-slate-300 hover:text-primary text-xs font-semibold rounded-2xl flex flex-col items-center gap-2 transition-all"
            >
              <User className="w-5 h-5 text-primary" />
              <span>Call Waiter</span>
            </button>
            <button
              onClick={() => handleRequestService('Water')}
              disabled={isCallingService}
              className="p-4 bg-slate-900 border border-slate-800 hover:border-primary text-slate-300 hover:text-primary text-xs font-semibold rounded-2xl flex flex-col items-center gap-2 transition-all"
            >
              <Coffee className="w-5 h-5 text-primary" />
              <span>Request Water</span>
            </button>
            <button
              onClick={() => handleRequestService('Bill')}
              disabled={isCallingService}
              className="p-4 bg-slate-900 border border-slate-800 hover:border-primary text-slate-300 hover:text-primary text-xs font-semibold rounded-2xl flex flex-col items-center gap-2 transition-all"
            >
              <ShoppingBag className="w-5 h-5 text-primary" />
              <span>Request Bill</span>
            </button>
            <button
              onClick={() => handleRequestService('General Help')}
              disabled={isCallingService}
              className="p-4 bg-slate-900 border border-slate-800 hover:border-primary text-slate-300 hover:text-primary text-xs font-semibold rounded-2xl flex flex-col items-center gap-2 transition-all"
            >
              <AlertTriangle className="w-5 h-5 text-primary" />
              <span>General Help</span>
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
export default CustomerPortal;
