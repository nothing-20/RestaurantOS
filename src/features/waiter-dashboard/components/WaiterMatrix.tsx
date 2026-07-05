import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { 
  collection, 
  onSnapshot, 
  doc, 
  updateDoc, 
  addDoc, 
  query,
  where,
  arrayUnion,
  writeBatch
} from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { useAuth } from '../../../context/AuthContext';
import { IOrder, ITable, IServiceRequest, ITimelineEvent, IHandoverDoc, ISatisfactionRating } from '../../../types';
import { formatPrice } from '../../../utils/format';
import { getMenuItemPath } from '../../../firebase/collections';
import { logEvent } from '../../../services/eventEngine';
import { ActivityFeed } from '../../../components/ActivityFeed';

// UI Kit
import Card from '../../../components/ui/Card/Card';
import Badge from '../../../components/ui/Badge/Badge';
import Button from '../../../components/ui/Button/Button';
import Input from '../../../components/ui/Input/Input';
import Modal from '../../../components/ui/Modal/Modal';
import LoadingSpinner from '../../../components/ui/LoadingSpinner/LoadingSpinner';

import toast from 'react-hot-toast';
import { 
  LayoutGrid, 
  Coffee, 
  DollarSign, 
  CheckCircle,
  Clock, 
  Award,
  ListTodo,
  TrendingUp,
  MapPin,
  Check,
  Play,
  Square,
  Pause,
  ArrowRightLeft,
  Users,
  AlertOctagon,
  UserPlus,
  Activity,
  Sparkles
} from 'lucide-react';

type TWaiterTab = 'command_center' | 'floor_map' | 'cleaning' | 'stats' | 'live_feed' | 'manager_console';

interface IMenuItem {
  id: string;
  name: string;
  price: number; // in cents
  category: string;
}

// ─── Shift Data Interface ──────────────────────────────────────────────────
interface IWaiterShift {
  isActive: boolean;
  status: 'active' | 'break';
  startTime: string | null;
  endTime: string | null;
  breakStart: string | null;
  breakDurationMs: number;
  stats: {
    ordersDelivered: number;
    tablesServed: number;
    requestsResolved: number;
    billsGenerated: number;
    cleaningCompleted: number;
  };
}

// ─── Operational Task Model ───────────────────────────────────────────────
type TTaskType = 
  | 'Deliver Food'
  | 'Kitchen Ready'
  | 'Customer Request'
  | 'Bill Request'
  | 'Cleaning'
  | 'Birthday Service'
  | 'Baby Chair'
  | 'Wheelchair Assistance'
  | 'Water'
  | 'Condiments'
  | 'Special Assistance'
  | 'Manager Task'
  | 'Complaint Review'
  | 'Deliver Order' 
  | 'Generate Bill' 
  | 'Collect Payment' 
  | 'Clean Table'
  | 'Refill Water'
  | 'Other Assistance';

interface IWaiterTask {
  id: string;
  type: TTaskType;
  tableNumber: string;
  section: string;
  description: string;
  createdAt: string; // ISO string
  status: 'Pending' | 'Accepted';
  priority: 'critical' | 'high' | 'medium' | 'low';
  targetId: string; // original document ID
  notes?: string;
  source: 'order' | 'request' | 'table' | 'managerReview';
}

export const WaiterMatrix: React.FC = () => {
  const { user } = useAuth();
  const isManagerOrOwner = user?.role === 'owner' || user?.role === 'manager' || user?.role === 'admin';
  
  // ─── Realtime Database States ──────────────────────────────────────────────
  const [tables, setTables] = useState<ITable[]>([]);
  const [orders, setOrders] = useState<IOrder[]>([]);
  const [legacyRequests, setLegacyRequests] = useState<IServiceRequest[]>([]);
  const [waiterRequests, setWaiterRequests] = useState<any[]>([]);
  const [menuItems, setMenuItems] = useState<IMenuItem[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [incomingHandovers, setIncomingHandovers] = useState<IHandoverDoc[]>([]);
  const [managerReviews, setManagerReviews] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // ─── Command Center Navigation / Modal States ──────────────────────────────
  const [activeTab, setActiveTab] = useState<TWaiterTab>('command_center');
  const [selectedOrder, setSelectedOrder] = useState<IOrder | null>(null);
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [isUpdatingBill, setIsUpdatingBill] = useState(false);

  // ─── Customer Satisfaction Review Modal States ─────────────────────────────
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackRating, setFeedbackRating] = useState<'Excellent' | 'Good' | 'Neutral' | 'Needs Attention' | 'Complaint'>('Excellent');
  const [feedbackNotes, setFeedbackNotes] = useState('');
  const [isRepeatCustomer, setIsRepeatCustomer] = useState(false);
  
  // Upgraded structured feedback metrics
  const [serviceSpeed, setServiceSpeed] = useState<number>(5);
  const [foodQuality, setFoodQuality] = useState<number>(5);
  const [cleanliness, setCleanliness] = useState<number>(5);
  const [staffBehavior, setStaffBehavior] = useState<number>(5);
  const [waitingTime, setWaitingTime] = useState<number>(5);
  const [ambience, setAmbience] = useState<number>(5);
  const [customerType, setCustomerType] = useState<string>('Couple');
  const [visitOccasion, setVisitOccasion] = useState<string>('Casual');

  // ─── Shift Handover Modal States ──────────────────────────────────────────
  const [showHandoverModal, setShowHandoverModal] = useState(false);
  const [handoverRecipientId, setHandoverRecipientId] = useState('');
  const [handoverReason, setHandoverReason] = useState('End of shift handover');
  const [isSubmittingHandover, setIsSubmittingHandover] = useState(false);

  // ─── Table Seating / Check-in Modal States ──────────────────────────────────
  const [selectedTable, setSelectedTable] = useState<ITable | null>(null);
  const [guestsCount, setGuestsCount] = useState<number>(2);
  const [tableNotesInput, setTableNotesInput] = useState<string>('');
  const [tableSectionInput, setTableSectionInput] = useState<string>('Main Room');

  // ─── Quick Order Placement Modal States ────────────────────────────────────
  const [orderTable, setOrderTable] = useState<ITable | null>(null);
  const [cart, setCart] = useState<Record<string, { item: IMenuItem; count: number }>>({});
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');

  // ─── Manager Console States ────────────────────────────────────────────────
  const [bulkSection, setBulkSection] = useState('Main Room');
  const [bulkSectionWaiterId, setBulkSectionWaiterId] = useState('');
  const [autoAssignStrategy, setAutoAssignStrategy] = useState<'round-robin' | 'least-loaded'>('round-robin');

  // ─── Timer State (drives ticking durations every second) ───────────────────
  const [tick, setTick] = useState(0);

  // ─── Notifications Cache (to prevent duplicate toasts) ──────────────────────
  const notifiedEventsRef = React.useRef<Set<string>>(new Set());

  // ─── Manual Task Priority Overrides State ─────────────────────────────────
  const [priorityOverrides, setPriorityOverrides] = useState<Record<string, 'critical' | 'high' | 'medium' | 'low'>>({});

  // ─── Shift State (synchronized with LocalStorage) ──────────────────────────
  const [shift, setShift] = useState<IWaiterShift>(() => {
    const saved = localStorage.getItem(`shift_${user?.uid}`);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse saved shift state:', e);
      }
    }
    return {
      isActive: false,
      status: 'active',
      startTime: null,
      endTime: null,
      breakStart: null,
      breakDurationMs: 0,
      stats: {
        ordersDelivered: 0,
        tablesServed: 0,
        requestsResolved: 0,
        billsGenerated: 0,
        cleaningCompleted: 0
      }
    };
  });

  // Persist shift changes
  useEffect(() => {
    if (user?.uid) {
      localStorage.setItem(`shift_${user.uid}`, JSON.stringify(shift));
    }
  }, [shift, user?.uid]);

  // Ticking effect for timers and shift durations
  useEffect(() => {
    const interval = setInterval(() => {
      setTick(t => t + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // ─── Realtime Database Streams Hookup ──────────────────────────────────────
  useEffect(() => {
    if (!user?.tenantId) return;

    setIsLoading(true);

    // 1. Subscribe to Tables
    const tablesRef = collection(db, 'restaurants', user.tenantId, 'tables');
    const unsubTables = onSnapshot(tablesRef, (snap) => {
      const list: ITable[] = [];
      snap.forEach(docSnap => {
        list.push({ id: docSnap.id, ...docSnap.data() } as ITable);
      });
      list.sort((a, b) => a.number.localeCompare(b.number, undefined, { numeric: true }));
      setTables(list);
    });

    // 2. Subscribe to Orders
    const ordersRef = collection(db, 'restaurants', user.tenantId, 'orders');
    const unsubOrders = onSnapshot(ordersRef, (snap) => {
      const list: IOrder[] = [];
      snap.forEach(docSnap => {
        list.push({ ...docSnap.data() } as IOrder);
      });
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setOrders(list);
      setIsLoading(false);
    }, (err) => {
      console.error(err);
      setIsLoading(false);
    });

    // 3. Subscribe to Legacy Requests
    const reqRef = collection(db, 'restaurants', user.tenantId, 'requests');
    const unsubReq = onSnapshot(reqRef, (snap) => {
      const list: IServiceRequest[] = [];
      snap.forEach(docSnap => {
        list.push({ ...docSnap.data() } as IServiceRequest);
      });
      setLegacyRequests(list);
    });

    // 4. Subscribe to Call Waiter Requests
    const waiterReqRef = collection(db, 'restaurants', user.tenantId, 'waiterRequests');
    const unsubWaiterReq = onSnapshot(waiterReqRef, (snap) => {
      const list: any[] = [];
      snap.forEach(docSnap => {
        const data = docSnap.data();
        if (data.status !== 'Completed') {
          list.push({ id: docSnap.id, ...data });
        }
      });
      setWaiterRequests(list);
    });

    // 5. Fetch Menu Items
    const menuPath = getMenuItemPath(user.tenantId);
    const menuRef = collection(db, menuPath);
    const unsubMenu = onSnapshot(menuRef, (snap) => {
      const list: IMenuItem[] = [];
      snap.forEach(docSnap => {
        const data = docSnap.data();
        list.push({
          id: docSnap.id,
          name: data.name,
          price: data.price,
          category: data.category || 'Other'
        });
      });
      setMenuItems(list);
    });

    // 6. Fetch Active Staff Employees (to perform handover or tables assignment)
    const employeesRef = collection(db, 'employees');
    const qEmp = query(
      employeesRef,
      where('tenantId', '==', user.tenantId),
      where('status', '==', 'active')
    );
    const unsubEmployees = onSnapshot(qEmp, (snap) => {
      const list: any[] = [];
      snap.forEach(docSnap => {
        list.push({ id: docSnap.id, ...docSnap.data() });
      });
      setEmployees(list);
    });

    // 7. Subscribe to Pending Incoming Shift Handovers for this waiter
    const handoversRef = collection(db, 'restaurants', user.tenantId, 'handovers');
    const qHandover = query(
      handoversRef,
      where('handoverTo', '==', user.uid),
      where('status', '==', 'Pending')
    );
    const unsubHandovers = onSnapshot(qHandover, (snap) => {
      const list: IHandoverDoc[] = [];
      snap.forEach(docSnap => {
        list.push({ id: docSnap.id, ...docSnap.data() } as IHandoverDoc);
      });
      setIncomingHandovers(list);
    });

    // 8. Subscribe to active managerReviews
    const mReviewsRef = collection(db, 'restaurants', user.tenantId, 'managerReviews');
    const unsubMReviews = onSnapshot(mReviewsRef, (snap) => {
      const list: any[] = [];
      snap.forEach(docSnap => {
        list.push({ id: docSnap.id, ...docSnap.data() });
      });
      setManagerReviews(list);
    });

    return () => {
      unsubTables();
      unsubOrders();
      unsubReq();
      unsubWaiterReq();
      unsubMenu();
      unsubEmployees();
      unsubHandovers();
      unsubMReviews();
    };
  }, [user?.tenantId, user?.uid]);

  // ─── Realtime Alert Toasts ─────────────────────────────────────────────────
  useEffect(() => {
    if (isLoading || !user?.tenantId || !shift.isActive) return;

    // A. Kitchen Ready Warnings
    orders.forEach(o => {
      if (o.status === 'READY' && o.waiterId === user.uid) {
        const cacheKey = `cc-ready-${o.orderId}`;
        if (!notifiedEventsRef.current.has(cacheKey)) {
          notifiedEventsRef.current.add(cacheKey);
          toast.success(`🍳 Table ${o.tableNumber} is ready for pick-up!`, { duration: 4000 });
        }

        const elapsedMins = (Date.now() - new Date(o.updatedAt || o.createdAt).getTime()) / 60000;
        if (elapsedMins > 5) {
          const delayKey = `cc-delayed-${o.orderId}`;
          if (!notifiedEventsRef.current.has(delayKey)) {
            notifiedEventsRef.current.add(delayKey);
            toast(`🚨 Table ${o.tableNumber} order delivery is delayed! (${Math.floor(elapsedMins)}m wait)`, {
              icon: '⚠️',
              duration: 5000
            });
          }
        }
      }
    });

    // B. Customer Requests alerts
    waiterRequests.forEach(req => {
      if (req.status === 'Pending') {
        const tObj = tables.find(tb => tb.number === req.tableNumber);
        if (tObj?.assignedWaiterId === user.uid) {
          const cacheKey = `cc-req-${req.id}`;
          if (!notifiedEventsRef.current.has(cacheKey)) {
            notifiedEventsRef.current.add(cacheKey);
            toast(`🙋‍♂️ Table ${req.tableNumber} requested ${req.requestType}`, {
              icon: '🔔',
              duration: 4000
            });
          }
        }
      }
    });

    // C. Bill Requests alerts
    tables.forEach(t => {
      if (t.status === 'bill_requested' && t.assignedWaiterId === user.uid) {
        const cacheKey = `cc-bill-${t.id}`;
        if (!notifiedEventsRef.current.has(cacheKey)) {
          notifiedEventsRef.current.add(cacheKey);
          toast.success(`💰 Table ${t.number} has requested their invoice!`, { duration: 5000 });
        }
      }
    });
  }, [orders, waiterRequests, tables, isLoading, user?.tenantId, shift.isActive]);

  // ─── Shift Operations ─────────────────────────────────────────────────────

  const handleStartShift = () => {
    const now = new Date().toISOString();
    setShift({
      isActive: true,
      status: 'active',
      startTime: now,
      endTime: null,
      breakStart: null,
      breakDurationMs: 0,
      stats: {
        ordersDelivered: 0,
        tablesServed: 0,
        requestsResolved: 0,
        billsGenerated: 0,
        cleaningCompleted: 0
      }
    });
    toast.success('Your shift has started! Ready for dining operations.');

    // Event log
    logEvent(user?.tenantId || '', {
      eventType: 'Shift Started',
      eventCategory: 'Waiter',
      performedBy: user?.displayName || user?.email || 'Waiter',
      performedByRole: user?.role || 'waiter',
      title: 'Shift Started',
      description: `Waiter ${user?.displayName || user?.email} clocked in for today's floor shifts.`
    });
  };

  const handleEndShiftClick = () => {
    // Check for pending work
    const pendingTables = tables.filter(t => t.assignedWaiterId === user?.uid && t.status !== 'empty');
    const pendingDeliveries = orders.filter(o => o.waiterId === user?.uid && o.status === 'READY');
    const myDinerRequests = waiterRequests.filter(r => {
      const tableObj = tables.find(t => t.number === r.tableNumber);
      return tableObj?.assignedWaiterId === user?.uid && r.status !== 'Completed';
    });

    const hasPendingWork = pendingTables.length > 0 || pendingDeliveries.length > 0 || myDinerRequests.length > 0;

    if (hasPendingWork) {
      setHandoverRecipientId('');
      setHandoverReason('Shift handover due to clock-out');
      setShowHandoverModal(true);
    } else {
      handleEndShift();
    }
  };

  const handleEndShift = () => {
    const now = new Date().toISOString();
    const finalShift = { ...shift, isActive: false, endTime: now };
    setShift(finalShift);
    
    const workingTimeStr = formatDuration(getShiftWorkingTime(finalShift));
    toast((t) => (
      <div className="text-left space-y-1 text-xs">
        <strong className="text-sm text-textPearl">Shift Summary Completed</strong>
        <p>🕒 Active Hours: {workingTimeStr}</p>
        <p>🍽️ Deliveries Made: {finalShift.stats.ordersDelivered}</p>
        <p>🔔 Alerts Resolved: {finalShift.stats.requestsResolved}</p>
        <p>🧹 Tables Reset: {finalShift.stats.cleaningCompleted}</p>
      </div>
    ), { duration: 10000 });

    logEvent(user?.tenantId || '', {
      eventType: 'Shift Ended',
      eventCategory: 'Waiter',
      performedBy: user?.displayName || user?.email || 'Waiter',
      performedByRole: user?.role || 'waiter',
      title: 'Shift Completed',
      description: `Waiter ${user?.displayName || user?.email} ended shift. Served ${finalShift.stats.tablesServed} tables.`,
      metadata: { workingTime: workingTimeStr }
    });
  };

  const handleStartBreak = () => {
    setShift(prev => ({
      ...prev,
      status: 'break',
      breakStart: new Date().toISOString()
    }));
    toast('You are now on a Break.', { icon: '☕' });

    logEvent(user?.tenantId || '', {
      eventType: 'Break Started',
      eventCategory: 'Waiter',
      performedBy: user?.displayName || user?.email || 'Waiter',
      performedByRole: user?.role || 'waiter',
      title: 'Waiter Break Started',
      description: `Waiter ${user?.displayName || user?.email} started break.`
    });
  };

  const handleEndBreak = () => {
    if (!shift.breakStart) return;
    const breakMs = Date.now() - new Date(shift.breakStart).getTime();
    setShift(prev => ({
      ...prev,
      status: 'active',
      breakStart: null,
      breakDurationMs: prev.breakDurationMs + breakMs
    }));
    toast.success('Break finished. Back to active command duty!');

    logEvent(user?.tenantId || '', {
      eventType: 'Break Ended',
      eventCategory: 'Waiter',
      performedBy: user?.displayName || user?.email || 'Waiter',
      performedByRole: user?.role || 'waiter',
      title: 'Waiter Break Completed',
      description: `Waiter ${user?.displayName || user?.email} returned from break.`
    });
  };

  const getShiftWorkingTime = (s: IWaiterShift) => {
    if (!s.startTime) return 0;
    const end = s.endTime ? new Date(s.endTime).getTime() : Date.now();
    const duration = end - new Date(s.startTime).getTime();
    
    let activeBreakTime = 0;
    if (s.status === 'break' && s.breakStart) {
      activeBreakTime = Date.now() - new Date(s.breakStart).getTime();
    }
    
    return Math.max(0, duration - (s.breakDurationMs + activeBreakTime));
  };

  // ─── Shift Handover Submission ─────────────────────────────────────────────
  const handleInitiateHandover = async () => {
    if (!user?.tenantId || !handoverRecipientId) {
      toast.error('Please select a receiving waiter.');
      return;
    }
    setIsSubmittingHandover(true);
    try {
      const recipient = employees.find(e => e.id === handoverRecipientId);
      const recipientName = recipient?.displayName || recipient?.email || 'Waiter';

      const myTables = tables.filter(t => t.assignedWaiterId === user?.uid && t.status !== 'empty');
      const myDeliveries = orders.filter(o => o.waiterId === user?.uid && o.status === 'READY');
      const myRequests = waiterRequests.filter(r => {
        const tableObj = tables.find(t => t.number === r.tableNumber);
        return tableObj?.assignedWaiterId === user?.uid && r.status !== 'Completed';
      });

      const tableIds = myTables.map(t => t.id);
      const orderIds = myDeliveries.map(o => o.orderId);
      const requestIds = myRequests.map(r => r.id);

      const handoverData: IHandoverDoc = {
        handoverBy: user.uid,
        handoverByName: user.displayName || user.email || 'Waiter',
        handoverTo: handoverRecipientId,
        handoverToName: recipientName,
        handoverTime: new Date().toISOString(),
        handoverReason,
        status: 'Pending',
        tablesCount: tableIds.length,
        ordersCount: orderIds.length,
        requestsCount: requestIds.length,
        tableIds,
        orderIds,
        requestIds
      };

      const handoversCol = collection(db, 'restaurants', user.tenantId, 'handovers');
      const handoverDocRef = await addDoc(handoversCol, handoverData);
      
      toast.success(`Handover request submitted to ${recipientName}.`);
      setShowHandoverModal(false);

      logEvent(user.tenantId, {
        eventType: 'Shift Handover Initiated',
        eventCategory: 'Management',
        performedBy: user.displayName || user.email || 'Waiter',
        performedByRole: user.role || 'waiter',
        title: 'Handover Initiated',
        description: `Handover of ${tableIds.length} tables pending from ${user.displayName} to ${recipientName}.`,
        taskId: handoverDocRef.id
      });

      handleEndShift();
    } catch (e) {
      console.error(e);
      toast.error('Failed to submit handover.');
    } finally {
      setIsSubmittingHandover(false);
    }
  };

  // Accept Shift Handover Flow
  const handleAcceptHandover = async (handover: IHandoverDoc) => {
    if (!user?.tenantId || !handover.id) return;
    try {
      const batch = writeBatch(db);

      // 1. Reassign Tables
      handover.tableIds.forEach(tId => {
        const tableDocRef = doc(db, 'restaurants', user.tenantId, 'tables', tId);
        batch.update(tableDocRef, {
          assignedWaiterId: user.uid,
          assignedWaiterName: user.displayName || user.email || 'Waiter'
        });
      });

      // 2. Reassign Ready Orders
      handover.orderIds.forEach(oId => {
        const orderDocRef = doc(db, 'restaurants', user.tenantId, 'orders', oId);
        batch.update(orderDocRef, {
          waiterId: user.uid,
          waiterName: user.displayName || user.email || 'Waiter'
        });
      });

      // 3. Reassign Diner Requests
      handover.requestIds.forEach(rId => {
        const requestDocRef = doc(db, 'restaurants', user.tenantId, 'waiterRequests', rId);
        batch.update(requestDocRef, {
          acceptedBy: user.displayName || user.email || 'Waiter'
        });
      });

      // 4. Mark handover doc as Accepted
      const handoverDocRef = doc(db, 'restaurants', user.tenantId, 'handovers', handover.id);
      batch.update(handoverDocRef, { status: 'Accepted' });

      await batch.commit();
      toast.success(`Shift handover accepted! ${handover.tablesCount} tables transferred to you.`);

      logEvent(user.tenantId, {
        eventType: 'Shift Handover Accepted',
        eventCategory: 'Management',
        performedBy: user.displayName || user.email || 'Waiter',
        performedByRole: user.role || 'waiter',
        title: 'Handover Accepted',
        description: `Shift handover from ${handover.handoverByName} accepted by ${user.displayName || user.email}.`,
        taskId: handover.id
      });
    } catch (e) {
      console.error(e);
      toast.error('Failed to accept shift handover.');
    }
  };

  const handleRejectHandover = async (handover: IHandoverDoc) => {
    if (!user?.tenantId || !handover.id) return;
    try {
      const handoverDocRef = doc(db, 'restaurants', user.tenantId, 'handovers', handover.id);
      await updateDoc(handoverDocRef, { status: 'Rejected' });
      toast.success('Shift handover rejected.');

      logEvent(user.tenantId, {
        eventType: 'Shift Handover Rejected',
        eventCategory: 'Management',
        performedBy: user.displayName || user.email || 'Waiter',
        performedByRole: user.role || 'waiter',
        title: 'Handover Rejected',
        description: `Shift handover from ${handover.handoverByName} rejected by ${user.displayName || user.email}.`,
        taskId: handover.id
      });
    } catch (e) {
      console.error(e);
    }
  };

  // ─── Unified Dynamic Tasks Engine ──────────────────────────────────────────

  const derivedTasks = useMemo((): IWaiterTask[] => {
    const list: IWaiterTask[] = [];

    // A. Ready orders -> "Deliver Food" / "Kitchen Ready"
    orders.forEach(o => {
      if (o.status === 'READY' && o.waiterId === user?.uid) {
        const tableObj = tables.find(t => t.number === o.tableNumber);
        const section = tableObj?.section || 'Main Room';
        const notes = tableObj?.tableNotes || '';
        list.push({
          id: `deliver-${o.orderId}`,
          type: 'Kitchen Ready',
          tableNumber: o.tableNumber,
          section,
          description: `Deliver food: ${o.items.map(i => `${i.count}x ${i.name}`).join(', ')}`,
          createdAt: o.updatedAt || o.createdAt,
          status: o.waiterId ? 'Accepted' : 'Pending',
          priority: 'medium',
          targetId: o.orderId,
          notes,
          source: 'order'
        });
      }
    });

    // B. Customer Requests
    waiterRequests.forEach(req => {
      const tableObj = tables.find(t => t.number === req.tableNumber);
      if (tableObj?.assignedWaiterId === user?.uid) {
        const section = tableObj?.section || 'Main Room';
        const notes = tableObj?.tableNotes || '';

        let taskType: TTaskType = 'Customer Request';
        if (req.requestType === 'Water' || req.requestType === 'Need Water') taskType = 'Water';
        else if (req.requestType === 'Baby Chair') taskType = 'Baby Chair';
        else if (req.requestType === 'Wheelchair') taskType = 'Wheelchair Assistance';
        else if (req.requestType === 'Condiments') taskType = 'Condiments';
        else if (req.requestType === 'Birthday') taskType = 'Birthday Service';
        else if (req.requestType === 'Special' || req.requestType === 'Special Assistance') taskType = 'Special Assistance';

        list.push({
          id: `req-${req.id}`,
          type: taskType,
          tableNumber: req.tableNumber,
          section,
          description: `Diner requests assistance: ${req.requestType}`,
          createdAt: req.createdAt,
          status: req.status === 'Accepted' ? 'Accepted' : 'Pending',
          priority: 'medium',
          targetId: req.id,
          notes,
          source: 'request'
        });
      }
    });

    // Legacy Alerts
    legacyRequests.forEach(req => {
      const tableObj = tables.find(t => t.number === req.tableNumber);
      if (tableObj?.assignedWaiterId === user?.uid) {
        const section = tableObj?.section || 'Main Room';
        const notes = tableObj?.tableNotes || '';

        list.push({
          id: `legacy-${req.id}`,
          type: 'Customer Request',
          tableNumber: req.tableNumber,
          section,
          description: `Legacy Alert: ${req.type}`,
          createdAt: req.createdAt,
          status: 'Pending',
          priority: 'medium',
          targetId: req.id,
          notes,
          source: 'request'
        });
      }
    });

    // C. Table status is bill_requested -> "Bill Request"
    tables.forEach(t => {
      if (t.status === 'bill_requested' && t.assignedWaiterId === user?.uid) {
        const activeOrder = orders.find(o => o.orderId === t.activeOrderId);
        list.push({
          id: `bill-${t.id}`,
          type: 'Bill Request',
          tableNumber: t.number,
          section: t.section || 'Main Room',
          description: `Generate checkout invoice. Current total: ${activeOrder ? formatPrice(activeOrder.total) : '—'}`,
          createdAt: new Date().toISOString(),
          status: 'Pending',
          priority: 'high',
          targetId: t.id,
          notes: t.tableNotes || '',
          source: 'table'
        });
      }
    });

    // D. Table status is cleaning -> "Cleaning"
    tables.forEach(t => {
      if (t.status === 'cleaning' && t.assignedWaiterId === user?.uid) {
        list.push({
          id: `clean-${t.id}`,
          type: 'Cleaning',
          tableNumber: t.number,
          section: t.section || 'Main Room',
          description: 'Clear and sanitize table for next guest parties.',
          createdAt: (t as any).cleaningStartedAt || new Date().toISOString(),
          status: 'Pending',
          priority: 'medium',
          targetId: t.id,
          notes: t.tableNotes || '',
          source: 'table'
        });
      }
    });

    // E. Manager Review Escalations (Manager Task / Complaint Review)
    managerReviews.forEach(rev => {
      if (rev.resolutionStatus !== 'Resolved') {
        const isComplaint = rev.rating === 'Complaint' || rev.rating === 'Needs Attention';
        list.push({
          id: `mrev-${rev.id}`,
          type: rev.rating === 'Complaint' ? 'Complaint Review' : 'Manager Task',
          tableNumber: rev.tableNumber || '—',
          section: 'Manager',
          description: `Review: ${rev.notes || rev.rating || 'Needs Attention'}`,
          createdAt: rev.submittedAt || new Date().toISOString(),
          status: rev.resolutionStatus === 'In Progress' ? 'Accepted' : 'Pending',
          priority: isComplaint ? 'critical' : 'high',
          targetId: rev.id,
          notes: `Server: ${rev.submittedByName || 'Server'}`,
          source: 'managerReview'
        });
      }
    });

    // Calculate smart priorities dynamically
    const tasksWithPriorities = list.map(task => {
      if (priorityOverrides[task.id]) {
        return { ...task, priority: priorityOverrides[task.id] };
      }

      const isVip = task.notes?.toLowerCase().includes('vip') || task.tableNumber === 'VIP';
      const elapsedMinutes = (Date.now() - new Date(task.createdAt).getTime()) / 60000;

      let priority: 'critical' | 'high' | 'medium' | 'low' = 'medium';

      if (task.type === 'Deliver Food' || task.type === 'Kitchen Ready' || task.type === 'Deliver Order') {
        if (isVip || elapsedMinutes > 10) priority = 'critical';
        else if (elapsedMinutes > 5) priority = 'high';
        else if (elapsedMinutes > 2) priority = 'medium';
        else priority = 'low';
      } else if (task.type === 'Generate Bill' || task.type === 'Bill Request') {
        if (elapsedMinutes > 5) priority = 'critical';
        else priority = 'high';
      } else if (task.type === 'Clean Table' || task.type === 'Cleaning') {
        if (elapsedMinutes > 8) priority = 'high';
        else priority = 'medium';
      } else if (task.type === 'Complaint Review') {
        priority = 'critical';
      } else if (task.type === 'Manager Task') {
        priority = 'high';
      } else {
        if (isVip || elapsedMinutes > 8) priority = 'critical';
        else if (elapsedMinutes > 4) priority = 'high';
        else priority = 'medium';
      }

      return { ...task, priority };
    });

    return tasksWithPriorities;
  }, [orders, tables, waiterRequests, legacyRequests, managerReviews, priorityOverrides, user?.uid, tick]);

  // ─── Route Optimization / Next Best Action Sorting ──────────────────────
  const optimizedTasks = useMemo(() => {
    const list = [...derivedTasks];

    const priorityWeights = {
      critical: 0,
      high: 1,
      medium: 2,
      low: 3
    };

    list.sort((a, b) => {
      const aW = priorityWeights[a.priority];
      const bW = priorityWeights[b.priority];
      if (aW !== bW) return aW - bW;

      const aSec = a.section || '';
      const bSec = b.section || '';
      if (aSec !== bSec) return aSec.localeCompare(bSec);

      return a.tableNumber.localeCompare(b.tableNumber, undefined, { numeric: true });
    });

    return list;
  }, [derivedTasks]);

  // Hero panel recommendation next best action
  const nextBestAction = useMemo(() => {
    if (optimizedTasks.length > 0) return optimizedTasks[0];
    return null;
  }, [optimizedTasks]);

  // ─── Performance Stats Calculation ───────────────────────────────────────
  const performanceStats = useMemo(() => {
    const deliveredOrders = orders.filter(o => o.status === 'DELIVERED' && o.waiterId === user?.uid);
    let totalDeliverySecs = 0;
    let countDelivery = 0;

    deliveredOrders.forEach(o => {
      if (o.deliveredAt && o.createdAt) {
        const readyTimeStr = o.updatedAt || o.createdAt;
        const duration = Math.max(0, (new Date(o.deliveredAt).getTime() - new Date(readyTimeStr).getTime()) / 1000);
        totalDeliverySecs += duration;
        countDelivery++;
      }
    });

    const avgDeliveryMinutes = countDelivery > 0 
      ? Math.round((totalDeliverySecs / countDelivery) / 60) 
      : 0;

    let totalBillSecs = 0;
    let countBills = 0;
    const completedPaidOrders = orders.filter(o => o.status === 'COMPLETED' && o.paymentStatus === 'paid');
    completedPaidOrders.forEach(o => {
      const paidEvent = o.timeline?.find(e => e.type === 'COMPLETED');
      if (paidEvent && o.createdAt) {
        const duration = Math.max(0, (new Date(paidEvent.timestamp).getTime() - new Date(o.createdAt).getTime()) / 1000);
        totalBillSecs += duration;
        countBills++;
      }
    });
    const avgBillProcessingMinutes = countBills > 0
      ? Math.round((totalBillSecs / countBills) / 60)
      : 0;

    const activeTasksCount = optimizedTasks.length;
    const efficiencyScore = Math.max(0, 100 - (activeTasksCount * 5));

    return {
      avgDeliveryMinutes,
      avgBillProcessingMinutes,
      efficiencyScore
    };
  }, [orders, user?.uid, optimizedTasks]);

  // ─── Seating & Quick Order Placement Handlers ──────────────────────────

  const handleOccupyTableCC = async () => {
    if (!user?.tenantId || !selectedTable) return;
    try {
      const tableRef = doc(db, 'restaurants', user.tenantId, 'tables', selectedTable.id);
      await updateDoc(tableRef, {
        status: 'occupied',
        assignedWaiterId: user.uid,
        assignedWaiterName: user.displayName || user.email || 'Waiter',
        guestsCount: guestsCount,
        tableNotes: tableNotesInput,
        section: tableSectionInput
      });
      toast.success(`Guests checked in on Table ${selectedTable.number}.`);
      
      // Update shift stats
      setShift(prev => ({
        ...prev,
        stats: { ...prev.stats, tablesServed: prev.stats.tablesServed + 1 }
      }));

      logEvent(user.tenantId, {
        eventType: 'Customer Seated',
        eventCategory: 'Operational',
        performedBy: user.displayName || user.email || 'Waiter',
        performedByRole: user.role || 'waiter',
        tableId: selectedTable.id,
        tableNumber: selectedTable.number,
        title: 'Customer Seated',
        description: `Table ${selectedTable.number} was checked in with ${guestsCount} guests.`,
        metadata: { guests: guestsCount, section: tableSectionInput }
      });

      setSelectedTable(null);
      setTableNotesInput('');
    } catch (e) {
      console.error(e);
      toast.error('Check-in failed.');
    }
  };

  const handleSelfAssignTable = async (table: ITable) => {
    if (!user?.tenantId) return;
    try {
      const tableRef = doc(db, 'restaurants', user.tenantId, 'tables', table.id);
      await updateDoc(tableRef, {
        assignedWaiterId: user.uid,
        assignedWaiterName: user.displayName || user.email || 'Waiter'
      });
      toast.success(`Table ${table.number} assigned to you.`);

      logEvent(user.tenantId, {
        eventType: 'Task Assigned',
        eventCategory: 'Waiter',
        performedBy: user.displayName || user.email || 'Waiter',
        performedByRole: user.role || 'waiter',
        tableId: table.id,
        tableNumber: table.number,
        title: 'Waiter Claimed Table',
        description: `Waiter ${user.displayName || user.email} self-assigned Table ${table.number} duty.`
      });
    } catch (e) {
      console.error(e);
      toast.error('Failed to claim table.');
    }
  };

  const handleStartCleaning = async (tableId: string) => {
    if (!user?.tenantId) return;
    try {
      const tableRef = doc(db, 'restaurants', user.tenantId, 'tables', tableId);
      await updateDoc(tableRef, {
        cleaningStartedAt: new Date().toISOString()
      });
      toast.success('Cleaning started.');

      const tableObj = tables.find(t => t.id === tableId);
      logEvent(user.tenantId, {
        eventType: 'Cleaning Started',
        eventCategory: 'Cleaning',
        performedBy: user.displayName || user.email || 'Waiter',
        performedByRole: user.role || 'waiter',
        tableId,
        tableNumber: tableObj?.number,
        title: 'Table Cleaning Begun',
        description: `Cleaning loop activated for Table ${tableObj?.number || '—'}.`
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handleRequestBill = async (table: ITable) => {
    if (!user?.tenantId) return;
    try {
      const tableRef = doc(db, 'restaurants', user.tenantId, 'tables', table.id);
      await updateDoc(tableRef, {
        status: 'bill_requested',
        billRequestedAt: new Date().toISOString()
      });

      // Also update the active order with billRequestedAt timestamp
      if (table.activeOrderId) {
        const orderRef = doc(db, 'restaurants', user.tenantId, 'orders', table.activeOrderId);
        await updateDoc(orderRef, {
          billRequestedAt: new Date().toISOString(),
          paymentStatus: 'pending',
          updatedAt: new Date().toISOString()
        });
      }

      toast.success(`Bill requested for Table ${table.number}. Owner notified.`, { icon: '🧾' });

      logEvent(user.tenantId, {
        eventType: 'Bill Requested',
        eventCategory: 'Billing',
        performedBy: user.displayName || user.email || 'Waiter',
        performedByRole: user.role || 'waiter',
        tableId: table.id,
        tableNumber: table.number,
        orderId: table.activeOrderId,
        title: 'Bill Requested by Waiter',
        description: `Waiter ${user.displayName || 'on duty'} requested billing checkout for Table ${table.number}. Routed to Owner Billing Queue.`
      });
    } catch (e) {
      console.error(e);
      toast.error('Failed to request bill.');
    }
  };

  // Legacy: keep handleGenerateBill signature but now it routes to handleRequestBill
  const handleGenerateBill = (order: IOrder) => {
    const tableObj = tables.find(t => t.activeOrderId === order.orderId || t.number === order.tableNumber);
    if (tableObj) {
      handleRequestBill(tableObj);
    }
  };


  const handleCompleteCleaningCC = async (table: ITable) => {
    if (!user?.tenantId) return;
    try {
      const tableRef = doc(db, 'restaurants', user.tenantId, 'tables', table.id);
      
      let durationSecs = 0;
      if ((table as any).cleaningStartedAt) {
        durationSecs = Math.floor((Date.now() - new Date((table as any).cleaningStartedAt).getTime()) / 1000);
      }

      await updateDoc(tableRef, {
        status: 'empty',
        activeOrderId: '',
        currentOrderId: '',
        guestsCount: 0,
        cleaningStartedAt: '',
        tableNotes: '',
        cleaningDurationSeconds: durationSecs
      });

      setShift(prev => ({
        ...prev,
        stats: { ...prev.stats, cleaningCompleted: prev.stats.cleaningCompleted + 1 }
      }));

      toast.success(`Table ${table.number} cleared and sanitized. Status: Available.`);

      logEvent(user.tenantId, {
        eventType: 'Cleaning Completed',
        eventCategory: 'Cleaning',
        performedBy: user.displayName || user.email || 'Waiter',
        performedByRole: user.role || 'waiter',
        tableId: table.id,
        tableNumber: table.number,
        title: 'Table Resetted Vacant',
        description: `Sanitization complete. Table ${table.number} is now Available.`,
        metadata: { durationSecs }
      });
    } catch (e) {
      console.error(e);
    }
  };

  // Cart operations
  const addToCart = (item: IMenuItem) => {
    setCart(prev => {
      const current = prev[item.id] || { item, count: 0 };
      return {
        ...prev,
        [item.id]: { item, count: current.count + 1 }
      };
    });
  };

  const removeFromCart = (item: IMenuItem) => {
    setCart(prev => {
      const current = prev[item.id];
      if (!current) return prev;
      if (current.count <= 1) {
        const next = { ...prev };
        delete next[item.id];
        return next;
      }
      return {
        ...prev,
        [item.id]: { item, count: current.count - 1 }
      };
    });
  };

  const cartTotal = useMemo(() => {
    return Object.values(cart).reduce((sum, entry) => sum + (entry.item.price * entry.count), 0);
  }, [cart]);

  const handlePlaceQuickOrder = async () => {
    if (!user?.tenantId || !orderTable) return;
    try {
      const itemsList = Object.values(cart).map(entry => ({
        name: entry.item.name,
        count: entry.count,
        pricePerUnit: entry.item.price,
        notes: ''
      }));

      const newOrderData = {
        tenantId: user.tenantId,
        tableNumber: orderTable.number,
        status: 'NEW',
        items: itemsList,
        subtotal: cartTotal,
        discount: 0,
        tax: Math.round(cartTotal * 0.08),
        total: Math.round(cartTotal * 1.08),
        paymentStatus: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        customerName: customerName || 'Guest',
        customerPhone: customerPhone || '',
        waiterId: user.uid,
        waiterName: user.displayName || user.email || 'Waiter',
        timeline: [
          {
            type: 'NEW',
            title: 'Order Created',
            description: `Table-side order added by Waiter ${user.displayName || user.email}`,
            timestamp: new Date().toISOString(),
            performedBy: user.displayName || 'Waiter'
          }
        ]
      };

      const ordersCol = collection(db, 'restaurants', user.tenantId, 'orders');
      const orderDocRef = await addDoc(ordersCol, newOrderData);
      
      const orderId = orderDocRef.id;
      await updateDoc(orderDocRef, { orderId });

      const tableRef = doc(db, 'restaurants', user.tenantId, 'tables', orderTable.id);
      await updateDoc(tableRef, {
        status: 'occupied',
        activeOrderId: orderId,
        currentOrderId: orderId
      });

      toast.success('Table-side order submitted to Kitchen Display feed!');

      logEvent(user.tenantId, {
        eventType: 'Order Created',
        eventCategory: 'Operational',
        performedBy: user.displayName || user.email || 'Waiter',
        performedByRole: user.role || 'waiter',
        orderId,
        tableNumber: orderTable.number,
        title: 'Table-side Order Placed',
        description: `New order #${orderId.substring(0, 8)} placed. Total: ${formatPrice(newOrderData.total)}.`
      });

      setOrderTable(null);
      setCart({});
      setCustomerName('');
      setCustomerPhone('');
    } catch (e) {
      console.error(e);
      toast.error('Failed to submit order.');
    }
  };

  // ─── Task Timeline Actions Mapping ──────────────────────────────────────────

  const handleAcceptTask = async (task: IWaiterTask) => {
    if (!user?.tenantId) return;
    try {
      if (task.source === 'order') {
        const docRef = doc(db, 'restaurants', user.tenantId, 'orders', task.targetId);
        await updateDoc(docRef, {
          waiterId: user.uid,
          waiterName: user.displayName || user.email || 'Waiter',
          deliveryAcceptedAt: new Date().toISOString()
        });
      } else if (task.source === 'request') {
        const docRef = doc(db, 'restaurants', user.tenantId, 'waiterRequests', task.targetId);
        await updateDoc(docRef, {
          status: 'Accepted',
          acceptedAt: new Date().toISOString(),
          acceptedBy: user.displayName || user.email || 'Waiter'
        });
      } else if (task.source === 'managerReview') {
        const docRef = doc(db, 'restaurants', user.tenantId, 'managerReviews', task.targetId);
        await updateDoc(docRef, {
          resolutionStatus: 'In Progress',
          assignedManager: user.displayName || user.email || 'Manager'
        });
      }
      toast.success('Task claimed and added to your flow timeline.');

      logEvent(user.tenantId, {
        eventType: 'Task Assigned',
        eventCategory: 'Waiter',
        performedBy: user.displayName || user.email || 'Waiter',
        performedByRole: user.role || 'waiter',
        orderId: task.source === 'order' ? task.targetId : undefined,
        taskId: task.id,
        tableNumber: task.tableNumber,
        title: 'Task Claimed',
        description: `Waiter claimed task: ${task.type} for Table ${task.tableNumber}.`
      });
    } catch (e) {
      console.error('Accept task failed:', e);
    }
  };

  const handleResolveTask = async (task: IWaiterTask) => {
    if (!user?.tenantId) return;
    try {
      if (task.source === 'order') {
        const docRef = doc(db, 'restaurants', user.tenantId, 'orders', task.targetId);
        const orderObj = orders.find(o => o.orderId === task.targetId);
        const start = orderObj?.deliveryAcceptedAt || new Date().toISOString();
        const durationSecs = Math.floor((Date.now() - new Date(start).getTime()) / 1000);

        const timelineEvent: ITimelineEvent = {
          type: 'DELIVERED',
          title: 'Order Delivered',
          description: `Delivered by Waiter ${user.displayName || user.email}`,
          timestamp: new Date().toISOString(),
          performedBy: user.displayName || 'Waiter'
        };

        await updateDoc(docRef, {
          status: 'DELIVERED',
          deliveredAt: new Date().toISOString(),
          deliveryDurationSeconds: durationSecs,
          timeline: arrayUnion(timelineEvent)
        });

        setShift(prev => ({
          ...prev,
          stats: { ...prev.stats, ordersDelivered: prev.stats.ordersDelivered + 1 }
        }));

        toast.success(`Food delivered to Table ${task.tableNumber}!`);

        logEvent(user.tenantId, {
          eventType: 'Order Delivered',
          eventCategory: 'Waiter',
          performedBy: user.displayName || user.email || 'Waiter',
          performedByRole: user.role || 'waiter',
          orderId: task.targetId,
          tableNumber: task.tableNumber,
          title: 'Order Delivered',
          description: `Deliver completed for Table ${task.tableNumber} in ${durationSecs}s.`
        });
      } else if (task.source === 'request') {
        const docRef = doc(db, 'restaurants', user.tenantId, 'waiterRequests', task.targetId);
        await updateDoc(docRef, {
          status: 'Completed',
          resolvedAt: new Date().toISOString()
        });

        setShift(prev => ({
          ...prev,
          stats: { ...prev.stats, requestsResolved: prev.stats.requestsResolved + 1 }
        }));

        toast.success(`Request for Table ${task.tableNumber} completed.`);

        logEvent(user.tenantId, {
          eventType: 'Task Completed',
          eventCategory: 'Waiter',
          performedBy: user.displayName || user.email || 'Waiter',
          performedByRole: user.role || 'waiter',
          taskId: task.id,
          tableNumber: task.tableNumber,
          title: 'Customer Request Resolved',
          description: `Waiter completed diner alert helper request: ${task.type}.`
        });
      } else if (task.type === 'Generate Bill' || task.type === 'Bill Request') {
        const tableObj = tables.find(t => t.id === task.targetId);
        const activeOrder = orders.find(o => o.orderId === tableObj?.activeOrderId);
        if (activeOrder) {
          handleGenerateBill(activeOrder);
        }
      } else if (task.type === 'Clean Table' || task.type === 'Cleaning') {
        const tableObj = tables.find(t => t.id === task.targetId);
        if (tableObj) {
          handleCompleteCleaningCC(tableObj);
        }
      } else if (task.source === 'managerReview') {
        const docRef = doc(db, 'restaurants', user.tenantId, 'managerReviews', task.targetId);
        await updateDoc(docRef, {
          resolutionStatus: 'Resolved',
          resolvedAt: new Date().toISOString(),
          resolutionNotes: 'Escalation resolved by server.'
        });

        setShift(prev => ({
          ...prev,
          stats: { ...prev.stats, requestsResolved: prev.stats.requestsResolved + 1 }
        }));

        toast.success('Manager escalation review resolved successfully.');

        logEvent(user.tenantId, {
          eventType: 'Task Completed',
          eventCategory: 'Management',
          performedBy: user.displayName || user.email || 'Manager',
          performedByRole: user.role || 'manager',
          taskId: task.id,
          tableNumber: task.tableNumber,
          title: 'Escalation Resolved',
          description: `Manager resolved escalation review for Table ${task.tableNumber}.`
        });
      }
    } catch (e) {
      console.error('Resolve task failed:', e);
    }
  };

  const handleMarkPaidCC = async () => {
    if (!user?.tenantId || !selectedOrder) return;
    setShowFeedbackModal(true);
  };

  // Submit Feedback & Finalize checkout
  const handleSubmitFeedback = async () => {
    if (!user?.tenantId || !selectedOrder) return;
    setIsUpdatingBill(true);
    try {
      const docRef = doc(db, 'restaurants', user.tenantId, 'orders', selectedOrder.orderId);
      
      const subtotal = selectedOrder.subtotal;
      const discount = Math.round(subtotal * (discountPercent / 100));
      const newTax = Math.round((subtotal - discount) * 0.08);
      const newTotal = (subtotal - discount) + newTax;

      // 1. Save satisfaction Rating record
      const isPositive = feedbackRating === 'Excellent' || feedbackRating === 'Good';
      const isComplaint = feedbackRating === 'Needs Attention' || feedbackRating === 'Complaint';

      const satisfactionData: ISatisfactionRating = {
        rating: feedbackRating,
        serviceSpeed,
        foodQuality,
        cleanliness,
        staffBehavior,
        waitingTime,
        ambience,
        customerType,
        visitOccasion,
        notes: feedbackNotes,
        submittedBy: user.uid,
        submittedByName: user.displayName || user.email || 'Waiter',
        submittedAt: new Date().toISOString(),
        orderId: selectedOrder.orderId,
        tableNumber: selectedOrder.tableNumber,
        tenantId: user.tenantId,
        isPositive,
        isComplaint,
        repeatCustomer: isRepeatCustomer
      };

      const satisfactionCol = collection(db, 'restaurants', user.tenantId, 'satisfactionRatings');
      const ratingDocRef = await addDoc(satisfactionCol, satisfactionData);

      // 2. Automated Manager Review Task if rating is Needs Attention or Complaint
      if (isComplaint) {
        const managerTaskData = {
          tenantId: user.tenantId,
          customerIssue: `Diner rating: ${feedbackRating}. Notes: ${feedbackNotes || 'None'}`,
          priority: feedbackRating === 'Complaint' ? 'Critical' : 'High',
          assignedManager: 'Pending',
          resolutionStatus: 'Pending',
          resolutionNotes: '',
          ratingId: ratingDocRef.id,
          submittedAt: new Date().toISOString(),
          orderId: selectedOrder.orderId,
          tableNumber: selectedOrder.tableNumber
        };
        const mReviewsCol = collection(db, 'restaurants', user.tenantId, 'managerReviews');
        await addDoc(mReviewsCol, managerTaskData);

        // Log manager task event
        logEvent(user.tenantId, {
          eventType: 'Task Assigned',
          eventCategory: 'Management',
          performedBy: 'System Engine',
          performedByRole: 'system',
          orderId: selectedOrder.orderId,
          tableNumber: selectedOrder.tableNumber,
          title: 'Manager Escalation Created',
          description: `Automatic recovery review flagged for Table ${selectedOrder.tableNumber} due to complaint.`
        });
      }

      // 3. Complete the Order Checkout in Firestore
      const timelineEvent: ITimelineEvent = {
        type: 'COMPLETED',
        title: 'Bill Paid',
        description: `Bill paid. Total: ${formatPrice(newTotal)} with ${discountPercent}% discount. Satisfaction rating: ${feedbackRating}`,
        timestamp: new Date().toISOString(),
        performedBy: user.displayName || 'Waiter'
      };

      await updateDoc(docRef, { 
        paymentStatus: 'paid',
        status: 'COMPLETED',
        subtotal,
        discount,
        tax: newTax,
        total: newTotal,
        timeline: arrayUnion(timelineEvent)
      });

      // 4. Mark table as dirty (awaiting cleaning)
      const table = tables.find(t => t.number === selectedOrder.tableNumber);
      if (table) {
        const tableRef = doc(db, 'restaurants', user.tenantId, 'tables', table.id);
        await updateDoc(tableRef, { 
          status: 'cleaning',
          cleaningStartedAt: new Date().toISOString()
        });
      }

      setShift(prev => ({
        ...prev,
        stats: { ...prev.stats, billsGenerated: prev.stats.billsGenerated + 1 }
      }));

      // Log checkout event
      logEvent(user.tenantId, {
        eventType: 'Payment Completed',
        eventCategory: 'Payment',
        performedBy: user.displayName || user.email || 'Waiter',
        performedByRole: user.role || 'waiter',
        orderId: selectedOrder.orderId,
        tableNumber: selectedOrder.tableNumber,
        title: 'Order Finalized & Paid',
        description: `Total payment of ${formatPrice(newTotal)} cleared. Table ${selectedOrder.tableNumber} moved to cleaning.`
      });

      // Log satisfaction event
      logEvent(user.tenantId, {
        eventType: 'Customer Satisfaction Submitted',
        eventCategory: 'Customer',
        performedBy: user.displayName || user.email || 'Waiter',
        performedByRole: user.role || 'waiter',
        orderId: selectedOrder.orderId,
        tableNumber: selectedOrder.tableNumber,
        title: 'Experience Rating Submitted',
        description: `Table ${selectedOrder.tableNumber} checked out. Rating: ${feedbackRating}.`
      });

      toast.success(`Table ${selectedOrder.tableNumber} bill closed. Customer feedback registered.`);
      setSelectedOrder(null);
      setShowFeedbackModal(false);
      setFeedbackNotes('');
      setIsRepeatCustomer(false);
      setFeedbackRating('Excellent');
      setFoodQuality(5);
      setServiceSpeed(5);
      setCleanliness(5);
      setStaffBehavior(5);
      setWaitingTime(5);
      setAmbience(5);
    } catch (e) {
      console.error(e);
      toast.error('Failed to log satisfaction rating & payment.');
    } finally {
      setIsUpdatingBill(false);
    }
  };

  // ─── Table Allocation Manager Console Operations ────────────────────────────

  const handleUpdateTableWaiter = async (tableId: string, waiterId: string) => {
    if (!user?.tenantId) return;
    try {
      const selectedWaiter = employees.find(e => e.id === waiterId);
      const wName = selectedWaiter ? (selectedWaiter.displayName || selectedWaiter.email) : '';

      const tableDocRef = doc(db, 'restaurants', user.tenantId, 'tables', tableId);
      await updateDoc(tableDocRef, {
        assignedWaiterId: waiterId,
        assignedWaiterName: wName
      });
      toast.success('Floor waiter assignment updated.');

      logEvent(user.tenantId, {
        eventType: 'Task Assigned',
        eventCategory: 'Management',
        performedBy: user.displayName || user.email || 'Manager',
        performedByRole: user.role || 'manager',
        tableId,
        title: 'Table Assigned',
        description: `Manager assigned Table ${tables.find(t => t.id === tableId)?.number} to server ${wName}.`
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handleAssignBulkSection = async () => {
    if (!user?.tenantId || !bulkSectionWaiterId) {
      toast.error('Please choose a waiter.');
      return;
    }
    try {
      const selectedWaiter = employees.find(e => e.id === bulkSectionWaiterId);
      const wName = selectedWaiter ? (selectedWaiter.displayName || selectedWaiter.email) : '';

      const batch = writeBatch(db);
      tables.forEach(table => {
        if (table.section === bulkSection) {
          const docRef = doc(db, 'restaurants', user.tenantId, 'tables', table.id);
          batch.update(docRef, {
            assignedWaiterId: bulkSectionWaiterId,
            assignedWaiterName: wName
          });
        }
      });
      await batch.commit();
      toast.success(`Assigned all tables in ${bulkSection} to ${wName}.`);

      logEvent(user.tenantId, {
        eventType: 'Task Assigned',
        eventCategory: 'Management',
        performedBy: user.displayName || user.email || 'Manager',
        performedByRole: user.role || 'manager',
        title: 'Bulk Section Assigned',
        description: `Manager bulk-assigned section ${bulkSection} to waiter ${wName}.`
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handleTriggerAutoAssign = async () => {
    if (!user?.tenantId) return;
    const activeWaiters = employees.filter(e => e.role === 'waiter' && e.status === 'active');
    if (activeWaiters.length === 0) {
      toast.error('No active waiters on shift to assign.');
      return;
    }

    try {
      const batch = writeBatch(db);

      if (autoAssignStrategy === 'round-robin') {
        tables.forEach((table, index) => {
          const waiter = activeWaiters[index % activeWaiters.length];
          const wName = waiter.displayName || waiter.email || 'Waiter';
          const docRef = doc(db, 'restaurants', user.tenantId, 'tables', table.id);
          batch.update(docRef, {
            assignedWaiterId: waiter.id,
            assignedWaiterName: wName
          });
        });
        await batch.commit();
        toast.success('Round Robin waiter load balancing applied.');

        logEvent(user.tenantId, {
          eventType: 'Task Assigned',
          eventCategory: 'Management',
          performedBy: user.displayName || user.email || 'Manager',
          performedByRole: user.role || 'manager',
          title: 'Auto-Assign Completed',
          description: `Applied Round Robin auto load-balancing to all active floor tables.`
        });
      } else {
        // Least loaded algorithm
        const loads: Record<string, number> = {};
        activeWaiters.forEach(w => { loads[w.id] = 0; });

        tables.forEach(table => {
          let minId = activeWaiters[0].id;
          let minVal = loads[minId];
          
          activeWaiters.forEach(w => {
            if (loads[w.id] < minVal) {
              minId = w.id;
              minVal = loads[w.id];
            }
          });

          const waiter = activeWaiters.find(w => w.id === minId);
          const wName = waiter.displayName || waiter.email || 'Waiter';
          const docRef = doc(db, 'restaurants', user.tenantId, 'tables', table.id);
          batch.update(docRef, {
            assignedWaiterId: minId,
            assignedWaiterName: wName
          });

          loads[minId] += 1;
        });

        await batch.commit();
        toast.success('Least Loaded waiter load balancing applied.');

        logEvent(user.tenantId, {
          eventType: 'Task Assigned',
          eventCategory: 'Management',
          performedBy: user.displayName || user.email || 'Manager',
          performedByRole: user.role || 'manager',
          title: 'Auto-Assign Completed',
          description: `Applied Least Loaded workload optimization to all active floor tables.`
        });
      }
    } catch (e) {
      console.error(e);
      toast.error('Failed to trigger auto assignment.');
    }
  };

  // ─── Render Handovers Claim Alert Overlay ──────────────────────────────────
  const renderIncomingHandoversAlert = () => {
    if (incomingHandovers.length === 0) return null;
    return (
      <div className="space-y-2">
        {incomingHandovers.map(handover => (
          <div
            key={handover.id}
            className="p-4 border border-blue-500/30 bg-blue-950/15 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-left"
          >
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-extrabold tracking-wider text-blue-455 flex items-center gap-1.5">
                <ArrowRightLeft className="w-4 h-4 text-blue-450 animate-pulse" />
                <span>Shift Handover Request</span>
              </span>
              <p className="text-xs text-slate-300 font-semibold">
                <strong>{handover.handoverByName}</strong> wants to transfer <strong>{handover.tablesCount} tables</strong> and <strong>{handover.ordersCount} ready orders</strong> to you.
              </p>
              {handover.handoverReason && (
                <p className="text-[10px] text-slate-500 italic">Reason: "{handover.handoverReason}"</p>
              )}
            </div>

            <div className="flex gap-2 self-start sm:self-center">
              <button
                onClick={() => handleRejectHandover(handover)}
                className="px-3 py-1.5 border border-slate-800 bg-slate-900 hover:text-red-400 text-xs font-bold rounded-xl transition-all"
              >
                Reject
              </button>
              <button
                onClick={() => handleAcceptHandover(handover)}
                className="px-4 py-1.5 bg-blue-500 text-slate-950 hover:bg-blue-600 text-xs font-extrabold rounded-xl transition-all flex items-center space-x-1"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Accept Handover</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6 text-left select-none pb-24">
      {/* Shift control center header card */}
      {renderShiftControlCard()}

      {/* Render incoming handovers alert overlay */}
      {renderIncomingHandoversAlert()}

      {shift.isActive ? (
        <div className="space-y-6">
          {/* Command center metric widgets */}
          {renderCommandHeaderMetrics()}

          {/* Master View tab selectors */}
          <div className="flex items-center space-x-2 p-1 bg-slate-900/30 border border-slate-850 rounded-2xl w-fit flex-wrap gap-y-1">
            {[
              { id: 'command_center', label: 'Command Queue', Icon: ListTodo },
              { id: 'floor_map', label: 'Floor Matrix Seating', Icon: LayoutGrid },
              { id: 'cleaning', label: 'Sanitizing Duties', count: tables.filter(t => t.status === 'cleaning' && t.assignedWaiterId === user?.uid).length },
              { id: 'stats', label: 'Performance Summary', Icon: Award },
              { id: 'live_feed', label: 'Operations Event Feed', Icon: Activity },
              ...(isManagerOrOwner ? [{ id: 'manager_console', label: 'Manager Allocation Console', Icon: Users }] : [])
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-extrabold transition-all border outline-none ${
                  activeTab === tab.id
                    ? 'bg-primary/10 border-primary/20 text-primary'
                    : 'text-slate-400 border-transparent hover:text-textPearl hover:bg-slate-900/40'
                }`}
              >
                {/* @ts-ignore */}
                {tab.Icon && <tab.Icon className="w-3.5 h-3.5" />}
                <span>{tab.label}</span>
                {/* @ts-ignore */}
                {tab.count !== undefined && tab.count > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-slate-950 text-slate-450 text-[9px] font-bold">
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* ───────────────── COMMAND CENTER QUEUE VIEW ───────────────── */}
          {activeTab === 'command_center' && (
            <div className="flex flex-col lg:flex-row gap-5">
              <div className="flex-1 space-y-4">
                {renderNextBestActionHero()}
                {renderUnifiedTaskQueue()}
              </div>

              <div className="lg:w-72 shrink-0">
                {renderLiveActivityFeed()}
              </div>
            </div>
          )}

          {/* ───────────────── FLOOR MAP MATRIX VIEW ───────────────── */}
          {activeTab === 'floor_map' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {tables.map(table => {
                  const assignedToMe = table.assignedWaiterId === user?.uid;
                  const isOccupied = table.status === 'occupied' || table.status === 'service_requested' || table.status === 'bill_requested';
                  const isCleaning = table.status === 'cleaning';
                  
                  return (
                    <Card
                      key={table.id}
                      className={`p-4 border bg-slate-900/40 rounded-2xl text-left flex flex-col justify-between h-40 hover:border-slate-750 transition-all ${
                        assignedToMe 
                          ? 'border-primary/45 bg-primary/5 ring-1 ring-primary/10' 
                          : 'border-slate-850'
                      }`}
                    >
                      <div>
                        <div className="flex justify-between items-start">
                          <span className="text-sm font-display font-extrabold text-textPearl">Table {table.number}</span>
                          <span className={`w-2 h-2 rounded-full ${
                            table.status === 'empty' ? 'bg-emerald-500' :
                            isCleaning ? 'bg-amber-500 animate-pulse' :
                            'bg-primary'
                          }`} />
                        </div>
                        
                        <div className="text-[10px] text-slate-500 font-semibold mt-1">
                          Cap: {table.seatingCapacity} · {table.section || 'Main Room'}
                        </div>
                        
                        {table.tableNotes && (
                          <div className="text-[9px] text-amber-400 mt-1 truncate">
                            ⚠️ {table.tableNotes}
                          </div>
                        )}

                        <div className="text-[10px] mt-2 text-slate-455 truncate font-semibold">
                          {isOccupied ? `Diners: ${table.guestsCount || 2}` : 'Available'}
                        </div>
                        <div className="text-[9px] text-slate-600 truncate">
                          {table.assignedWaiterName ? `Waiter: ${table.assignedWaiterName}` : 'Unassigned'}
                        </div>
                      </div>

                      <div className="flex gap-1 pt-2 border-t border-slate-850/60 mt-2">
                        {!isOccupied && !isCleaning ? (
                          <button
                            onClick={() => { setSelectedTable(table); setGuestsCount(2); setTableSectionInput(table.section || 'Main Room'); }}
                            className="w-full text-center py-1 bg-primary/15 hover:bg-primary/25 border border-primary/20 text-primary text-[9px] font-extrabold rounded-lg uppercase tracking-wider"
                          >
                            Check-In
                          </button>
                        ) : !assignedToMe && !isCleaning ? (
                          <button
                            onClick={() => handleSelfAssignTable(table)}
                            className="w-full text-center py-1 bg-slate-950 border border-slate-850 text-slate-350 text-[9px] font-extrabold rounded-lg uppercase tracking-wider"
                          >
                            Claim table
                          </button>
                        ) : isOccupied && assignedToMe ? (
                          <div className="flex gap-1 w-full">
                            {table.status !== 'bill_requested' ? (
                              <>
                                <button
                                  onClick={() => setOrderTable(table)}
                                  className="flex-1 text-center py-1 bg-primary/15 border border-primary/30 text-primary text-[9px] font-extrabold rounded-lg uppercase"
                                >
                                  + Order
                                </button>
                                <button
                                  onClick={() => handleRequestBill(table)}
                                  className="flex-1 text-center py-1 bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-[9px] font-extrabold rounded-lg uppercase"
                                  title="Request Bill — routes to Owner Billing"
                                >
                                  🧾 Bill
                                </button>
                              </>
                            ) : (
                              <span className="text-[8px] text-amber-400 uppercase tracking-widest font-extrabold w-full text-center py-1 truncate animate-pulse">
                                ⏳ Billing...
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-[8px] text-slate-550 uppercase tracking-widest font-extrabold w-full text-center py-1 truncate">
                            {table.status}
                          </span>
                        )}

                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {/* ───────────────── TABLE CLEANING RESETS TAB ───────────────── */}
          {activeTab === 'cleaning' && (
            <div className="space-y-4">
              <h2 className="text-sm font-display font-extrabold text-textPearl">Sanitizing floor cleanups</h2>
              {tables.filter(t => t.status === 'cleaning' && t.assignedWaiterId === user?.uid).length === 0 ? (
                <div className="py-12 text-center border border-dashed border-slate-850 rounded-2xl bg-slate-900/10">
                  <CheckCircle className="w-10 h-10 text-slate-750 mx-auto mb-2" />
                  <p className="text-sm text-slate-500 font-semibold">Zero dirty tables waiting for resets.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {tables.filter(t => t.status === 'cleaning' && t.assignedWaiterId === user?.uid).map(table => {
                    const started = !!(table as any).cleaningStartedAt;
                    return (
                      <Card
                        key={table.id}
                        className="p-4 border border-amber-500/20 bg-amber-950/5 rounded-2xl flex flex-col justify-between hover:border-amber-500/30 transition-all text-left"
                      >
                        <div className="space-y-2">
                          <div className="flex justify-between items-start">
                            <span className="text-sm font-display font-extrabold text-textPearl">Table {table.number}</span>
                            <Badge variant="warning">{started ? 'Cleaning In Progress' : 'Dirty'}</Badge>
                          </div>
                          <p className="text-xs text-slate-400">
                            {started ? 'Sanitizing table surfaces. Awaiting final reset.' : 'Awaiting floor reset to available.'}
                          </p>
                        </div>

                        <div className="flex gap-2 pt-3 border-t border-slate-850/60 mt-3">
                          {!started ? (
                            <button
                              onClick={() => handleStartCleaning(table.id)}
                              className="w-full py-2 bg-amber-500 text-slate-950 text-xs font-extrabold rounded-xl uppercase tracking-wider"
                            >
                              Start Cleaning
                            </button>
                          ) : (
                            <button
                              onClick={() => handleCompleteCleaningCC(table)}
                              className="w-full py-2 bg-emerald-500 text-slate-950 text-xs font-extrabold rounded-xl uppercase tracking-wider"
                            >
                              Mark Reset (Available)
                            </button>
                          )}
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ───────────────── PERFORMANCE ANALYTICS TAB ───────────────── */}
          {activeTab === 'stats' && (
            <div className="bg-slate-900/40 border border-slate-850 rounded-2xl p-6 text-left space-y-6">
              <div>
                <h2 className="text-base font-display font-extrabold text-textPearl flex items-center space-x-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  <span>Personal Shift Performance Card</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">Summary of stats collected dynamically for the current shift period.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-slate-950/40 border border-slate-850 rounded-xl p-4 flex flex-col justify-between">
                  <span className="text-[10px] uppercase font-bold text-slate-550 tracking-wider">Shift State</span>
                  <span className="text-2xl font-display font-extrabold text-primary mt-2 uppercase">{shift.status}</span>
                  <p className="text-[9.5px] text-slate-600 mt-1">Status code metrics</p>
                </div>

                <div className="bg-slate-950/40 border border-slate-850 rounded-xl p-4 flex flex-col justify-between">
                  <span className="text-[10px] uppercase font-bold text-slate-550 tracking-wider">Orders Delivered</span>
                  <span className="text-3xl font-display font-extrabold text-textPearl mt-2 font-mono">{shift.stats.ordersDelivered}</span>
                  <p className="text-[9.5px] text-slate-600 mt-1">Serves made during this shift</p>
                </div>

                <div className="bg-slate-950/40 border border-slate-850 rounded-xl p-4 flex flex-col justify-between">
                  <span className="text-[10px] uppercase font-bold text-slate-550 tracking-wider">Avg Delivery Speed</span>
                  <span className="text-3xl font-display font-extrabold text-emerald-400 mt-2 font-mono">
                    {performanceStats.avgDeliveryMinutes}m
                  </span>
                  <p className="text-[9.5px] text-slate-655 mt-1">Ready → Delivered response speed</p>
                </div>

                <div className="bg-slate-950/40 border border-slate-850 rounded-xl p-4 flex flex-col justify-between">
                  <span className="text-[10px] uppercase font-bold text-slate-550 tracking-wider">Resets Completed</span>
                  <span className="text-3xl font-display font-extrabold text-primary mt-2 font-mono">{shift.stats.cleaningCompleted}</span>
                  <p className="text-[9.5px] text-slate-600 mt-1">Dirty tables reset to vacant available</p>
                </div>
              </div>
            </div>
          )}

          {/* ───────────────── LIVE OPERATIONS FEED TAB ───────────────── */}
          {activeTab === 'live_feed' && (
            <ActivityFeed maxEvents={100} />
          )}

          {/* ───────────────── MANAGER ALLOCATION CONSOLE ───────────────── */}
          {activeTab === 'manager_console' && isManagerOrOwner && (
            <div className="bg-slate-900/40 border border-slate-850 rounded-2xl p-6 text-left space-y-6">
              <div>
                <h2 className="text-base font-display font-extrabold text-textPearl flex items-center space-x-2">
                  <Users className="w-5 h-5 text-primary" />
                  <span>Table Assignment & Load Balancing Cockpit</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">Control waiter floor distribution, manage section assignments, or trigger automatic load balancing.</p>
              </div>

              {/* Auto Load Balancing */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-b border-slate-850 pb-6">
                <Card className="p-5 border-slate-800 bg-slate-950/20 space-y-4">
                  <h3 className="text-xs font-extrabold text-textPearl uppercase tracking-wider flex items-center space-x-2">
                    <TrendingUp className="w-4 h-4 text-primary" />
                    <span>Auto-Assignment Algorithms</span>
                  </h3>
                  <div className="flex items-center space-x-3">
                    <label className="text-xs text-slate-400 font-bold">Strategy:</label>
                    <select
                      value={autoAssignStrategy}
                      onChange={e => setAutoAssignStrategy(e.target.value as any)}
                      className="text-xs bg-slate-900 border border-slate-800 rounded-lg p-2 text-slate-350 outline-none"
                    >
                      <option value="round-robin">Round Robin (Sequential distribution)</option>
                      <option value="least-loaded">Least Loaded (Fill least active waiter first)</option>
                    </select>
                  </div>
                  <button
                    onClick={handleTriggerAutoAssign}
                    className="w-full py-2.5 bg-primary text-slate-950 hover:bg-primary-hover text-xs font-extrabold rounded-xl uppercase tracking-wider flex items-center justify-center space-x-2"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>Distribute Tables Automatically</span>
                  </button>
                </Card>

                {/* Bulk Section Assignment */}
                <Card className="p-5 border-slate-800 bg-slate-950/20 space-y-4">
                  <h3 className="text-xs font-extrabold text-textPearl uppercase tracking-wider flex items-center space-x-2">
                    <MapPin className="w-4 h-4 text-primary" />
                    <span>Assign Entire Floor Section</span>
                  </h3>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="space-y-1">
                      <label className="text-slate-500 font-bold">Select Section</label>
                      <select
                        value={bulkSection}
                        onChange={e => setBulkSection(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-slate-300 outline-none"
                      >
                        <option value="Main Room">Main Room</option>
                        <option value="Patio">Patio</option>
                        <option value="Bar">Bar</option>
                        <option value="VIP Lounge">VIP Lounge</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-slate-500 font-bold">Assign To Waiter</label>
                      <select
                        value={bulkSectionWaiterId}
                        onChange={e => setBulkSectionWaiterId(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-slate-350 outline-none"
                      >
                        <option value="">Choose waiter...</option>
                        {employees.filter(e => e.role === 'waiter').map(emp => (
                          <option key={emp.id} value={emp.id}>{emp.displayName || emp.email}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <button
                    onClick={handleAssignBulkSection}
                    className="w-full py-2.5 bg-indigo-500 text-slate-950 hover:bg-indigo-650 text-xs font-extrabold rounded-xl uppercase tracking-wider flex items-center justify-center space-x-1"
                  >
                    <span>Apply Section Assignment</span>
                  </button>
                </Card>
              </div>

              {/* Table Allocator Matrix list */}
              <div className="space-y-3">
                <h3 className="text-xs font-extrabold text-textPearl uppercase tracking-wider">Manual Dining Tables Assignment Grid</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {tables.map(table => (
                    <Card key={table.id} className="p-4 border-slate-850 bg-slate-950/20 text-xs space-y-3 text-left">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-textPearl">Table {table.number} ({table.section || 'Main Room'})</span>
                        <Badge variant={table.status === 'empty' ? 'success' : 'warning'}>{table.status}</Badge>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-500 font-bold">Assign Server:</label>
                        <select
                          value={table.assignedWaiterId || ''}
                          onChange={e => handleUpdateTableWaiter(table.id, e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg p-1.5 text-slate-355 outline-none"
                        >
                          <option value="">No waiter assigned</option>
                          {employees.filter(e => e.role === 'waiter').map(emp => (
                            <option key={emp.id} value={emp.id}>{emp.displayName || emp.email}</option>
                          ))}
                        </select>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          )}

        </div>
      ) : (
        <Card className="p-8 text-center border-slate-850 bg-slate-900/10 rounded-3xl space-y-4">
          <Award className="w-12 h-12 text-slate-700 mx-auto" />
          <div>
            <h2 className="text-base font-extrabold text-textPearl">Shift System Offline</h2>
            <p className="text-xs text-slate-500 mt-1">Please start your operational shift above to sync tables and operational tasks feed.</p>
          </div>
        </Card>
      )}

      {/* ─── Seating Guest Check-In Modal ─── */}
      <Modal
        isOpen={selectedTable !== null}
        onClose={() => setSelectedTable(null)}
        title={selectedTable ? `Seating Setup — Table ${selectedTable.number}` : ''}
      >
        {selectedTable && (
          <div className="space-y-4 text-left">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400">Number of Guests</label>
              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={() => setGuestsCount(c => Math.max(1, c - 1))}
                  className="w-10 h-10 border border-slate-800 bg-slate-950 hover:bg-slate-900 rounded-xl text-lg font-bold flex items-center justify-center font-mono text-slate-200"
                >
                  -
                </button>
                <span className="text-xl font-bold font-mono px-4">{guestsCount}</span>
                <button
                  type="button"
                  onClick={() => setGuestsCount(c => Math.min(selectedTable.seatingCapacity + 4, c + 1))}
                  className="w-10 h-10 border border-slate-800 bg-slate-950 hover:bg-slate-900 rounded-xl text-lg font-bold flex items-center justify-center font-mono text-slate-205"
                >
                  +
                </button>
              </div>
              <p className="text-[10px] text-slate-500 mt-1">Table capacity is {selectedTable.seatingCapacity} guests.</p>
            </div>

            <div className="space-y-2">
              <Input
                label="Floor Section"
                value={tableSectionInput}
                onChange={e => setTableSectionInput(e.target.value)}
                placeholder="Main Room / Patio / Bar"
              />
            </div>

            <div className="space-y-2">
              <Input
                label="Special Seating Notes (VIP, Allergy, Kids)"
                value={tableNotesInput}
                onChange={e => setTableNotesInput(e.target.value)}
                placeholder="Allergy to nuts, VIP guest, Wheelchair space needed"
              />
            </div>

            <div className="flex gap-3 pt-3">
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => setSelectedTable(null)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-primary text-slate-950"
                onClick={handleOccupyTableCC}
              >
                Seat & Seize Table
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* ─── Add Quick Order Modal ─── */}
      <Modal
        isOpen={orderTable !== null}
        onClose={() => setOrderTable(null)}
        title={orderTable ? `Add Order — Table ${orderTable.number}` : ''}
      >
        {orderTable && (
          <div className="space-y-4 text-left max-h-[85vh] overflow-y-auto pr-1">
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Customer Name"
                value={customerName}
                onChange={e => setCustomerName(e.target.value)}
                placeholder="Ravi Kumar"
              />
              <Input
                label="Phone (optional)"
                value={customerPhone}
                onChange={e => setCustomerPhone(e.target.value)}
                placeholder="9876543210"
              />
            </div>

            <div className="space-y-2">
              <span className="text-[10px] uppercase font-extrabold text-slate-500 tracking-wider">Select Menu Items</span>
              <div className="max-h-48 overflow-y-auto border border-slate-850 rounded-xl bg-slate-950/20 divide-y divide-slate-850 p-2 space-y-1">
                {menuItems.map(item => {
                  const inCartCount = cart[item.id]?.count || 0;
                  return (
                    <div key={item.id} className="flex justify-between items-center py-2 px-1 text-xs">
                      <div>
                        <div className="font-bold text-textPearl">{item.name}</div>
                        <div className="text-[10px] text-slate-500">{formatPrice(item.price)} · {item.category}</div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {inCartCount > 0 && (
                          <>
                            <button
                              type="button"
                              onClick={() => removeFromCart(item)}
                              className="p-1.5 bg-slate-900 border border-slate-800 text-slate-400 rounded-lg font-bold"
                            >
                              -
                            </button>
                            <span className="font-bold font-mono text-sm min-w-[16px] text-center">{inCartCount}</span>
                          </>
                        )}
                        <button
                          type="button"
                          onClick={() => addToCart(item)}
                          className="p-1.5 bg-primary/10 border border-primary/20 text-primary rounded-lg font-bold"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {Object.keys(cart).length > 0 && (
              <div className="bg-slate-950/40 border border-slate-850 p-4 rounded-xl space-y-2 text-xs">
                <span className="text-[10px] uppercase font-bold text-slate-550 tracking-wider">Selected Cart Summary</span>
                <div className="space-y-1">
                  {Object.values(cart).map(entry => (
                    <div key={entry.item.id} className="flex justify-between text-slate-400">
                      <span>{entry.item.name} ×{entry.count}</span>
                      <span>{formatPrice(entry.item.price * entry.count)}</span>
                    </div>
                  ))}
                </div>
                <div className="pt-2 border-t border-slate-800/20 flex justify-between font-bold text-textPearl">
                  <span>Subtotal</span>
                  <span>{formatPrice(cartTotal)}</span>
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-3">
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => { setOrderTable(null); setCart({}); }}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-primary text-slate-950"
                onClick={handlePlaceQuickOrder}
                disabled={Object.keys(cart).length === 0}
              >
                Submit Order
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* ─── Bill Invoice Checkout Modal ─── */}
      <Modal
        isOpen={selectedOrder !== null}
        onClose={() => {
          setSelectedOrder(null);
          setDiscountPercent(0);
        }}
        title={`Bill Summary - Table ${selectedOrder?.tableNumber}`}
      >
        {selectedOrder && (
          <div className="space-y-4 text-left">
            <div className="space-y-2">
              <span className="text-[10px] uppercase font-bold text-slate-450 tracking-wider">Ordered Items</span>
              <div className="text-xs divide-y divide-slate-855">
                {selectedOrder.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between py-2 text-slate-350">
                    <span>{item.name} x{item.count}</span>
                    <span>{formatPrice(item.pricePerUnit * item.count)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Calculations detail */}
            <div className="bg-slate-950/40 border border-slate-850 p-4 rounded-xl space-y-2 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Subtotal</span>
                <span>{formatPrice(selectedOrder.subtotal)}</span>
              </div>
              <div className="flex justify-between text-textPearl font-semibold text-sm pt-2 border-t border-slate-800/20">
                <span>Total Amount (Estimated)</span>
                <span>{formatPrice(selectedOrder.total || selectedOrder.subtotal)}</span>
              </div>
            </div>

            <div className="flex items-center space-x-3 pt-2">
              <Button
                type="button"
                variant="secondary"
                className="flex-1"
                onClick={() => setSelectedOrder(null)}
                disabled={isUpdatingBill}
              >
                Cancel
              </Button>
              {(() => {
                const isRequested = tables.find(t => t.number === selectedOrder.tableNumber)?.status === 'bill_requested';
                return (
                  <Button
                    type="button"
                    className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-slate-950 flex items-center justify-center space-x-1.5"
                    onClick={async () => {
                      const tObj = tables.find(t => t.number === selectedOrder.tableNumber);
                      if (tObj) {
                        await handleRequestBill(tObj);
                        setSelectedOrder(null);
                      }
                    }}
                    disabled={isRequested}
                  >
                    <DollarSign className="w-4 h-4" />
                    <span>{isRequested ? 'Bill Requested' : 'Request Bill from Owner'}</span>
                  </Button>
                );
              })()}
            </div>
          </div>
        )}

      </Modal>

      {/* ─── Diner Satisfaction Rating Modal (Upgraded Customer Experience) ─── */}
      <Modal
        isOpen={showFeedbackModal}
        onClose={() => setShowFeedbackModal(false)}
        title="Diner Seating Experience Review"
      >
        <div className="space-y-4 text-left max-h-[80vh] overflow-y-auto pr-1">
          <div className="space-y-2">
            <span className="text-xs text-slate-450 font-bold">How was the customer experience?</span>
            <div className="grid grid-cols-5 gap-2">
              {[
                { rating: 'Excellent', label: '😊 Excellent', color: 'border-emerald-500 text-emerald-400' },
                { rating: 'Good', label: '🙂 Good', color: 'border-blue-500 text-blue-450' },
                { rating: 'Neutral', label: '😐 Neutral', color: 'border-yellow-500 text-yellow-450' },
                { rating: 'Needs Attention', label: '☹ Warning', color: 'border-orange-500 text-orange-450' },
                { rating: 'Complaint', label: '😡 Complaint', color: 'border-red-500 text-red-500 animate-pulse' }
              ].map(opt => (
                <button
                  key={opt.rating}
                  type="button"
                  onClick={() => setFeedbackRating(opt.rating as any)}
                  className={`py-2 px-1 text-[10px] font-bold rounded-xl border transition-all text-center ${
                    feedbackRating === opt.rating
                      ? `${opt.color} bg-slate-950`
                      : 'border-slate-800 text-slate-400 hover:text-textPearl bg-slate-900/10'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Optional Expanded Structured Feedback Metrics */}
          <div className="pt-2 border-t border-slate-850/60 space-y-3">
            <span className="text-[10px] text-slate-500 font-extrabold uppercase">Detailed Criteria Metrics (optional)</span>
            
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="space-y-1">
                <label className="text-[10px] text-slate-400">Food Quality (1-5)</label>
                <input
                  type="number"
                  min="1"
                  max="5"
                  value={foodQuality}
                  onChange={e => setFoodQuality(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-850 rounded-lg p-2 text-slate-350 outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-400">Service Speed (1-5)</label>
                <input
                  type="number"
                  min="1"
                  max="5"
                  value={serviceSpeed}
                  onChange={e => setServiceSpeed(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-850 rounded-lg p-2 text-slate-350 outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-400">Cleanliness (1-5)</label>
                <input
                  type="number"
                  min="1"
                  max="5"
                  value={cleanliness}
                  onChange={e => setCleanliness(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-850 rounded-lg p-2 text-slate-350 outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-400">Staff Behavior (1-5)</label>
                <input
                  type="number"
                  min="1"
                  max="5"
                  value={staffBehavior}
                  onChange={e => setStaffBehavior(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-850 rounded-lg p-2 text-slate-355 outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-400">Waiting Time (1-5)</label>
                <input
                  type="number"
                  min="1"
                  max="5"
                  value={waitingTime}
                  onChange={e => setWaitingTime(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-850 rounded-lg p-2 text-slate-350 outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-400">Ambience (1-5)</label>
                <input
                  type="number"
                  min="1"
                  max="5"
                  value={ambience}
                  onChange={e => setAmbience(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-850 rounded-lg p-2 text-slate-355 outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-450">Diner Type</label>
                <select
                  value={customerType}
                  onChange={e => setCustomerType(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-850 rounded-lg p-2 text-slate-350 outline-none"
                >
                  <option value="Solo">Solo diner</option>
                  <option value="Couple">Couple</option>
                  <option value="Family">Family</option>
                  <option value="Group">Group / Friends</option>
                  <option value="Business">Business meeting</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-450">Visit Occasion</label>
                <select
                  value={visitOccasion}
                  onChange={e => setVisitOccasion(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-850 rounded-lg p-2 text-slate-350 outline-none"
                >
                  <option value="Casual">Casual Dining</option>
                  <option value="Birthday">Birthday celebration</option>
                  <option value="Date">Date night</option>
                  <option value="Celebration">Anniversary / Feast</option>
                </select>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Input
              label="Optional Context Notes (Allergy, Delay, Compliments)"
              value={feedbackNotes}
              onChange={e => setFeedbackNotes(e.target.value)}
              placeholder="Food arrived quickly, diner highly satisfied"
            />
          </div>

          <div className="flex items-center space-x-2.5">
            <input
              id="repeatCustomerCheck"
              type="checkbox"
              checked={isRepeatCustomer}
              onChange={e => setIsRepeatCustomer(e.target.checked)}
              className="w-4 h-4 bg-slate-950 border border-slate-850 rounded text-primary focus:ring-0 cursor-pointer"
            />
            <label htmlFor="repeatCustomerCheck" className="text-xs text-slate-400 cursor-pointer select-none">
              Mark guest as a Repeat Customer
            </label>
          </div>

          <div className="flex gap-3 pt-3 border-t border-slate-850/60">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => setShowFeedbackModal(false)}
            >
              Back
            </Button>
            <Button
              className="flex-1 bg-emerald-500 text-slate-950 hover:bg-emerald-600 font-extrabold"
              onClick={handleSubmitFeedback}
              isLoading={isUpdatingBill}
            >
              Submit & Clear Table
            </Button>
          </div>
        </div>
      </Modal>

      {/* ─── Shift Handover Modal ─── */}
      <Modal
        isOpen={showHandoverModal}
        onClose={() => setShowHandoverModal(false)}
        title="Shift Handover Summary"
      >
        <div className="space-y-4 text-left">
          <div className="p-4 bg-red-500/5 border border-red-500/20 rounded-2xl flex items-start space-x-3">
            <AlertOctagon className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <strong className="text-xs text-textPearl">Active Floor Tasks Block</strong>
              <p className="text-[11px] text-slate-400">
                You cannot end your shift with pending floor allocations. Please transfer active tasks to another on-duty server to clock out.
              </p>
            </div>
          </div>

          {/* Pending work snapshots */}
          <div className="grid grid-cols-2 gap-3 text-xs bg-slate-950/40 p-4 rounded-xl border border-slate-850">
            <div>
              <span className="text-slate-550">Assigned Tables:</span>
              <span className="font-bold text-textPearl float-right">{tables.filter(t => t.assignedWaiterId === user?.uid && t.status !== 'empty').length}</span>
            </div>
            <div>
              <span className="text-slate-550">Kitchen Ready:</span>
              <span className="font-bold text-textPearl float-right">{orders.filter(o => o.waiterId === user?.uid && o.status === 'READY').length}</span>
            </div>
            <div className="col-span-2 pt-2 border-t border-slate-900 flex justify-between">
              <span className="text-slate-550">Pending Diner Alerts:</span>
              <span className="font-bold text-textPearl">{waiterRequests.filter(r => {
                const tableObj = tables.find(t => t.number === r.tableNumber);
                return tableObj?.assignedWaiterId === user?.uid && r.status !== 'Completed';
              }).length}</span>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400">Select Receiving Waiter</label>
            <select
              value={handoverRecipientId}
              onChange={e => setHandoverRecipientId(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-350 outline-none"
            >
              <option value="">Choose waiter on shift...</option>
              {employees.filter(e => e.role === 'waiter' && e.id !== user?.uid).map(emp => (
                <option key={emp.id} value={emp.id}>{emp.displayName || emp.email}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Input
              label="Handover Context/Reason"
              value={handoverReason}
              onChange={e => setHandoverReason(e.target.value)}
              placeholder="Handover due to shift end"
            />
          </div>

          <div className="flex gap-3 pt-3 border-t border-slate-855">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => setShowHandoverModal(false)}
              disabled={isSubmittingHandover}
            >
              Cancel
            </Button>
            <Button
              className="flex-1 bg-primary text-slate-950 hover:bg-primary-hover font-extrabold flex items-center justify-center space-x-1"
              onClick={handleInitiateHandover}
              isLoading={isSubmittingHandover}
              disabled={!handoverRecipientId}
            >
              <ArrowRightLeft className="w-4 h-4" />
              <span>Initiate Handover</span>
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default WaiterMatrix;
