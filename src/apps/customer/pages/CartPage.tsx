import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../../context/CartContext';
import { useAuth } from '../../../context/AuthContext';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { generateUniqueOrderId } from '../../../shared/utils/orderUtils';
import Card from '../../../components/ui/Card/Card';
import Badge from '../../../components/ui/Badge/Badge';
import Button from '../../../components/ui/Button/Button';
import Input from '../../../components/ui/Input/Input';
import { 
  ShoppingBag, Trash2, ChevronLeft, CreditCard, Gift, 
  Smile, ShieldCheck, Tag, Info, Heart 
} from 'lucide-react';
import toast from 'react-hot-toast';

export const CartPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const { 
    cartItems, 
    updateQuantity, 
    removeItem, 
    clearCart,
    cartSubtotal 
  } = useCart();

  const [couponCode, setCouponCode] = useState('');
  const [discountPercent, setDiscountPercent] = useState(0);
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [waiterTip, setWaiterTip] = useState<number>(0);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  // Apply voucher coupons
  const handleApplyCoupon = () => {
    if (couponCode.toUpperCase() === 'LAUNCH20') {
      setDiscountPercent(20);
      toast.success('LAUNCH20 code applied! 20% discount added.');
    } else {
      toast.error('Invalid coupon code. Try "LAUNCH20"');
    }
  };

  // Bill computations
  const subtotal = cartSubtotal;
  const discountVal = subtotal * (discountPercent / 100);
  const taxedSubtotal = subtotal - discountVal;
  const vatTax = taxedSubtotal * 0.08;
  const serviceCharge = taxedSubtotal * 0.05;
  const grandTotal = taxedSubtotal + vatTax + serviceCharge + (waiterTip * 100);

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cartItems.length === 0) {
      toast.error('Your cart is empty.');
      return;
    }
    
    setIsPlacingOrder(true);
    try {
      const orderId = generateUniqueOrderId();
      const tenantId = 'l-ambroisie'; // Default demo tenant
      
      const orderPayload = {
        id: orderId,
        orderId,
        customerId: user?.uid || 'guest-uid',
        customerName: user?.displayName || 'Guest Diner',
        phone: user?.phoneNumber || '+1 (555) 942-0192',
        tenantId,
        tableId: 'TBL-04',
        tableNumber: '04',
        items: cartItems.map(item => ({
          itemId: item.itemId,
          name: item.name,
          count: item.count,
          notes: item.notes || '',
          pricePerUnit: item.pricePerUnit
        })),
        subtotal,
        tax: vatTax + serviceCharge,
        discount: discountVal,
        total: grandTotal,
        status: 'NEW',
        paymentStatus: 'pending',
        specialInstructions,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Write order directly to restaurants/{tenantId}/orders/{orderId}
      await setDoc(doc(db, 'restaurants', tenantId, 'orders', orderId), orderPayload);
      
      toast.success('Order successfully routed to KDS!');
      clearCart();
      
      // Navigate to order tracking page
      navigate(`/customer/restaurant/${tenantId}/order/${orderId}`);
    } catch (e) {
      console.error('Failed to submit checkout order:', e);
      toast.error('Checkout failed. Please try again.');
    } finally {
      setIsPlacingOrder(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 text-left select-none">
      
      <div className="flex items-center space-x-1.5 text-slate-400" onClick={() => navigate(-1)}>
        <ChevronLeft className="w-4 h-4 cursor-pointer" />
        <span className="text-xs font-semibold cursor-pointer">Back</span>
      </div>

      <div className="space-y-1">
        <h2 className="text-xl font-display font-extrabold text-white">Your Shopping Cart</h2>
        <p className="text-xs text-slate-400">Review selected dishes and customize table check instructions.</p>
      </div>

      {cartItems.length === 0 ? (
        <div className="p-12 text-center bg-slate-900/30 border border-slate-900 rounded-3xl space-y-4">
          <ShoppingBag className="w-12 h-12 text-slate-700 mx-auto" />
          <div>
            <h3 className="text-sm font-extrabold text-white">Your Cart is Empty</h3>
            <p className="text-xs text-slate-500 mt-1">Navigate to the Restaurant Discover grid to start ordering.</p>
          </div>
          <Button 
            onClick={() => navigate('/customer/discover')}
            className="bg-primary text-slate-950 font-bold py-2.5 px-6 text-xs rounded-xl"
          >
            Find Restaurants
          </Button>
        </div>
      ) : (
        <form onSubmit={handleCheckout} className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          
          {/* LEFT PANEL - CART ITEMS LIST */}
          <div className="space-y-4">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">Selected Items</h3>
            
            <div className="space-y-3">
              {cartItems.map((item) => (
                <div key={item.itemId} className="p-4 bg-slate-900/30 border border-slate-900 rounded-2xl flex items-center justify-between">
                  <div className="space-y-1 overflow-hidden pr-2">
                    <h4 className="text-xs font-extrabold text-white truncate">{item.name}</h4>
                    <span className="text-[10px] text-primary font-bold">
                      {formatPrice(item.pricePerUnit * item.count)}
                    </span>
                    {item.notes && (
                      <p className="text-[9px] text-slate-500 font-semibold italic truncate">"{item.notes}"</p>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-3 bg-slate-950 p-1.5 rounded-xl border border-slate-850">
                    <button 
                      type="button"
                      onClick={() => updateQuantity(item.itemId, item.count - 1)}
                      className="w-6 h-6 bg-slate-900 hover:bg-slate-850 rounded-lg flex items-center justify-center text-slate-400 font-bold"
                    >
                      -
                    </button>
                    <span className="text-xs font-extrabold text-white w-4 text-center">{item.count}</span>
                    <button 
                      type="button"
                      onClick={() => updateQuantity(item.itemId, item.count + 1)}
                      className="w-6 h-6 bg-slate-900 hover:bg-slate-850 rounded-lg flex items-center justify-center text-slate-400 font-bold"
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Special Instructions text area */}
            <div className="space-y-1.5">
              <label className="text-[10.5px] text-slate-450 font-bold uppercase tracking-wider block">Special kitchen instructions</label>
              <textarea
                value={specialInstructions}
                onChange={(e) => setSpecialInstructions(e.target.value)}
                placeholder="e.g. Nut allergies, sauce on the side, no cutlery needed..."
                className="w-full p-3 bg-slate-950 border border-slate-900 rounded-xl text-xs text-white focus:outline-none focus:border-primary/40 h-24 resize-none"
              />
            </div>
          </div>

          {/* RIGHT PANEL - SUMMARY & BILL CALCULATIONS */}
          <div className="space-y-5 bg-slate-900/30 border border-slate-900 p-5 rounded-3xl backdrop-blur-md">
            
            <div className="space-y-3">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 pb-2 border-b border-slate-850">Voucher & Coupon Codes</h3>
              
              <div className="flex items-center space-x-2">
                <input 
                  type="text" 
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  placeholder="Voucher Code (LAUNCH20)" 
                  className="flex-1 pl-3.5 pr-2 py-2.5 bg-slate-950 border border-slate-850 focus:border-primary/40 rounded-xl text-xs text-white focus:outline-none placeholder-slate-600"
                />
                <button 
                  type="button"
                  onClick={handleApplyCoupon}
                  className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[10px] uppercase font-bold text-slate-350 hover:text-white rounded-xl transition-all"
                >
                  Apply
                </button>
              </div>
            </div>

            {/* Waiter Tip selector */}
            <div className="space-y-2">
              <label className="text-[10.5px] text-slate-450 font-bold uppercase tracking-wider block">Support Staff tip</label>
              <div className="grid grid-cols-4 gap-2">
                {[0, 2, 5, 10].map((tip) => (
                  <button
                    key={tip}
                    type="button"
                    onClick={() => setWaiterTip(tip)}
                    className={`py-2 border text-[10px] font-bold rounded-xl text-center transition-all ${
                      waiterTip === tip
                        ? 'bg-primary/10 border-primary text-primary'
                        : 'bg-slate-950 border-slate-900 text-slate-450'
                    }`}
                  >
                    {tip === 0 ? 'None' : `$${tip}`}
                  </button>
                ))}
              </div>
            </div>

            {/* Pricing calculations details */}
            <div className="space-y-2 text-[10.5px] text-slate-400">
              <div className="flex justify-between">
                <span>Subtotal Items</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              {discountPercent > 0 && (
                <div className="flex justify-between text-emerald-400 font-semibold">
                  <span>Voucher Code ({discountPercent}%)</span>
                  <span>-{formatPrice(discountVal)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>VAT / Tax (8%)</span>
                <span>{formatPrice(vatTax)}</span>
              </div>
              <div className="flex justify-between">
                <span>Service Fee (5%)</span>
                <span>{formatPrice(serviceCharge)}</span>
              </div>
              {waiterTip > 0 && (
                <div className="flex justify-between text-slate-350">
                  <span>Waiter Tip</span>
                  <span>${waiterTip.toFixed(2)}</span>
                </div>
              )}
              <hr className="border-slate-850/60 my-1" />
              <div className="flex justify-between text-xs font-extrabold text-white">
                <span>Grand Total check</span>
                <span className="text-primary">{formatPrice(grandTotal)}</span>
              </div>
            </div>

            <Button 
              type="submit"
              disabled={isPlacingOrder}
              className="w-full bg-primary text-slate-950 font-bold py-3.5 rounded-2xl flex items-center justify-center gap-1.5 text-xs shadow-lg mt-4"
            >
              <CreditCard className="w-4 h-4 text-slate-950 animate-pulse" />
              <span>Checkout Order</span>
            </Button>

          </div>

        </form>
      )}

    </div>
  );
};

export default CartPage;
