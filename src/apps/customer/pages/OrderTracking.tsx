import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, onSnapshot, getDoc, setDoc, collection, query, where, getDocs, addDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../../shared/firebase/config';
import { formatPrice } from '../../../shared/utils/format';
import { customerService } from '../../../shared/services/customerService';

// UI Kit components
import Card from '../../../shared/ui/cards/Card';
import Button from '../../../shared/ui/buttons/Button';
import Badge from '../../../shared/ui/badges/Badge';
import Modal from '../../../shared/ui/dialogs/Modal';
import LoadingSpinner from '../../../shared/ui/loading/LoadingSpinner';

// Icons
import { 
  Check, 
  ArrowLeft, 
  AlertTriangle, 
  Clock, 
  Bell, 
  DollarSign, 
  CheckCircle, 
  ThumbsUp, 
  Star, 
  Coffee,
  Sparkles,
  Utensils,
  ChevronRight,
  Heart,
  Plus,
  Compass,
  AlertCircle,
  HelpCircle,
  TrendingUp
} from 'lucide-react';
import toast from 'react-hot-toast';

export const OrderTracking: React.FC = () => {
  const { tenantId, orderId } = useParams<{ tenantId: string; orderId: string }>();
  const navigate = useNavigate();

  // Core Data States
  const [order, setOrder] = useState<any | null>(null);
  const [sessionOrders, setSessionOrders] = useState<any[]>([]);
  const [waiterRequests, setWaiterRequests] = useState<any[]>([]);
  const [restaurantName, setRestaurantName] = useState('Gourmet Bistro');
  const [isLoading, setIsLoading] = useState(true);
  const [session, setSession] = useState<any>(null);

  // Time / Timers States
  const [elapsedMinutes, setElapsedMinutes] = useState(0);

  // UI / Modal States
  const [isRequestAlertOpen, setIsRequestAlertOpen] = useState(false);
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);
  
  // Payment Simulated States
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentCompleted, setPaymentCompleted] = useState(false);

  // Feedback form states
  const [ratingCategory, setRatingCategory] = useState<'Excellent' | 'Good' | 'Neutral' | 'Needs Attention' | 'Complaint'>('Excellent');
  const [foodRating, setFoodRating] = useState(5);
  const [serviceRating, setServiceRating] = useState(5);
  const [cleanlinessRating, setCleanlinessRating] = useState(5);
  const [ambienceRating, setAmbienceRating] = useState(5);
  const [comments, setComments] = useState('');
  const [repeatCustomer, setRepeatCustomer] = useState(true);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  // Timeline Steps
  const trackingSteps = [
    { key: 'NEW', label: 'Order Received', desc: 'Your ticket is on the kitchen queue.' },
    { key: 'ACCEPTED', label: 'Accepted', desc: 'The kitchen has accepted your order.' },
    { key: 'PREPARING', label: 'Preparing', desc: 'The chef is cooking your dishes.' },
    { key: 'READY', label: 'Ready', desc: 'Food is plated and ready for pickup.' },
    { key: 'DELIVERED', label: 'Served', desc: 'Delivered to your table. Enjoy!' }
  ];

  const getStepIndex = (status: string) => {
    switch (status) {
      case 'NEW':
      case 'PLACED': return 0;
      case 'ACCEPTED': return 1;
      case 'PREPARING': return 2;
      case 'READY': return 3;
      case 'DELIVERED':
      case 'COMPLETED': return 4;
      default: return 0;
    }
  };

  // 1. Fetch dining session from localStorage & resolve details
  useEffect(() => {
    const savedSessionStr = localStorage.getItem('restaurantos_dining_session');
    if (savedSessionStr) {
      try {
        setSession(JSON.parse(savedSessionStr));
      } catch (e) {
        console.error('Failed to parse cached session', e);
      }
    }
  }, []);

  // 2. Real-time Listeners for Active Order & Session Orders
  useEffect(() => {
    if (!tenantId || !orderId) return;

    // Fetch Restaurant Name
    const fetchRestaurantInfo = async () => {
      try {
        const tenantRef = doc(db, 'tenants', tenantId);
        const tenantSnap = await getDoc(tenantRef);
        if (tenantSnap.exists()) {
          setRestaurantName(tenantSnap.data().restaurantName || tenantSnap.data().name || 'Gourmet Bistro');
        }
      } catch (e) {
        console.error(e);
      }
    };
    fetchRestaurantInfo();

    // Subscribe to Target Order doc
    const orderDocRef = doc(db, 'restaurants', tenantId, 'orders', orderId);
    const unsubOrder = onSnapshot(orderDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const orderData = docSnap.data();
        setOrder({ id: docSnap.id, ...orderData });
        
        // Calculate elapsed minutes initially
        if (orderData.createdAt) {
          const diffMs = Date.now() - new Date(orderData.createdAt).getTime();
          setElapsedMinutes(Math.floor(diffMs / 60000));
        }

        // Check if order has been completed/paid
        if (orderData.paymentStatus === 'paid') {
          setPaymentCompleted(true);
        }
      } else {
        toast.error('Active order tracking not found.');
      }
      setIsLoading(false);
    }, (err) => {
      console.error(err);
      toast.error('Failed to connect to real-time order tracking.');
      setIsLoading(false);
    });

    // Subscribe to Diner Requests for active table
    const reqColRef = collection(db, 'restaurants', tenantId, 'waiterRequests');
    const unsubRequests = onSnapshot(reqColRef, (snap) => {
      const list: any[] = [];
      snap.forEach(docSnap => {
        const data = docSnap.data();
        list.push({ id: docSnap.id, ...data });
      });
      // Sort newest requests first
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setWaiterRequests(list);
    });

    return () => {
      unsubOrder();
      unsubRequests();
    };
  }, [tenantId, orderId]);

  // 3. Fetch past orders in the same dining session
  useEffect(() => {
    if (!tenantId || !session?.sessionId) return;

    const ordersColRef = collection(db, 'restaurants', tenantId, 'orders');
    const q = query(ordersColRef, where('sessionId', '==', session.sessionId));
    
    const unsubSessionOrders = onSnapshot(q, (snap) => {
      const list: any[] = [];
      snap.forEach(docSnap => {
        list.push({ id: docSnap.id, ...docSnap.data() });
      });
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setSessionOrders(list);
    });

    return () => unsubSessionOrders();
  }, [tenantId, session]);

  // 4. Elapsed Timer increment interval
  useEffect(() => {
    if (!order?.createdAt) return;

    const timer = setInterval(() => {
      const diffMs = Date.now() - new Date(order.createdAt).getTime();
      setElapsedMinutes(Math.floor(diffMs / 60000));
    }, 60000);

    return () => clearInterval(timer);
  }, [order?.createdAt]);

  // 5. Submit Waiter / Dining alerts
  const handleCallWaiter = async (requestType: string) => {
    if (!tenantId || !order) return;
    setIsSubmittingRequest(true);

    try {
      const requestId = `REQ-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
      const requestRef = doc(db, 'restaurants', tenantId, 'waiterRequests', requestId);

      const requestPayload = {
        id: requestId,
        tableNumber: order.tableNumber || '3',
        requestType,
        status: 'Pending',
        createdAt: new Date().toISOString(),
        deviceId: localStorage.getItem('restaurantos_device_id') || 'unknown',
        sessionId: session?.sessionId || 'ANON-SESSION'
      };

      await setDoc(requestRef, requestPayload);

      // Trigger Audit event logs
      await customerService.logCustomerEvent(tenantId, 'Waiter Alert', `Diner requested assistance: ${requestType} from Table ${order.tableNumber}`, {
        tableNumber: order.tableNumber,
        requestType
      });

      toast.success(`Request for "${requestType}" sent to staff!`);
      setIsRequestAlertOpen(false);
    } catch (e) {
      console.error(e);
      toast.error('Failed to submit request.');
    } finally {
      setIsSubmittingRequest(false);
    }
  };

  // 6. Submit Bill Request alert and update table status in Firestore
  const handleRequestBill = async () => {
    if (!tenantId || !order) return;
    setIsSubmittingRequest(true);

    try {
      // Create request in waiterRequests
      const requestId = `REQ-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
      await setDoc(doc(db, 'restaurants', tenantId, 'waiterRequests', requestId), {
        id: requestId,
        tableNumber: order.tableNumber,
        requestType: 'Bill Request',
        status: 'Pending',
        createdAt: new Date().toISOString(),
        orderId
      });

      // Update Order billRequestedAt
      const orderRef = doc(db, 'restaurants', tenantId, 'orders', orderId);
      await updateDoc(orderRef, {
        billRequestedAt: new Date().toISOString(),
        status: 'COMPLETED' // shift order into finalized billing view
      });

      // Update Table Status to 'bill_requested'
      const tableId = session?.tableId || `TBL-${order.tableNumber}`;
      const tableRef = doc(db, 'restaurants', tenantId, 'tables', tableId);
      await updateDoc(tableRef, {
        status: 'bill_requested'
      });

      // Log event
      await customerService.logCustomerEvent(tenantId, 'Bill Requested', `Customer requested final bill for Table ${order.tableNumber}`, {
        tableNumber: order.tableNumber,
        orderId
      });

      toast.success('Bill request sent to staff!');
    } catch (e) {
      console.error(e);
      toast.error('Failed to request bill.');
    } finally {
      setIsSubmittingRequest(false);
    }
  };

  // 7. Simulated payment checkout flow (UPI / CARD / WALLET)
  const handleProcessPayment = async () => {
    if (!tenantId || !order) return;
    if (!selectedPaymentMethod) {
      toast.error('Please select a payment method');
      return;
    }

    setIsProcessingPayment(true);
    
    // Simulate transaction delay
    setTimeout(async () => {
      try {
        const orderRef = doc(db, 'restaurants', tenantId, 'orders', orderId);
        
        // Update Firestore order to Paid!
        await updateDoc(orderRef, {
          paymentStatus: 'paid',
          paidAt: new Date().toISOString(),
          status: 'COMPLETED',
          paymentMethods: {
            cash: selectedPaymentMethod === 'Cash' ? order.total : 0,
            upi: selectedPaymentMethod === 'UPI' ? order.total : 0,
            card: selectedPaymentMethod === 'Card' ? order.total : 0,
            wallet: selectedPaymentMethod === 'Wallet' ? order.total : 0
          }
        });

        // Trigger Event engine logs
        await customerService.logCustomerEvent(tenantId, 'Payment Completed', `Diner completed payment of ${formatPrice(order.total)} via ${selectedPaymentMethod}`, {
          orderId,
          method: selectedPaymentMethod,
          total: order.total
        });

        toast.success('Payment simulated successfully!');
        setPaymentCompleted(true);
        setIsPaymentModalOpen(false);
      } catch (e) {
        console.error(e);
        toast.error('Simulated transaction failed.');
      } finally {
        setIsProcessingPayment(false);
      }
    }, 3000);
  };

  // 8. Submit Ratings and Feedback review
  const handleSubmitFeedback = async () => {
    if (!tenantId || !order) return;

    try {
      const isPositive = ratingCategory === 'Excellent' || ratingCategory === 'Good';
      const isComplaint = ratingCategory === 'Complaint' || ratingCategory === 'Needs Attention';

      const feedbackPayload = {
        rating: ratingCategory,
        foodQuality: foodRating,
        serviceSpeed: serviceRating,
        cleanliness: cleanlinessRating,
        ambience: ambienceRating,
        repeatCustomer,
        notes: comments.trim() || 'No comments',
        submittedBy: 'Anonymous Guest',
        submittedByName: 'Table Guest',
        submittedAt: new Date().toISOString(),
        orderId,
        tableNumber: order.tableNumber,
        tenantId,
        isPositive,
        isComplaint
      };

      const reviewsCol = collection(db, 'restaurants', tenantId, 'satisfactionRatings');
      const ratingRef = await addDoc(reviewsCol, feedbackPayload);

      // If a complaint is raised, trigger manager review tasks
      if (isComplaint) {
        const taskRef = collection(db, 'restaurants', tenantId, 'tasks');
        await addDoc(taskRef, {
          tenantId,
          customerIssue: `Diner rating: ${ratingCategory}. Comments: ${comments || 'None'}`,
          priority: ratingCategory === 'Complaint' ? 'Critical' : 'High',
          assignedManager: 'Pending',
          resolutionStatus: 'Pending',
          resolutionNotes: '',
          submittedAt: new Date().toISOString(),
          submittedByName: 'Anonymous Table Guest',
          submittedBy: 'customer',
          tableNumber: order.tableNumber,
          rating: ratingCategory,
          satisfactionRatingId: ratingRef.id
        });
      }

      // Restore table status in Firestore to Available / empty
      const tableId = session?.tableId || `TBL-${order.tableNumber}`;
      const tableRef = doc(db, 'restaurants', tenantId, 'tables', tableId);
      await updateDoc(tableRef, {
        status: 'Available',
        guestsCount: 0,
        activeOrderId: ''
      });

      // Clear local dining session cache
      localStorage.removeItem('restaurantos_dining_session');

      // Log event
      await customerService.logCustomerEvent(tenantId, 'Feedback Submitted', `Customer submitted satisfaction rating: ${ratingCategory}`, {
        rating: ratingCategory,
        orderId
      });

      setFeedbackSubmitted(true);
      toast.success('Thank you for your feedback!');
    } catch (e) {
      console.error('[Feedback] Submit error:', e);
      toast.error('Failed to log review details.');
    }
  };

  // Render Loading spinner
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-955 bg-slate-950 flex flex-col items-center justify-center p-6 text-center select-none">
        <LoadingSpinner label="Syncing live table statistics..." />
      </div>
    );
  }

  // Render Thank you Exit screen
  if (feedbackSubmitted) {
    return (
      <div className="min-h-screen bg-slate-955 bg-slate-950 flex items-center justify-center p-6 text-center select-none antialiased">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-[15%] left-[-10%] w-[450px] h-[450px] rounded-full bg-primary/10 blur-[130px]" />
        </div>

        <div className="max-w-md w-full glass-panel rounded-3xl p-8 border-slate-800/40 relative z-10 space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto shadow-2xl">
            <Heart className="w-8 h-8 animate-pulse fill-current" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-display font-extrabold text-textPearl">Thank You for Dining!</h2>
            <p className="text-xs text-mutedAsh leading-relaxed px-4">
              Your feedback helps us refine our recipes and operations. Have a wonderful rest of your day!
            </p>
          </div>

          <div className="pt-2">
            <Button
              className="w-full text-xs font-bold py-3.5 bg-gradient-to-r from-primary to-amber-600 hover:from-primary-hover hover:to-amber-700 text-background"
              onClick={() => navigate('/customer')}
            >
              Finish & Exit Portal
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Render Feedback Form loop when Order payment status shifts to 'paid'
  if (paymentCompleted) {
    return (
      <div className="min-h-screen bg-slate-955 bg-slate-950 flex items-center justify-center p-6 text-center select-none antialiased">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-[10%] right-[-10%] w-[400px] h-[400px] rounded-full bg-primary/5 blur-[120px]" />
        </div>

        <div className="max-w-md w-full glass-panel rounded-3xl p-6 border-slate-800/40 relative z-10 space-y-5 text-left">
          <div className="text-center space-y-1.5 pb-2 border-b border-slate-850">
            <h2 className="text-xl font-display font-extrabold text-textPearl">Dining Experience Feedback</h2>
            <p className="text-xs text-slate-500 font-semibold">How was your meal today?</p>
          </div>

          {/* Satisfaction Overall Category select */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Overall Experience</label>
            <div className="grid grid-cols-5 gap-1 text-center">
              {[
                { key: 'Excellent', label: '😍' },
                { key: 'Good', label: '😊' },
                { key: 'Neutral', label: '😐' },
                { key: 'Needs Attention', label: '🙁' },
                { key: 'Complaint', label: '😡' }
              ].map(opt => (
                <button
                  key={opt.key}
                  onClick={() => setRatingCategory(opt.key as any)}
                  className={`p-2 rounded-xl border flex flex-col items-center justify-center transition-all ${
                    ratingCategory === opt.key 
                      ? 'bg-primary/10 border-primary text-primary' 
                      : 'bg-slate-900 border-slate-850 text-slate-500'
                  }`}
                >
                  <span className="text-xl">{opt.label}</span>
                  <span className="text-[8px] font-bold mt-1 block truncate w-full">{opt.key.split(' ')[0]}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Rating stars grid */}
          <div className="grid grid-cols-2 gap-3.5 pt-2">
            {[
              { label: '🍔 Food Quality', val: foodRating, set: setFoodRating },
              { label: '⚡ Service Speed', val: serviceRating, set: setServiceRating },
              { label: '✨ Cleanliness', val: cleanlinessRating, set: setCleanlinessRating },
              { label: '🎵 Ambience', val: ambienceRating, set: setAmbienceRating }
            ].map(cat => (
              <div key={cat.label} className="space-y-1">
                <label className="text-[9.5px] font-bold text-slate-500 block uppercase">{cat.label}</label>
                <div className="flex items-center space-x-1">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      onClick={() => cat.set(star)}
                      className="text-slate-600 hover:text-amber-500 transition-colors"
                    >
                      <Star className={`w-4 h-4 ${star <= cat.val ? 'text-amber-500 fill-current' : ''}`} />
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Custom notes comments box */}
          <div className="space-y-1 pt-2">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Additional comments</label>
            <textarea
              placeholder="Tell us what we did great or how we can improve..."
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              className="w-full bg-slate-900 border border-slate-850 focus:border-primary rounded-xl p-3 text-xs font-semibold text-textPearl outline-none"
              rows={2}
            />
          </div>

          {/* Repeat Customer checkbox */}
          <div className="flex items-center space-x-2.5 pt-1.5">
            <input
              type="checkbox"
              id="repeatCustomer"
              checked={repeatCustomer}
              onChange={(e) => setRepeatCustomer(e.target.checked)}
              className="w-4 h-4 bg-slate-900 border border-slate-850 rounded focus:ring-0 accent-primary"
            />
            <label htmlFor="repeatCustomer" className="text-xs font-semibold text-slate-400 cursor-pointer">
              I would visit this restaurant again!
            </label>
          </div>

          <Button
            className="w-full text-xs font-bold py-3 bg-gradient-to-r from-primary to-amber-600 hover:from-primary-hover hover:to-amber-700 text-background"
            onClick={handleSubmitFeedback}
          >
            Submit Feedback Review
          </Button>
        </div>
      </div>
    );
  }

  // Unified Dashboard Views variables
  const activeIndex = getStepIndex(order.status);
  const isCancelled = order.status === 'CANCELLED';

  // Live bill subtotal, tax (GST 5%), service charge (5%), total calculations
  const orderSubtotal = order.subtotal || 0;
  const orderTax = order.tax || 0;
  const orderServiceCharge = order.serviceCharge || 0;
  const orderTotal = order.total || 0;

  // Waiter requests made from active table
  const activeTableRequests = waiterRequests.filter(r => r.tableNumber === order.tableNumber);

  return (
    <div className="min-h-screen bg-slate-950 pb-20 text-left relative overflow-hidden select-none antialiased">
      {/* Dynamic ambient backdrop glow */}
      <div className="absolute top-[-10%] left-[-15%] w-[600px] h-[600px] rounded-full bg-primary/5 blur-[150px] pointer-events-none" />

      {/* TOP HEADER */}
      <header className="bg-slate-900/40 border-b border-slate-850/60 sticky top-0 z-30 backdrop-blur-md">
        <div className="max-w-xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => navigate(`/customer/restaurant/${tenantId}/menu`)}
              className="p-2 bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-400 hover:text-textPearl rounded-xl transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h1 className="text-sm font-display font-extrabold text-textPearl leading-tight">{restaurantName}</h1>
              <span className="text-[10px] text-primary font-bold uppercase tracking-wider">Table #{order.tableNumber || '3'}</span>
            </div>
          </div>
          <Badge variant={isCancelled ? 'danger' : activeIndex === 4 ? 'success' : 'warning'}>
            {isCancelled ? 'Cancelled' : activeIndex === 4 ? 'Served' : 'In Prep'}
          </Badge>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main className="max-w-xl mx-auto px-6 py-6 space-y-6 relative z-10">
        
        {/* SECTION 1: TIMELINE TRACKING STEPPER */}
        <Card className="p-6 border-slate-850 bg-slate-900/20 rounded-3xl space-y-5">
          <div className="flex justify-between items-center pb-3 border-b border-slate-850/60">
            <div>
              <span className="text-[9px] text-slate-500 font-bold uppercase block tracking-wider">Order ID</span>
              <strong className="text-xs font-mono text-textPearl uppercase">{orderId}</strong>
            </div>
            
            <div className="text-right">
              <span className="text-[9px] text-slate-500 font-bold uppercase block tracking-wider">Elapsed Time</span>
              <strong className="text-xs text-primary flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                <span>{elapsedMinutes} mins</span>
              </strong>
            </div>
          </div>

          {isCancelled ? (
            <div className="p-4 bg-red-500/10 border border-red-500/25 rounded-2xl flex items-center gap-3 text-red-400 text-xs font-semibold">
              <AlertTriangle className="w-6 h-6" />
              <span>This order has been cancelled by the kitchen. Please consult the waiter staff.</span>
            </div>
          ) : (
            <div className="relative pl-6 border-l border-slate-850 space-y-6 ml-3 py-1">
              {trackingSteps.map((step, idx) => {
                const isCompleted = idx < activeIndex;
                const isActive = idx === activeIndex;

                return (
                  <div key={step.key} className="relative flex items-start gap-4">
                    <div className={`absolute -left-[35px] w-6 h-6 rounded-full flex items-center justify-center border text-[10px] font-bold transition-all ${
                      isCompleted
                        ? 'bg-emerald-500 border-emerald-500 text-slate-950 shadow-md'
                        : isActive
                          ? 'bg-primary border-primary text-background shadow-lg shadow-primary/25 animate-pulse'
                          : 'bg-slate-900 border-slate-800 text-slate-500'
                    }`}>
                      {isCompleted ? <Check className="w-3.5 h-3.5" /> : idx + 1}
                    </div>

                    <div className="space-y-0.5">
                      <h3 className={`text-xs font-bold transition-colors ${
                        isActive ? 'text-primary' : isCompleted ? 'text-textPearl' : 'text-slate-550'
                      }`}>
                        {step.label}
                      </h3>
                      <p className={`text-[10px] transition-colors leading-relaxed ${
                        isActive ? 'text-slate-350 font-semibold' : 'text-slate-500'
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

        {/* SECTION 2: LIVE BILL RUNNING ACCOUNT */}
        <Card className="p-6 border-slate-850 bg-slate-900/20 rounded-3xl space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-slate-850/60">
            <h3 className="text-xs font-bold text-textPearl uppercase tracking-wider">Table Invoicing Summary</h3>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              Status: <span className={order.paymentStatus === 'paid' ? 'text-emerald-500' : 'text-amber-500'}>
                {order.paymentStatus?.toUpperCase() || 'PENDING'}
              </span>
            </span>
          </div>
          
          <div className="space-y-3">
            {order.items?.map((item: any, idx: number) => (
              <div key={idx} className="flex justify-between items-start text-xs font-semibold">
                <div className="space-y-0.5">
                  <span className="text-slate-350">{item.name} x{item.count}</span>
                  {item.notes ? (
                    <p className="text-[9px] text-primary font-semibold">Notes: {item.notes}</p>
                  ) : null}
                </div>
                <span className="text-textPearl font-mono">{formatPrice(item.pricePerUnit * item.count)}</span>
              </div>
            ))}
          </div>

          <div className="bg-slate-950/40 border border-slate-850 p-4 rounded-2xl text-xs font-semibold text-slate-400 space-y-2 pt-3">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span className="text-textPearl font-mono">{formatPrice(orderSubtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span>GST (5%)</span>
              <span className="text-textPearl font-mono">{formatPrice(orderTax)}</span>
            </div>
            <div className="flex justify-between">
              <span>Service Charge (5%)</span>
              <span className="text-textPearl font-mono">{formatPrice(orderServiceCharge)}</span>
            </div>
            <div className="flex justify-between text-textPearl font-extrabold text-sm pt-2.5 border-t border-slate-850/60">
              <span>Grand Total</span>
              <span className="text-primary font-mono">{formatPrice(orderTotal)}</span>
            </div>
          </div>

          {/* Invoicing triggers */}
          <div className="pt-2 flex gap-2">
            {!order.billRequestedAt ? (
              <Button
                className="w-full text-xs font-bold py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-background"
                onClick={handleRequestBill}
              >
                Request Bill
              </Button>
            ) : order.paymentStatus !== 'paid' ? (
              <Button
                className="w-full text-xs font-bold py-3 bg-gradient-to-r from-primary to-amber-600 hover:from-primary-hover hover:to-amber-700 text-background"
                onClick={() => setIsPaymentModalOpen(true)}
              >
                Settle Payment
              </Button>
            ) : (
              <Badge variant="success" className="w-full text-center py-2 text-xs font-bold">
                Invoice Settled Successfully
              </Badge>
            )}
          </div>
        </Card>

        {/* SECTION 3: Diner Assistance panel calls */}
        <Card className="p-5 border-slate-850 bg-slate-900/20 rounded-3xl space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-slate-850/60">
            <h3 className="text-xs font-bold text-textPearl uppercase tracking-wider">Service Assistance alert</h3>
            <button
              onClick={() => setIsRequestAlertOpen(true)}
              className="text-[10px] text-primary hover:text-primary-hover font-bold uppercase tracking-wider flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Alert</span>
            </button>
          </div>

          {activeTableRequests.length === 0 ? (
            <p className="text-[10.5px] text-slate-500 font-bold uppercase py-2">No service alerts requested.</p>
          ) : (
            <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
              {activeTableRequests.slice(0, 3).map((req) => (
                <div key={req.id} className="bg-slate-950/40 p-2.5 border border-slate-855 rounded-xl flex justify-between items-center text-xs">
                  <div className="space-y-0.5">
                    <span className="font-bold text-slate-300 block">{req.requestType}</span>
                    <span className="text-[8.5px] text-slate-550 block font-semibold">
                      {new Date(req.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <Badge variant={req.status === 'Completed' ? 'success' : 'warning'} className="scale-90 origin-right">
                    {req.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* SECTION 4: Past Orders History */}
        {sessionOrders.length > 1 && (
          <Card className="p-5 border-slate-850 bg-slate-900/20 rounded-3xl space-y-4">
            <h3 className="text-xs font-bold text-textPearl uppercase tracking-wider pb-2 border-b border-slate-850/60">
              Session Order History
            </h3>
            <div className="space-y-3.5 divide-y divide-slate-850/40">
              {sessionOrders.map((o) => {
                if (o.orderId === orderId) return null; // skip current
                return (
                  <div key={o.id} className="flex justify-between items-center pt-3.5 first:pt-0 text-xs select-none">
                    <div className="space-y-0.5">
                      <span className="font-bold text-textPearl block">Order: {o.orderId}</span>
                      <span className="text-[9.5px] text-slate-500 font-bold block uppercase tracking-wider">
                        {o.items?.length || 0} items • {formatPrice(o.total)}
                      </span>
                    </div>
                    <Badge variant={o.status === 'CANCELLED' ? 'danger' : 'success'} className="scale-90">
                      {o.status}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </Card>
        )}
      </main>

      {/* NEW ASSISTANCE ALERT SELECTOR MODAL */}
      <Modal
        isOpen={isRequestAlertOpen}
        onClose={() => setIsRequestAlertOpen(false)}
        title="Request Service Staff"
      >
        <div className="space-y-4 text-left select-none text-xs">
          <p className="text-slate-400 font-medium leading-relaxed">
            Select a service category below. An alert notification will immediately route to the waiter dashboard commands desk.
          </p>

          <div className="grid grid-cols-2 gap-3.5 pt-2">
            {[
              { label: 'Call Waiter', desc: 'General assistance' },
              { label: 'Need Water', desc: 'Chilled mineral water' },
              { label: 'Extra Plates', desc: 'Clean plates' },
              { label: 'Extra Spoons', desc: 'Silverware/spoons' },
              { label: 'Tissues', desc: 'Napkins/tissues' },
              { label: 'Cleaning', desc: 'Wipe down table' },
              { label: 'Other Request', desc: 'Custom help' }
            ].map(opt => (
              <button
                key={opt.label}
                disabled={isSubmittingRequest}
                onClick={() => handleCallWaiter(opt.label)}
                className="p-4 bg-slate-900 hover:bg-slate-850 border border-slate-850 hover:border-primary/50 text-slate-350 hover:text-primary rounded-2xl flex flex-col items-center justify-center text-center gap-2.5 transition-all shadow-md group"
              >
                <div className="w-8 h-8 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center text-slate-450 group-hover:text-primary transition-all">
                  <Bell className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold block leading-tight">{opt.label}</span>
                  <span className="text-[8.5px] text-slate-500 mt-0.5 block">{opt.desc}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </Modal>

      {/* SIMULATED INVOICING CHECKOUT MODAL */}
      <Modal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        title="Simulated Bill Settlement"
      >
        <div className="space-y-5 text-left select-none text-xs">
          <div className="bg-slate-900 border border-slate-850 p-4.5 rounded-2xl space-y-2 text-xs font-semibold text-slate-400">
            <div className="flex justify-between">
              <span>Total Payable Amount</span>
              <span className="text-primary font-mono text-sm font-extrabold">{formatPrice(orderTotal)}</span>
            </div>
            <p className="text-[10px] text-slate-550 leading-relaxed pt-1.5 border-t border-slate-850/60 font-medium">
              We process simulated billing. Select a payment mechanism below to trigger automated validation.
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Payment Options</label>
            <div className="grid grid-cols-3 gap-2.5">
              {[
                { id: 'UPI', label: 'UPI QR' },
                { id: 'Card', label: 'Credit Card' },
                { id: 'Wallet', label: 'E-Wallet' }
              ].map(opt => (
                <button
                  key={opt.id}
                  onClick={() => setSelectedPaymentMethod(opt.id)}
                  disabled={isProcessingPayment}
                  className={`p-3 rounded-xl border flex flex-col items-center justify-center font-bold text-center gap-1.5 transition-all ${
                    selectedPaymentMethod === opt.id
                      ? 'bg-primary/10 border-primary text-primary'
                      : 'bg-slate-900 border-slate-850 text-slate-400 hover:text-textPearl'
                  }`}
                >
                  <DollarSign className="w-4 h-4 text-emerald-500" />
                  <span className="text-[10.5px] leading-tight block">{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Loading details */}
          {isProcessingPayment && (
            <div className="p-4 bg-slate-900 border border-slate-850 rounded-xl flex items-center justify-center space-x-3">
              <div className="w-5 h-5 border-2 border-primary/20 border-t-primary rounded-full animate-spin shrink-0" />
              <span className="text-[11px] text-slate-350 font-semibold animate-pulse">Contacting payment clearance gateway...</span>
            </div>
          )}

          <Button
            className="w-full text-xs font-bold py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-background"
            onClick={handleProcessPayment}
            isLoading={isProcessingPayment}
          >
            Confirm Simulated Settle
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default OrderTracking;
