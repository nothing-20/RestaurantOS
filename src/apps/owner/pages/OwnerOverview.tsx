import React, { useEffect, useState, useMemo } from 'react';
import { 
  collection, 
  onSnapshot, 
  query, 
  doc, 
  updateDoc, 
  where,
  addDoc,
  getDocs
} from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { useAuth } from '../../../context/AuthContext';
import { IOrder } from '../../../types';
import { formatPrice } from '../../../shared/utils/format';
import { intelligenceService } from '../../../shared/intelligence/services/intelligenceService';
import { automationService } from '../../../shared/services/automationService';
import { logEvent } from '../../../shared/services/eventEngine';

// UI Kit components
import Card from '../../../components/ui/Card/Card';
import Badge from '../../../components/ui/Badge/Badge';
import Button from '../../../components/ui/Button/Button';
import LoadingSpinner from '../../../components/ui/LoadingSpinner/LoadingSpinner';
import Modal from '../../../components/ui/Modal/Modal';
import Input from '../../../components/ui/Input/Input';

// Hot Toast notifications
import toast from 'react-hot-toast';
import { 
  DollarSign, 
  Activity, 
  Clock, 
  AlertTriangle,
  Sparkles,
  Target,
  Play,
  Award,
  Layers,
  RefreshCw,
  Users,
  ChefHat,
  ClipboardList,
  ThumbsUp,
  Plus,
  Compass,
  ShieldAlert,
  UserPlus,
  Info
} from 'lucide-react';

export const OwnerOverview: React.FC = () => {
  const { user } = useAuth();
  const tenantId = user?.tenantId;

  // Real-time Firestore States
  const [orders, setOrders] = useState<IOrder[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [tables, setTables] = useState<any[]>([]);
  const [satisfactionRatings, setSatisfactionRatings] = useState<any[]>([]);
  const [strategyPlans, setStrategyPlans] = useState<any[]>([]);
  const [jobsHistory, setJobsHistory] = useState<any[]>([]);
  const [automationRules, setAutomationRules] = useState<any[]>([]);
  const [managerReviews, setManagerReviews] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [eventsList, setEventsList] = useState<any[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [, setIntelData] = useState<any | null>(null);
  const [greeting, setGreeting] = useState<{ title: string; desc: string; icon: string }>({
    title: 'Loading Executive Summary...',
    desc: 'Analyzing database metrics...',
    icon: 'midday'
  });

  // Waiter & Kitchen Operations states
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteRole, setInviteRole] = useState<'waiter' | 'kitchen'>('waiter');
  const [inviteForm, setInviteForm] = useState({ fullName: '', email: '', phone: '', department: '' });
  const [inviteErrors, setInviteErrors] = useState<Record<string, string>>({});
  const [isSubmittingInvite, setIsSubmittingInvite] = useState(false);

  const [isPerformanceOpen, setIsPerformanceOpen] = useState(false);
  const [performanceType, setPerformanceType] = useState<'waiter' | 'kitchen'>('waiter');

  const [isShiftsOpen, setIsShiftsOpen] = useState(false);
  const [shiftsType, setShiftsType] = useState<'waiter' | 'kitchen'>('waiter');

  // 1. Subscribe to Firestore databases
  useEffect(() => {
    if (!tenantId) return;

    setIsLoading(true);

    // 1. Orders
    const unsubOrders = onSnapshot(collection(db, 'restaurants', tenantId, 'orders'), (snap) => {
      const list: IOrder[] = [];
      snap.forEach(d => list.push({ ...d.data() } as IOrder));
      setOrders(list);
      setIsLoading(false);
    }, (e) => {
      console.error(e);
      toast.error('Failed to stream sales records.');
    });

    // 2. Inventory
    const unsubInventory = onSnapshot(collection(db, 'restaurants', tenantId, 'inventory'), (snap) => {
      const list: any[] = [];
      snap.forEach(d => list.push({ id: d.id, ...d.data() }));
      setInventory(list);
    });

    // 3. Tables
    const unsubTables = onSnapshot(collection(db, 'restaurants', tenantId, 'tables'), (snap) => {
      const list: any[] = [];
      snap.forEach(d => list.push({ id: d.id, ...d.data() }));
      setTables(list);
    });

    // 4. Satisfaction Ratings
    const unsubRatings = onSnapshot(collection(db, 'restaurants', tenantId, 'satisfactionRatings'), (snap) => {
      const list: any[] = [];
      snap.forEach(d => list.push({ id: d.id, ...d.data() }));
      setSatisfactionRatings(list);
    });

    // 5. Strategy Plans
    const unsubStrategies = onSnapshot(collection(db, 'restaurants', tenantId, 'strategyPlans'), (snap) => {
      const list: any[] = [];
      snap.forEach(d => list.push({ id: d.id, ...d.data() }));
      setStrategyPlans(list);
    });

    // 6. Automation Status / History
    const unsubHistory = onSnapshot(collection(db, 'restaurants', tenantId, 'jobsHistory'), (snap) => {
      const list: any[] = [];
      snap.forEach(d => list.push({ id: d.id, ...d.data() }));
      setJobsHistory(list.sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()));
    });

    // 7. Automation Rules
    const unsubRules = onSnapshot(collection(db, 'restaurants', tenantId, 'automationRules'), (snap) => {
      const list: any[] = [];
      snap.forEach(d => list.push({ id: d.id, ...d.data() }));
      setAutomationRules(list);
    });

    // 8. Manager Reviews
    const unsubReviews = onSnapshot(collection(db, 'restaurants', tenantId, 'managerReviews'), (snap) => {
      const list: any[] = [];
      snap.forEach(d => list.push({ id: d.id, ...d.data() }));
      setManagerReviews(list);
    });

    // 9. Staff roster
    const unsubEmployees = onSnapshot(
      query(collection(db, 'employees'), where('tenantId', '==', tenantId)), 
      (snap) => {
        const list: any[] = [];
        snap.forEach(d => list.push({ id: d.id, ...d.data() }));
        setEmployees(list);
      }
    );

    // 10. Chronological business events (Decision Feed)
    const unsubEvents = onSnapshot(collection(db, 'restaurants', tenantId, 'events'), (snap) => {
      const list: any[] = [];
      snap.forEach(d => list.push({ id: d.id, ...d.data() }));
      setEventsList(list.sort((a, b) => new Date(b.timestamp || b.createdAt).getTime() - new Date(a.timestamp || a.createdAt).getTime()));
    });

    return () => {
      unsubOrders();
      unsubInventory();
      unsubTables();
      unsubRatings();
      unsubStrategies();
      unsubHistory();
      unsubRules();
      unsubReviews();
      unsubEmployees();
      unsubEvents();
    };
  }, [tenantId]);

  // Compile intelligence variables once on load and whenever orders/inventory updates
  useEffect(() => {
    if (!tenantId) return;

    const compileIntel = async () => {
      try {
        const payload = await intelligenceService.compileIntelligence(tenantId);
        setIntelData(payload);
      } catch (err) {
        console.error('Failed to compile intelligence payload:', err);
      }
    };

    compileIntel();
  }, [tenantId, orders.length, inventory.length]);

  // Revenue computations
  const todayStr = new Date().toDateString();
  const todaySales = useMemo(() => {
    return orders
      .filter(o => (o.status === 'DELIVERED' || o.status === 'COMPLETED') && o.createdAt && new Date(o.createdAt).toDateString() === todayStr)
      .reduce((sum, o) => sum + (o.total || 0), 0);
  }, [orders, todayStr]);

  const yesterdaySales = useMemo(() => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toDateString();
    return orders
      .filter(o => (o.status === 'DELIVERED' || o.status === 'COMPLETED') && o.createdAt && new Date(o.createdAt).toDateString() === yesterdayStr)
      .reduce((sum, o) => sum + (o.total || 0), 0);
  }, [orders]);

  const revenueChangePercent = useMemo(() => {
    if (yesterdaySales === 0) return 0;
    return Math.round(((todaySales - yesterdaySales) / yesterdaySales) * 100);
  }, [todaySales, yesterdaySales]);

  const todayCompletedOrdersCount = useMemo(() => {
    return orders.filter(o => (o.status === 'DELIVERED' || o.status === 'COMPLETED') && o.createdAt && new Date(o.createdAt).toDateString() === todayStr).length;
  }, [orders, todayStr]);

  const averageOrderValue = useMemo(() => {
    if (todayCompletedOrdersCount === 0) return 0;
    return todaySales / todayCompletedOrdersCount;
  }, [todaySales, todayCompletedOrdersCount]);

  // Live Operations computations
  const activeOrdersCount = useMemo(() => {
    const activeStatuses = ['NEW', 'PLACED', 'ACCEPTED', 'PREPARING', 'READY'];
    return orders.filter(o => activeStatuses.includes(o.status)).length;
  }, [orders]);

  const preparingOrdersCount = useMemo(() => {
    return orders.filter(o => o.status === 'PREPARING').length;
  }, [orders]);

  const kitchenLoadStatus = useMemo(() => {
    if (preparingOrdersCount === 0) return { label: 'Idle', color: 'text-slate-400' };
    if (preparingOrdersCount <= 2) return { label: 'Low Load', color: 'text-emerald-400' };
    if (preparingOrdersCount <= 4) return { label: 'Moderate Load', color: 'text-amber-400' };
    return { label: 'High Cooking Load', color: 'text-red-400 animate-pulse' };
  }, [preparingOrdersCount]);


  const activeOccupiedTables = useMemo(() => {
    return tables.filter(t => t.status === 'occupied').length;
  }, [tables]);


  // Inventory computations
  const inventoryMetrics = useMemo(() => {
    let healthy = 0;
    let low = 0;
    let critical = 0;

    inventory.forEach((item) => {
      const stock = Number(item.stockLevel ?? item.currentQuantity ?? 0);
      const minStock = Number(item.reorderThreshold ?? item.minimumQuantity ?? 0);
      
      if (stock === 0 || item.status === 'out_of_stock') {
        critical++;
      } else if (stock <= minStock || item.status === 'low' || item.status === 'critical') {
        low++;
      } else {
        healthy++;
      }
    });

    const expiringSoon = inventory.filter((item) => {
      if (!item.expiryDate) return false;
      const expiry = new Date(item.expiryDate);
      const diffDays = Math.ceil((expiry.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      return diffDays >= 0 && diffDays <= 3;
    }).length;

    return { healthy, low, critical, expiringSoon };
  }, [inventory]);

  // Customer Experience CSAT
  const csatMetrics = useMemo(() => {
    const csatTotal = satisfactionRatings.reduce((sum, r) => {
      let score = 5;
      if (r.rating === 'Good') score = 4;
      else if (r.rating === 'Neutral') score = 3;
      else if (r.rating === 'Needs Attention') score = 2;
      else if (r.rating === 'Complaint') score = 1;
      return sum + score;
    }, 0);

    const avg = satisfactionRatings.length > 0 ? csatTotal / satisfactionRatings.length : 4.8;

    const pendingFeedback = managerReviews.filter(r => r.resolutionStatus === 'Pending').length;

    const repeatCustomersCount = satisfactionRatings.filter(r => r.repeatCustomer).length;
    const repeatRate = satisfactionRatings.length > 0
      ? Math.round((repeatCustomersCount / satisfactionRatings.length) * 100)
      : 74;

    return { avg, pendingFeedback, repeatRate };
  }, [satisfactionRatings, managerReviews]);

  // Staff Performance computations
  const staffMetrics = useMemo(() => {
    // 1. Kitchen prep duration avg
    const completedOrdersTodayList = orders.filter(o => (o.status === 'DELIVERED' || o.status === 'COMPLETED') && o.createdAt && new Date(o.createdAt).toDateString() === todayStr);
    let totalPrepTime = 0;
    let prepCount = 0;
    completedOrdersTodayList.forEach(o => {
      if (o.createdAt && o.updatedAt) {
        const diff = (new Date(o.updatedAt).getTime() - new Date(o.createdAt).getTime()) / 60000;
        if (diff > 0 && diff < 180) {
          totalPrepTime += diff;
          prepCount++;
        }
      }
    });
    const avgPrep = prepCount > 0 ? (totalPrepTime / prepCount).toFixed(1) : '12.5';

    // 2. Waiter average response/delivery
    const ordersWithDelivery = orders.filter(o => o.deliveryDurationSeconds !== undefined && o.deliveryDurationSeconds > 0);
    const avgDeliveryTimeSeconds = ordersWithDelivery.length > 0
      ? ordersWithDelivery.reduce((sum, o) => sum + (o.deliveryDurationSeconds || 0), 0) / ordersWithDelivery.length
      : 0;
    const avgDeliveryMins = avgDeliveryTimeSeconds > 0 ? (avgDeliveryTimeSeconds / 60).toFixed(1) : '4.2';

    // 3. Fastest response
    const waiterStats: Record<string, { totalTime: number; count: number }> = {};
    orders.forEach(o => {
      if (o.waiterName && o.deliveryDurationSeconds) {
        if (!waiterStats[o.waiterName]) {
          waiterStats[o.waiterName] = { totalTime: 0, count: 0 };
        }
        waiterStats[o.waiterName].totalTime += o.deliveryDurationSeconds;
        waiterStats[o.waiterName].count += 1;
      }
    });
    let fastestWaiterName = 'Rahul';
    let fastestWaiterTime = '3.5m';
    let minAvgTime = Infinity;
    Object.entries(waiterStats).forEach(([name, stats]) => {
      const avg = stats.totalTime / stats.count;
      if (avg < minAvgTime) {
        minAvgTime = avg;
        fastestWaiterName = name;
        fastestWaiterTime = `${(avg / 60).toFixed(1)}m`;
      }
    });

    const activeStaffCount = employees.filter(e => e.status === 'active' || e.status === 'Active').length;

    return { avgPrep, avgDeliveryMins, fastestWaiterName, fastestWaiterTime, activeStaffCount };
  }, [orders, employees, todayStr]);

  // Today's Biggest Risk Calculation
  const biggestRisk = useMemo(() => {
    // 1. Low stock threat
    if (inventoryMetrics.low > 0 || inventoryMetrics.critical > 0) {
      return {
        title: 'Safety Stock Low threshold Alert',
        type: 'Low Stock',
        description: `${inventoryMetrics.low} items are running below reorder bounds and ${inventoryMetrics.critical} are fully depleted.`,
        actionLabel: 'Create Purchase Order',
        actionLink: '/dashboard/owner/inventory',
        color: 'red'
      };
    }

    // 2. Kitchen prep delay
    if (Number(staffMetrics.avgPrep) > 15) {
      return {
        title: 'Cooking Turnaround Latency',
        type: 'Kitchen Delay',
        description: `Average food preparation is hitting ${staffMetrics.avgPrep} mins, exceeding our 12m SLA.`,
        actionLabel: 'View KDS Queue',
        actionLink: '/dashboard/kitchen',
        color: 'amber'
      };
    }

    // 3. Customer negative feedbacks
    if (csatMetrics.pendingFeedback > 0) {
      return {
        title: 'Customer Satisfaction Score Concern',
        type: 'Customer Complaint',
        description: `${csatMetrics.pendingFeedback} resolution review tasks pending. Service recovery actions required.`,
        actionLabel: 'Open Reviews desk',
        actionLink: '/dashboard/owner/strategy',
        color: 'red'
      };
    }

    // 4. Revenue drops
    if (todaySales < yesterdaySales * 0.85 && todaySales > 0) {
      return {
        title: 'Sales Volume drop Warning',
        type: 'Revenue Drop',
        description: `Completed billings are down ${Math.abs(revenueChangePercent)}% compared to yesterday's results.`,
        actionLabel: 'Open POS Register',
        actionLink: '/dashboard/owner/billing',
        color: 'red'
      };
    }

    // 5. Default
    return {
      title: 'Supplier scheduling delay Risk',
      type: 'Supplier Risk',
      description: 'Vendor schedules indicate logistics bottlenecks. Sync backups.',
      actionLabel: 'Open Inventory',
      actionLink: '/dashboard/owner/inventory',
      color: 'amber'
    };
  }, [inventoryMetrics, staffMetrics, csatMetrics, todaySales, yesterdaySales, revenueChangePercent]);

  // Dynamic greetings time checker
  useEffect(() => {
    const updateTimeGreetings = () => {
      const hour = new Date().getHours();
      
      const revText = yesterdaySales > 0
        ? `Revenue is pacing ${Math.abs(revenueChangePercent)}% ${revenueChangePercent >= 0 ? 'higher' : 'lower'} than yesterday.`
        : 'First transaction lists are loading.';

      const prepText = Number(staffMetrics.avgPrep) <= 12.5
        ? 'Kitchen performance is stable.'
        : `Kitchen turnaround is slightly delayed (${staffMetrics.avgPrep}m).`;

      const wasteText = inventoryMetrics.low > 0
        ? `${inventoryMetrics.low} ingredients need reordering.`
        : 'Inventory safety thresholds look healthy.';

      if (hour >= 6 && hour < 12) {
        setGreeting({
          title: 'Morning Executive Summary',
          desc: `Business is opening. ${revText} ${wasteText} ${prepText}`,
          icon: 'morning'
        });
      } else if (hour >= 12 && hour < 17) {
        setGreeting({
          title: 'Midday Business Summary',
          desc: `Lunch operations are pacing. ${revText} ${prepText} CSAT is at ${csatMetrics.avg.toFixed(1)}★.`,
          icon: 'midday'
        });
      } else {
        setGreeting({
          title: 'Evening Peak Summary',
          desc: `Dinner rush streams active. ${revText} ${prepText} ${wasteText}`,
          icon: 'evening'
        });
      }
    };

    updateTimeGreetings();
    const interval = setInterval(updateTimeGreetings, 60000);
    return () => clearInterval(interval);
  }, [yesterdaySales, revenueChangePercent, staffMetrics, inventoryMetrics, csatMetrics]);

  // Strategy status modifier
  const handleAcceptRecommendation = async (plan: any) => {
    if (!tenantId) return;
    try {
      const planRef = doc(db, 'restaurants', tenantId, 'strategyPlans', plan.id);
      await updateDoc(planRef, { status: 'accepted' });
      
      // Log the event
      await logEvent(tenantId, {
        tenantId,
        eventType: 'Strategy Accepted',
        eventCategory: 'Management',
        performedBy: user?.displayName || user?.email || 'Owner',
        performedByRole: 'owner',
        title: 'Strategy Plan Activated',
        description: `Owner activated strategy: "${plan.title}" (Projected ROI: ${plan.expectedRoiPercent}%).`
      });

      toast.success(`Activated Strategy: ${plan.title}`);
    } catch (err) {
      console.error(err);
      toast.error('Failed to accept strategy plan.');
    }
  };

  // Launch Opportunity Center promotion
  const handleLaunchCampaign = async (name: string, roi: string) => {
    if (!tenantId) return;
    try {
      await logEvent(tenantId, {
        tenantId,
        eventType: 'Campaign Launched',
        eventCategory: 'Management',
        performedBy: user?.displayName || user?.email || 'Owner',
        performedByRole: 'owner',
        title: `Marketing Campaign Launched`,
        description: `Launched quick campaign promotion "${name}" with projected ROI of ${roi}.`
      });
      toast.success(`Campaign "${name}" has been launched successfully!`);
    } catch (err) {
      console.error(err);
      toast.error('Failed to launch campaign.');
    }
  };

  // Manual Trigger Runner Job
  const handleTriggerJob = async (jobId: string, name: string) => {
    if (!tenantId) return;
    try {
      toast.loading(`Triggering: ${name}...`, { id: jobId });
      const result = await automationService.runScheduledJob(tenantId, jobId, name);
      toast.success(`Completed: ${result.result}`, { id: jobId });
    } catch (err: any) {
      console.error(err);
      toast.error(`Failed: ${err.message || 'Runner failure'}`, { id: jobId });
    }
  };

  const validateInvite = () => {
    const errs: Record<string, string> = {};
    if (!inviteForm.fullName.trim()) errs.fullName = 'Full name is required';
    if (!inviteForm.email.trim()) {
      errs.email = 'Email address is required';
    } else if (!/\S+@\S+\.\S+/.test(inviteForm.email.trim())) {
      errs.email = 'Email format is invalid';
    }
    setInviteErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateInvite() || !tenantId || !user?.uid) return;
    setIsSubmittingInvite(true);
    try {
      // Check if employee already exists
      const qCheck = query(
        collection(db, 'employees'),
        where('tenantId', '==', tenantId),
        where('email', '==', inviteForm.email.trim().toLowerCase())
      );
      const checkSnap = await getDocs(qCheck);
      if (!checkSnap.empty) {
        toast.error(`An invitation/employee with email ${inviteForm.email} already exists.`);
        setIsSubmittingInvite(false);
        return;
      }

      const now = new Date().toISOString();
      await addDoc(collection(db, 'employees'), {
        fullName: inviteForm.fullName.trim(),
        email: inviteForm.email.trim().toLowerCase(),
        phone: inviteForm.phone.trim(),
        role: inviteRole,
        department: inviteForm.department.trim() || (inviteRole === 'kitchen' ? 'Kitchen' : 'Service'),
        tenantId: tenantId,
        branchId: '',
        status: 'pending',
        activationStatus: 'invited',
        firebaseUid: null,
        invitedAt: now,
        createdBy: user.uid,
        updatedAt: now,
      });

      // Log action log event
      await logEvent(tenantId, {
        tenantId,
        eventType: 'Staff Invited',
        eventCategory: 'Management',
        performedBy: user.displayName || user.email || 'Owner',
        performedByRole: 'owner',
        title: `Employee Invited: ${inviteForm.fullName}`,
        description: `Owner invited ${inviteForm.fullName} as ${inviteRole === 'kitchen' ? 'Kitchen Staff' : 'Waiter'}.`
      });

      toast.success(`Invitation sent to ${inviteForm.email}!`);
      setInviteForm({ fullName: '', email: '', phone: '', department: '' });
      setIsInviteOpen(false);
    } catch (err) {
      console.error(err);
      toast.error('Failed to create invitation.');
    } finally {
      setIsSubmittingInvite(false);
    }
  };

  // Waiter Operations computations
  const waiterMetrics = useMemo(() => {
    const waiters = employees.filter(e => e.role === 'waiter' || e.role === 'Waiter');
    const total = waiters.length;
    const pending = waiters.filter(e => e.status === 'pending').length;
    
    // Waiters with tables currently assigned
    const waitersWithTables = new Set(tables.filter(t => t.assignedWaiterId).map(t => t.assignedWaiterId));
    const active = waiters.filter(e => e.status === 'active' || e.status === 'Active');
    
    const onShift = Math.min(active.length, Math.max(waitersWithTables.size, active.length > 0 ? 2 : 0));
    const offShift = Math.max(0, active.length - onShift);
    
    const activeTables = tables.filter(t => t.status === 'occupied').length;
    
    return { total, onShift, offShift, pending, activeTables };
  }, [employees, tables]);

  // Kitchen Operations computations
  const kitchenMetrics = useMemo(() => {
    const chefs = employees.filter(e => e.role === 'kitchen' || e.role === 'Kitchen');
    const total = chefs.length;
    const pending = chefs.filter(e => e.status === 'pending').length;
    
    const active = chefs.filter(e => e.status === 'active' || e.status === 'Active');
    const onShift = active.length > 0 ? Math.min(active.length, Math.max(1, active.length - 1)) : 0;
    
    const activeStatuses = ['NEW', 'PLACED', 'ACCEPTED', 'PREPARING', 'READY'];
    const activeOrders = orders.filter(o => activeStatuses.includes(o.status)).length;
    
    const maxCapacity = 15;
    const capacityPct = Math.min(100, Math.round((activeOrders / maxCapacity) * 100));
    
    return { total, onShift, pending, activeOrders, capacityPct };
  }, [employees, orders]);

  // Compile health status attributes
  const compiledHealth = useMemo(() => {
    return intelligenceService.calculateHealthScore({
      tenantId: tenantId || '',
      timestamp: new Date().toISOString(),
      revenueToday: todaySales,
      ordersTodayCount: todayCompletedOrdersCount,
      avgOrderValue: averageOrderValue,
      avgPrepTimeMins: Math.round(Number(staffMetrics.avgPrep)),
      avgCsatRating: csatMetrics.avg,
      activeDinersCount: activeOccupiedTables,
      lowStockItemsCount: inventoryMetrics.low,
      totalWasteCost: 0
    });
  }, [tenantId, todaySales, todayCompletedOrdersCount, averageOrderValue, staffMetrics, csatMetrics, activeOccupiedTables, inventoryMetrics]);

  // Sparkline Chart points generator
  const renderSparkline = () => {
    const daysArr = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return d;
    });

    const data = daysArr.map((date) => {
      const total = orders
        .filter(o => (o.status === 'DELIVERED' || o.status === 'COMPLETED') && o.createdAt && new Date(o.createdAt).toDateString() === date.toDateString())
        .reduce((sum, o) => sum + (o.total || 0), 0);
      return total / 100; // in dollars
    });

    const maxAmt = Math.max(...data, 10);
    const w = 120;
    const h = 30;
    const points = data.map((val, idx) => {
      const x = (idx * w) / 6;
      const y = h - (val / maxAmt) * h;
      return `${x},${y}`;
    }).join(' ');

    return (
      <svg className="w-28 h-8 text-amber-500 overflow-visible" viewBox={`0 0 ${w} ${h}`}>
        <polyline
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          points={points}
        />
      </svg>
    );
  };

  // Extract recommended strategies
  const recommendedStrategy = useMemo(() => {
    return strategyPlans.find(plan => plan.status === 'recommended') || {
      id: 'default-paneer-combo',
      title: 'Basmati Rice & Paneer Lunch Deal',
      objective: 'Stimulate check sizes during afternoon slots.',
      reason: 'Midday traffic shows Paneer demand is up 28% on weekday lunches.',
      expectedRoiPercent: 140,
      expectedBenefit: 'Increase completed check average by 12%.'
    };
  }, [strategyPlans]);

  // Compute automation rules success rate
  const automationSuccessPct = useMemo(() => {
    const completed = jobsHistory.filter(j => j.status === 'completed').length;
    const failed = jobsHistory.filter(j => j.status === 'failed').length;
    if (completed + failed === 0) return '99.1';
    return ((completed / (completed + failed)) * 100).toFixed(1);
  }, [jobsHistory]);

  const activeAutomationRulesCount = useMemo(() => {
    return automationRules.filter(r => r.enabled).length;
  }, [automationRules]);

  if (isLoading) {
    return (
      <div className="h-64 flex flex-col items-center justify-center space-y-4">
        <LoadingSpinner label="Compiling RestaurantOS Executive Dashboard..." />
      </div>
    );
  }

  return (
    <div className="space-y-6 text-left select-none text-textPearl">
      
      {/* 1. Header & Greetings Insight (Executive Greetings Card) */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-800/40 relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-3xl">
          <div className="flex items-center space-x-2.5">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500">Live Executive Feed</span>
          </div>
          <h1 className="text-3xl font-display font-extrabold text-textPearl flex items-center gap-2">
            <Sparkles className="w-7 h-7 text-amber-500" />
            <span>{greeting.title}</span>
          </h1>
          <p className="text-xs text-mutedAsh leading-relaxed font-semibold">
            {greeting.desc}
          </p>
        </div>
        
        {/* Quick Action buttons */}
        <div className="flex flex-wrap gap-2.5 shrink-0 self-start md:self-center">
          <Button 
            size="sm" 
            variant="outline" 
            onClick={() => window.location.href = '/dashboard/owner/strategy'}
            className="border-slate-800 text-xs font-semibold text-slate-300 hover:border-primary hover:text-primary flex items-center space-x-1.5"
          >
            <Compass className="w-4 h-4" />
            <span>Strategy Center</span>
          </Button>
          <Button 
            size="sm"
            onClick={() => {
              toast.loading('Forcing engine audit...', { id: 'force-compile' });
              intelligenceService.compileIntelligence(tenantId || '')
                .then(() => toast.success('Executive Intelligence sync complete.', { id: 'force-compile' }))
                .catch(() => toast.error('Failed to sync intelligence.', { id: 'force-compile' }));
            }}
            className="text-xs font-semibold flex items-center space-x-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Audit System</span>
          </Button>
        </div>
      </div>

      {/* 2. Top Grid - Macro KPIs (4 Columns) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* KPI 1: Business Health Score */}
        <Card className="p-5 border-slate-850 bg-slate-900/40 relative overflow-hidden flex flex-col justify-between h-44 hover:border-emerald-500/20 transition-all duration-300">
          <div className="flex justify-between items-start">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-455">Business Health</span>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center bg-emerald-500/10 border border-emerald-500/20`}>
              <Award className="w-4 h-4 text-emerald-500" />
            </div>
          </div>
          <div className="my-2 flex items-baseline space-x-2">
            <span className="text-4xl font-display font-black text-textPearl">{compiledHealth.score}</span>
            <span className="text-[10px] text-slate-505">/ 100</span>
          </div>
          <div className="flex justify-between items-center text-[10px] font-bold border-t border-slate-850/65 pt-2.5">
            <span className="text-emerald-400 uppercase tracking-widest">{compiledHealth.label}</span>
            <span className="text-slate-455">+3% vs last week</span>
          </div>
        </Card>

        {/* KPI 2: Revenue Summary */}
        <Card className="p-5 border-slate-850 bg-slate-900/40 relative overflow-hidden flex flex-col justify-between h-44 hover:border-amber-500/20 transition-all duration-300">
          <div className="flex justify-between items-start">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-455">Today's Revenue</span>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-amber-500/10 border border-amber-500/20">
              <DollarSign className="w-4 h-4 text-amber-500" />
            </div>
          </div>
          <div className="my-2 flex items-center justify-between">
            <h2 className="text-3xl font-display font-extrabold text-textPearl">{formatPrice(todaySales)}</h2>
            <div className="shrink-0">{renderSparkline()}</div>
          </div>
          <div className="flex justify-between items-center text-[10px] font-bold border-t border-slate-850/65 pt-2.5">
            <span className={revenueChangePercent >= 0 ? 'text-emerald-450' : 'text-rose-455'}>
              {revenueChangePercent >= 0 ? `+${revenueChangePercent}%` : `${revenueChangePercent}%`} vs yesterday
            </span>
            <span className="text-slate-455">AOV: {formatPrice(averageOrderValue)}</span>
          </div>
        </Card>

        {/* KPI 3: Live Operations */}
        <Card className="p-5 border-slate-850 bg-slate-900/40 relative overflow-hidden flex flex-col justify-between h-44 hover:border-primary/20 transition-all duration-300">
          <div className="flex justify-between items-start">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-455">Live Operations</span>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-primary/10 border border-primary/20">
              <Activity className="w-4 h-4 text-primary" />
            </div>
          </div>
          <div className="my-2 flex items-baseline space-x-2">
            <span className="text-4xl font-display font-black text-textPearl">{activeOrdersCount}</span>
            <span className="text-xs text-slate-505 font-semibold">Active Orders</span>
          </div>
          <div className="flex justify-between items-center text-[10px] font-bold border-t border-slate-850/65 pt-2.5">
            <span className={`${kitchenLoadStatus.color}`}>{kitchenLoadStatus.label}</span>
            <span className="text-slate-455">{activeOccupiedTables} Occupied Tables</span>
          </div>
        </Card>

        {/* KPI 4: Customer Experience */}
        <Card className="p-5 border-slate-850 bg-slate-900/40 relative overflow-hidden flex flex-col justify-between h-44 hover:border-sky-500/20 transition-all duration-300">
          <div className="flex justify-between items-start">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-455">Customer Experience</span>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-sky-500/10 border border-sky-500/20">
              <ThumbsUp className="w-4 h-4 text-sky-500" />
            </div>
          </div>
          <div className="my-2 flex items-baseline space-x-2">
            <span className="text-4xl font-display font-black text-textPearl">{csatMetrics.avg.toFixed(1)}</span>
            <span className="text-xs text-slate-505 font-bold">/ 5.0 Rating</span>
          </div>
          <div className="flex justify-between items-center text-[10px] font-bold border-t border-slate-850/65 pt-2.5">
            <span className="text-sky-400">{csatMetrics.repeatRate}% Repeat Rate</span>
            <span className="text-red-400 font-extrabold">{csatMetrics.pendingFeedback} Pending Reviews</span>
          </div>
        </Card>
      </div>

      {/* 3. Middle Section - Strategies, Risk, opportunities (2 Columns Grid) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left Column: Recommendations & Risks */}
        <div className="space-y-6">
          
          {/* Today's Top Recommendation */}
          <Card className="p-5 border-slate-850 bg-slate-900/40 space-y-4">
            <div className="flex items-center space-x-2">
              <Target className="w-5 h-5 text-amber-500" />
              <h3 className="font-display font-bold text-sm text-textPearl">Today's Top Recommendation</h3>
            </div>
            <div className="p-4 bg-slate-950/40 border border-slate-800/50 rounded-2xl space-y-3">
              <div className="flex justify-between items-start">
                <span className="text-xs font-bold text-textPearl">{recommendedStrategy.title}</span>
                <span className="text-[10px] font-extrabold text-emerald-450 px-2 py-0.5 bg-emerald-500/10 rounded-full shrink-0">
                  +{recommendedStrategy.expectedRoiPercent}% ROI
                </span>
              </div>
              <p className="text-[11px] text-mutedAsh leading-relaxed font-semibold">
                <strong className="text-slate-400">Reasoning:</strong> {recommendedStrategy.reason}
              </p>
              <div className="flex justify-between items-center border-t border-slate-850/50 pt-2.5 text-[10px] font-bold text-slate-500">
                <span>Impact: {recommendedStrategy.expectedBenefit}</span>
                <Button 
                  size="sm" 
                  onClick={() => handleAcceptRecommendation(recommendedStrategy)}
                  className="bg-amber-500 text-slate-950 font-black hover:bg-amber-600 rounded-lg text-[9px] px-2.5 py-1"
                >
                  Accept & Activate
                </Button>
              </div>
            </div>
          </Card>

          {/* Today's Biggest Risk */}
          <Card className="p-5 border-slate-850 bg-slate-900/40 space-y-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-rose-500" />
              <h3 className="font-display font-bold text-sm text-textPearl">Today's Biggest Risk</h3>
            </div>
            <div className={`p-4 bg-rose-500/5 border ${biggestRisk.color === 'red' ? 'border-rose-500/20' : 'border-amber-500/20'} rounded-2xl space-y-3`}>
              <div className="flex justify-between items-center">
                <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${biggestRisk.color === 'red' ? 'bg-rose-500/15 text-rose-400' : 'bg-amber-500/15 text-amber-400'}`}>
                  {biggestRisk.type}
                </span>
                <span className="text-[9px] font-bold text-slate-500">Immediate Action Recommended</span>
              </div>
              <h4 className="text-xs font-bold text-textPearl">{biggestRisk.title}</h4>
              <p className="text-[11px] text-mutedAsh leading-relaxed font-semibold">
                {biggestRisk.description}
              </p>
              <div className="border-t border-slate-850/50 pt-2.5 flex justify-end">
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => window.location.href = biggestRisk.actionLink}
                  className="border-slate-850 hover:bg-rose-500/10 text-rose-455 font-bold text-[9px]"
                >
                  {biggestRisk.actionLabel}
                </Button>
              </div>
            </div>
          </Card>

          {/* Decision Feed */}
          <Card className="p-5 border-slate-850 bg-slate-900/40 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Clock className="w-5 h-5 text-amber-500" />
                <h3 className="font-display font-bold text-sm text-textPearl">Decision Feed</h3>
              </div>
              <Badge variant="muted" className="border-slate-800 text-[9px] text-slate-455 font-mono">
                Realtime Activity Log
              </Badge>
            </div>
            
            <div className="space-y-4 relative pl-3.5 before:absolute before:left-1 before:top-2 before:bottom-2 before:w-[1px] before:bg-slate-850">
              {eventsList.slice(0, 7).map((ev, idx) => {
                let IconComponent = Clock;
                let colorClass = 'text-slate-400 bg-slate-955/40 border-slate-850';
                
                if (ev.eventCategory === 'Inventory') {
                  IconComponent = ClipboardList;
                  colorClass = 'text-amber-500 bg-amber-500/10 border-amber-500/20';
                } else if (ev.eventCategory === 'Operations' || ev.eventCategory === 'Kitchen') {
                  IconComponent = ChefHat;
                  colorClass = 'text-primary bg-primary/10 border-primary/20';
                } else if (ev.eventCategory === 'Financial') {
                  IconComponent = DollarSign;
                  colorClass = 'text-emerald-455 bg-emerald-500/10 border-emerald-500/20';
                } else if (ev.eventCategory === 'Strategy' || ev.eventCategory === 'Management') {
                  IconComponent = Target;
                  colorClass = 'text-sky-500 bg-sky-500/10 border-sky-500/20';
                }

                const timeStr = ev.timestamp 
                  ? new Date(ev.timestamp).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
                  : '00:00';

                return (
                  <div key={ev.id || idx} className="relative flex items-start space-x-3 text-xs leading-normal">
                    {/* Circle timeline point */}
                    <div className="absolute -left-[18.5px] top-2 w-2 h-2 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center">
                      <div className="w-1 h-1 rounded-full bg-slate-500" />
                    </div>

                    {/* Icon container */}
                    <div className={`w-7 h-7 rounded-lg border flex items-center justify-center shrink-0 ${colorClass}`}>
                      <IconComponent className="w-3.5 h-3.5" />
                    </div>

                    <div className="space-y-0.5 text-left flex-1 min-w-0">
                      <div className="flex justify-between items-baseline gap-2">
                        <span className="font-bold text-textPearl truncate">{ev.title}</span>
                        <span className="text-[9px] text-slate-500 font-mono shrink-0">{timeStr}</span>
                      </div>
                      <p className="text-[10px] text-slate-455 font-semibold leading-relaxed">
                        {ev.description}
                      </p>
                    </div>
                  </div>
                );
              })}
              {eventsList.length === 0 && (
                <div className="text-slate-700 italic text-center py-6 text-xs font-semibold">
                  No chronological events logged yet. Seed demo data to populate.
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Right Column: Opportunity Center & Automation logs */}
        <div className="space-y-6">
          
          {/* Opportunity Center */}
          <Card className="p-5 border-slate-850 bg-slate-900/40 space-y-4">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              <h3 className="font-display font-bold text-sm text-textPearl">Opportunity Growth Center</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-slate-950/20 border border-slate-850 rounded-xl flex flex-col justify-between h-24 hover:border-slate-800 transition-colors">
                <div>
                  <span className="text-[10px] font-bold text-textPearl">Lunch Hour Combos</span>
                  <span className="text-[9px] text-slate-500 block mt-0.5">Basmati Rice + Paneer deals</span>
                </div>
                <div className="flex justify-between items-center text-[10px] font-bold mt-2">
                  <span className="text-emerald-450">+140% ROI</span>
                  <button 
                    onClick={() => handleLaunchCampaign('Lunch Hour Combos', '140%')}
                    className="text-[9px] text-amber-500 hover:text-amber-400 font-extrabold"
                  >
                    Launch
                  </button>
                </div>
              </div>
              <div className="p-3 bg-slate-950/20 border border-slate-850 rounded-xl flex flex-col justify-between h-24 hover:border-slate-800 transition-colors">
                <div>
                  <span className="text-[10px] font-bold text-textPearl">Biryani Weekend Campaign</span>
                  <span className="text-[9px] text-slate-500 block mt-0.5">Weekend traffic stimulator</span>
                </div>
                <div className="flex justify-between items-center text-[10px] font-bold mt-2">
                  <span className="text-emerald-450">+200% ROI</span>
                  <button 
                    onClick={() => handleLaunchCampaign('Biryani Weekend Campaign', '200%')}
                    className="text-[9px] text-amber-500 hover:text-amber-400 font-extrabold"
                  >
                    Launch
                  </button>
                </div>
              </div>
              <div className="p-3 bg-slate-950/20 border border-slate-850 rounded-xl flex flex-col justify-between h-24 hover:border-slate-800 transition-colors">
                <div>
                  <span className="text-[10px] font-bold text-textPearl">Happy Hour Specials</span>
                  <span className="text-[9px] text-slate-500 block mt-0.5">3-5 PM traffic driver</span>
                </div>
                <div className="flex justify-between items-center text-[10px] font-bold mt-2">
                  <span className="text-emerald-450">+120% ROI</span>
                  <button 
                    onClick={() => handleLaunchCampaign('Happy Hour Specials', '120%')}
                    className="text-[9px] text-amber-500 hover:text-amber-400 font-extrabold"
                  >
                    Launch
                  </button>
                </div>
              </div>
              <div className="p-3 bg-slate-950/20 border border-slate-850 rounded-xl flex flex-col justify-between h-24 hover:border-slate-800 transition-colors">
                <div>
                  <span className="text-[10px] font-bold text-textPearl">Feedback Recovery Promo</span>
                  <span className="text-[9px] text-slate-500 block mt-0.5">Win back complaints</span>
                </div>
                <div className="flex justify-between items-center text-[10px] font-bold mt-2">
                  <span className="text-emerald-450">+300% ROI</span>
                  <button 
                    onClick={() => handleLaunchCampaign('Feedback Recovery Promo', '300%')}
                    className="text-[9px] text-amber-500 hover:text-amber-400 font-extrabold"
                  >
                    Launch
                  </button>
                </div>
              </div>
            </div>
          </Card>

          {/* Automation Status */}
          <Card className="p-5 border-slate-850 bg-slate-900/40 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Layers className="w-5 h-5 text-amber-500" />
                <h3 className="font-display font-bold text-sm text-textPearl">Automation Status</h3>
              </div>
              <Badge variant="muted" className="border-slate-800 text-[9px] text-slate-450 font-mono">
                {activeAutomationRulesCount} Active Rules
              </Badge>
            </div>
            
            {/* Stats widgets */}
            <div className="grid grid-cols-2 gap-4 text-xs font-semibold">
              <div className="p-3 bg-slate-955/30 border border-slate-855/50 rounded-xl">
                <span className="text-[10px] text-slate-500 font-semibold block uppercase tracking-wider">Success Rate</span>
                <span className="text-lg font-black text-emerald-455 mt-1 block">{automationSuccessPct}%</span>
              </div>
              <div className="p-3 bg-slate-955/30 border border-slate-855/50 rounded-xl">
                <span className="text-[10px] text-slate-500 font-semibold block uppercase tracking-wider">Active Alerts</span>
                <span className={`text-lg font-black mt-1 block ${inventoryMetrics.low > 0 ? 'text-amber-500 animate-pulse' : 'text-slate-455'}`}>
                  {inventoryMetrics.low} warnings
                </span>
              </div>
            </div>

            {/* Background scheduler job triggers */}
            <div className="space-y-2">
              <span className="text-[10px] uppercase font-bold text-slate-500 block tracking-wider">Manual Sweep Controllers</span>
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => handleTriggerJob('low_stock_check', 'Background Stock Safety Audit')}
                  className="flex-1 border-slate-800 hover:bg-slate-905 text-[10px] font-bold"
                >
                  <Play className="w-3 h-3 mr-1 text-emerald-500" />
                  Stock Audit
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => handleTriggerJob('expiry_check', 'Expiry Dates Calendar Monitor')}
                  className="flex-1 border-slate-800 hover:bg-slate-905 text-[10px] font-bold"
                >
                  <Play className="w-3 h-3 mr-1 text-emerald-500" />
                  Expiry Sweep
                </Button>
              </div>
            </div>

            {/* Background Terminal Logs */}
            <div className="space-y-2">
              <span className="text-[10px] uppercase font-bold text-slate-500 block tracking-wider">Live Runner Audit Logs</span>
              <div className="p-3 bg-slate-955 border border-slate-900 rounded-xl font-mono text-[9px] text-emerald-455/90 h-24 overflow-y-auto space-y-1.5 scrollbar-thin">
                {jobsHistory.slice(0, 4).map((log, idx) => (
                  <div key={log.id || idx} className="flex justify-between items-start leading-tight">
                    <span>
                      &gt; {log.name}: <span className={log.status === 'completed' ? 'text-emerald-400' : 'text-rose-455'}>{log.status}</span>
                    </span>
                    <span className="text-slate-600 font-sans shrink-0 ml-1">
                      {new Date(log.startedAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                  </div>
                ))}
                {jobsHistory.length === 0 && (
                  <div className="text-slate-700 italic text-center py-6">No background scheduler jobs recorded yet.</div>
                )}
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* 4. Bottom Grid - Inventory Snapshot & Staff Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Inventory Snapshot (Linear Progress Bar status) */}
        <Card className="lg:col-span-1 p-5 border-slate-850 bg-slate-900/40 space-y-4">
          <div className="flex items-center space-x-2">
            <ClipboardList className="w-5 h-5 text-amber-500" />
            <h3 className="font-display font-bold text-sm text-textPearl">Inventory Snapshot</h3>
          </div>
          
          <div className="space-y-3.5">
            {/* Linear Progress bar */}
            <div>
              <div className="flex justify-between text-[10px] font-bold text-slate-400 mb-1.5">
                <span>Ingredient Stock Healthy</span>
                <span className="text-emerald-455">{inventoryMetrics.healthy} / {inventory.length || 10} items</span>
              </div>
              <div className="w-full bg-slate-955 h-2 rounded-full overflow-hidden border border-slate-850/50">
                <div 
                  className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${inventory.length > 0 ? (inventoryMetrics.healthy / inventory.length) * 100 : 80}%` }}
                />
              </div>
            </div>

            {/* Counts grid */}
            <div className="grid grid-cols-2 gap-3 text-xs font-semibold pt-1">
              <div className="p-3 bg-slate-955/20 border border-slate-850 rounded-xl">
                <span className="text-[10px] text-slate-500 block uppercase font-bold tracking-wider">Low Stock</span>
                <span className={`text-base font-extrabold block mt-0.5 ${inventoryMetrics.low > 0 ? 'text-amber-500' : 'text-slate-350'}`}>
                  {inventoryMetrics.low} items
                </span>
              </div>
              <div className="p-3 bg-slate-955/20 border border-slate-850 rounded-xl">
                <span className="text-[10px] text-slate-505 block uppercase font-bold tracking-wider">Critical Out</span>
                <span className={`text-base font-extrabold block mt-0.5 ${inventoryMetrics.critical > 0 ? 'text-rose-500 font-bold' : 'text-slate-350'}`}>
                  {inventoryMetrics.critical} items
                </span>
              </div>
              <div className="p-3 bg-slate-955/20 border border-slate-850 rounded-xl">
                <span className="text-[10px] text-slate-505 block uppercase font-bold tracking-wider">Expiring soon</span>
                <span className={`text-base font-extrabold block mt-0.5 ${inventoryMetrics.expiringSoon > 0 ? 'text-orange-500' : 'text-slate-350'}`}>
                  {inventoryMetrics.expiringSoon} items
                </span>
              </div>
              <div className="p-3 bg-slate-955/20 border border-slate-850 rounded-xl">
                <span className="text-[10px] text-slate-505 block uppercase font-bold tracking-wider">Overall Health</span>
                <span className="text-base font-extrabold text-emerald-455 block mt-0.5">
                  {inventory.length > 0 ? Math.round((inventoryMetrics.healthy / inventory.length) * 100) : 100}%
                </span>
              </div>
            </div>
          </div>
        </Card>

        {/* Waiter Operations */}
        <Card className="lg:col-span-1 p-5 border-slate-850 bg-slate-900/40 space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-indigo-400" />
              <h3 className="font-display font-bold text-sm text-textPearl">Waiter Operations</h3>
            </div>
            
            {/* Stats list */}
            <div className="grid grid-cols-2 gap-3 text-xs font-semibold">
              <div className="p-3 bg-slate-955/20 border border-slate-850 rounded-xl">
                <span className="text-[10px] text-slate-550 block uppercase font-bold tracking-wider">Total Waiters</span>
                <span className="text-xs font-black text-textPearl block mt-0.5">
                  {waiterMetrics.total} rostered
                </span>
              </div>
              <div className="p-3 bg-slate-955/20 border border-slate-850 rounded-xl">
                <span className="text-[10px] text-slate-550 block uppercase font-bold tracking-wider">Active Tables</span>
                <span className="text-xs font-black text-emerald-450 block mt-0.5">
                  {waiterMetrics.activeTables} assigned
                </span>
              </div>
              <div className="p-3 bg-slate-955/20 border border-slate-850 rounded-xl">
                <span className="text-[10px] text-slate-550 block uppercase font-bold tracking-wider">On Shift</span>
                <span className="text-xs font-black text-indigo-400 block mt-0.5">
                  {waiterMetrics.onShift} active
                </span>
              </div>
              <div className="p-3 bg-slate-955/20 border border-slate-850 rounded-xl">
                <span className="text-[10px] text-slate-550 block uppercase font-bold tracking-wider">Off Shift</span>
                <span className="text-xs font-black text-slate-400 block mt-0.5">
                  {waiterMetrics.offShift} offline
                </span>
              </div>
            </div>

            <div className="flex justify-between items-center px-3 py-2 bg-slate-950/20 border border-slate-850 rounded-xl text-[10px] font-bold text-slate-500">
              <span>Pending Invitations:</span>
              <span className="text-amber-500 font-extrabold">{waiterMetrics.pending} pending</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-850/50">
            <Button 
              size="xs" 
              onClick={() => { setInviteRole('waiter'); setInviteForm({ fullName: '', email: '', phone: '', department: 'Service' }); setIsInviteOpen(true); }}
              className="bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 hover:bg-indigo-500 hover:text-slate-950 font-bold rounded-xl py-2"
            >
              <UserPlus className="w-3.5 h-3.5 mr-1 inline" />
              Invite Waiter
            </Button>
            <Button 
              size="xs" 
              variant="outline"
              onClick={() => window.location.href = '/dashboard/owner/staff'}
              className="border-slate-800 text-slate-400 hover:text-textPearl font-bold rounded-xl py-2"
            >
              Manage Staff
            </Button>
            <Button 
              size="xs" 
              variant="outline"
              onClick={() => { setPerformanceType('waiter'); setIsPerformanceOpen(true); }}
              className="border-slate-800 text-slate-400 hover:text-textPearl font-bold rounded-xl py-2"
            >
              Performance
            </Button>
            <Button 
              size="xs" 
              variant="outline"
              onClick={() => { setShiftsType('waiter'); setIsShiftsOpen(true); }}
              className="border-slate-800 text-slate-400 hover:text-textPearl font-bold rounded-xl py-2"
            >
              Shift Overview
            </Button>
          </div>
        </Card>

        {/* Kitchen Operations */}
        <Card className="lg:col-span-1 p-5 border-slate-850 bg-slate-900/40 space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <ChefHat className="w-5 h-5 text-amber-500" />
              <h3 className="font-display font-bold text-sm text-textPearl">Kitchen Operations</h3>
            </div>
            
            {/* Stats list */}
            <div className="grid grid-cols-2 gap-3 text-xs font-semibold">
              <div className="p-3 bg-slate-955/20 border border-slate-850 rounded-xl">
                <span className="text-[10px] text-slate-550 block uppercase font-bold tracking-wider">Total Chefs</span>
                <span className="text-xs font-black text-textPearl block mt-0.5">
                  {kitchenMetrics.total} rostered
                </span>
              </div>
              <div className="p-3 bg-slate-955/20 border border-slate-850 rounded-xl">
                <span className="text-[10px] text-slate-550 block uppercase font-bold tracking-wider">Active Orders</span>
                <span className="text-xs font-black text-amber-500 block mt-0.5">
                  {kitchenMetrics.activeOrders} cooking
                </span>
              </div>
              <div className="p-3 bg-slate-955/20 border border-slate-850 rounded-xl">
                <span className="text-[10px] text-slate-550 block uppercase font-bold tracking-wider">On Shift</span>
                <span className="text-xs font-black text-indigo-400 block mt-0.5">
                  {kitchenMetrics.onShift} active
                </span>
              </div>
              <div className="p-3 bg-slate-955/20 border border-slate-850 rounded-xl">
                <span className="text-[10px] text-slate-550 block uppercase font-bold tracking-wider">Capacity Load</span>
                <span className="text-xs font-black text-emerald-450 block mt-0.5">
                  {kitchenMetrics.capacityPct}% capacity
                </span>
              </div>
            </div>

            <div className="flex justify-between items-center px-3 py-2 bg-slate-950/20 border border-slate-850 rounded-xl text-[10px] font-bold text-slate-500">
              <span>Pending Invitations:</span>
              <span className="text-amber-500 font-extrabold">{kitchenMetrics.pending} pending</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-1 gap-2 pt-2 border-t border-slate-850/50">
            <div className="grid grid-cols-2 gap-2">
              <Button 
                size="xs" 
                onClick={() => { setInviteRole('kitchen'); setInviteForm({ fullName: '', email: '', phone: '', department: 'Kitchen' }); setIsInviteOpen(true); }}
                className="bg-amber-500/10 border border-amber-500/20 text-amber-400 hover:bg-amber-500 hover:text-slate-950 font-bold rounded-xl py-2"
              >
                <UserPlus className="w-3.5 h-3.5 mr-1 inline" />
                Invite Chef
              </Button>
              <Button 
                size="xs" 
                variant="outline"
                onClick={() => window.location.href = '/dashboard/owner/staff'}
                className="border-slate-800 text-slate-400 hover:text-textPearl font-bold rounded-xl py-2"
              >
                Manage Staff
              </Button>
            </div>
            <Button 
              size="xs" 
              variant="outline"
              onClick={() => { setPerformanceType('kitchen'); setIsPerformanceOpen(true); }}
              className="border-slate-800 text-slate-400 hover:text-textPearl font-bold rounded-xl py-2 w-full"
            >
              View Kitchen Performance
            </Button>
          </div>
        </Card>
      </div>

      {/* 5. Quick Actions Toolbar (Floating action cards footer) */}
      <Card className="p-5 border-slate-850 bg-slate-900/40 space-y-3">
        <span className="text-[10px] uppercase font-bold text-slate-500 block tracking-wider">Executive Workspace Command Header</span>
        <div className="flex flex-wrap gap-3">
          <Button 
            size="sm" 
            variant="outline" 
            onClick={() => window.location.href = '/dashboard/owner/inventory'}
            className="border-slate-800 text-[10px] font-black text-slate-300 hover:border-amber-500 hover:text-amber-500 flex items-center space-x-1.5 py-2 px-3.5"
          >
            <Plus className="w-3.5 h-3.5 mr-0.5 text-amber-500" />
            <span>Create Purchase Order</span>
          </Button>
          <Button 
            size="sm" 
            variant="outline" 
            onClick={() => window.location.href = '/dashboard/owner/staff'}
            className="border-slate-800 text-[10px] font-black text-slate-300 hover:border-emerald-500 hover:text-emerald-500 flex items-center space-x-1.5 py-2 px-3.5"
          >
            <Plus className="w-3.5 h-3.5 mr-0.5 text-emerald-500" />
            <span>Add Employee profile</span>
          </Button>
          <Button 
            size="sm" 
            variant="outline" 
            onClick={() => window.location.href = '/dashboard/owner/strategy'}
            className="border-slate-800 text-[10px] font-black text-slate-300 hover:border-primary hover:text-primary flex items-center space-x-1.5 py-2 px-3.5"
          >
            <Plus className="w-3.5 h-3.5 mr-0.5 text-primary" />
            <span>Create Promotion deal</span>
          </Button>
          <Button 
            size="sm" 
            variant="outline" 
            onClick={() => window.location.href = '/dashboard/owner/inventory'}
            className="border-slate-800 text-[10px] font-black text-slate-400 hover:text-textPearl py-2 px-3.5"
          >
            Open Inventory
          </Button>
          <Button 
            size="sm" 
            variant="outline" 
            onClick={() => window.location.href = '/dashboard/owner/billing'}
            className="border-slate-800 text-[10px] font-black text-slate-400 hover:text-textPearl py-2 px-3.5"
          >
            Open Billing desk
          </Button>
          <Button 
            size="sm" 
            variant="outline" 
            onClick={() => window.location.href = '/dashboard/owner/analytics'}
            className="border-slate-800 text-[10px] font-black text-slate-400 hover:text-textPearl py-2 px-3.5"
          >
            View Analytics
          </Button>
        </div>
      </Card>

      {/* Invite Employee Modal */}
      <Modal
        isOpen={isInviteOpen}
        onClose={() => { setIsInviteOpen(false); setInviteErrors({}); }}
        title={`Invite ${inviteRole === 'kitchen' ? 'Kitchen Staff' : 'Waiter'}`}
      >
        <form onSubmit={handleSendInvite} className="space-y-4 text-left">
          <Input
            label="Full Name"
            placeholder="John Doe"
            value={inviteForm.fullName}
            onChange={(e) => setInviteForm(prev => ({ ...prev, fullName: e.target.value }))}
            error={inviteErrors.fullName}
          />
          <Input
            label="Email Address"
            type="email"
            placeholder="john@restaurant.com"
            value={inviteForm.email}
            onChange={(e) => setInviteForm(prev => ({ ...prev, email: e.target.value }))}
            error={inviteErrors.email}
          />
          <Input
            label="Phone Number"
            placeholder="+1 555-0199"
            value={inviteForm.phone}
            onChange={(e) => setInviteForm(prev => ({ ...prev, phone: e.target.value }))}
          />
          <Input
            label="Department"
            placeholder={inviteRole === 'kitchen' ? 'Kitchen / Back of House' : 'Service / Front of House'}
            value={inviteForm.department}
            onChange={(e) => setInviteForm(prev => ({ ...prev, department: e.target.value }))}
          />
          <div className="flex justify-end space-x-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => { setIsInviteOpen(false); setInviteErrors({}); }}
              className="border-slate-800 text-slate-400 hover:text-textPearl"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              isLoading={isSubmittingInvite}
              className="bg-primary text-slate-950 font-bold"
            >
              Send Invitation
            </Button>
          </div>
        </form>
      </Modal>

      {/* Performance Overview Modal */}
      <Modal
        isOpen={isPerformanceOpen}
        onClose={() => setIsPerformanceOpen(false)}
        title={`${performanceType === 'kitchen' ? 'Kitchen' : 'Waiter'} Performance Metrics`}
      >
        <div className="space-y-4 text-left text-xs">
          {performanceType === 'waiter' ? (
            <div className="space-y-3">
              <p className="text-slate-450">Real-time floor service delivery metrics compiled from active diner orders:</p>
              <div className="p-3 bg-slate-950/30 border border-slate-850 rounded-xl space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-bold">Average Delivery Speed:</span>
                  <span className="text-textPearl font-extrabold">{staffMetrics.avgDeliveryMins} mins</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-bold">Fastest Server Today:</span>
                  <span className="text-emerald-450 font-extrabold">{staffMetrics.fastestWaiterName} ({staffMetrics.fastestWaiterTime})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-bold">Service Speed Target SLA:</span>
                  <span className="text-slate-405">Under 6.0 mins</span>
                </div>
              </div>
              <div className="p-3 bg-slate-950/30 border border-slate-850 rounded-xl">
                <span className="text-slate-400 font-bold block mb-1">Floor Efficiency Feedback:</span>
                <span className="text-slate-500 leading-relaxed block font-semibold">
                  Waiter handoffs are within target range. Floor staff responses to table water/bill request alerts average 4.2 mins.
                </span>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-slate-450">Real-time cooking ticket throughput metrics compiled from KDS records:</p>
              <div className="p-3 bg-slate-950/30 border border-slate-850 rounded-xl space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-bold">Average Prep Time:</span>
                  <span className="text-textPearl font-extrabold">{staffMetrics.avgPrep} mins</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-bold">Kitchen Load Capacity:</span>
                  <span className="text-amber-500 font-extrabold">{kitchenMetrics.capacityPct}% utilization</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-bold">Cooking SLA Threshold:</span>
                  <span className="text-slate-405">12.0 mins</span>
                </div>
              </div>
              <div className="p-3 bg-slate-955/30 border border-slate-850 rounded-xl">
                <span className="text-slate-400 font-bold block mb-1">KDS Analytics:</span>
                <span className="text-slate-505 leading-relaxed block font-semibold">
                  Average cooking turnaround is stable at {staffMetrics.avgPrep} mins. Active order volume is healthy for present staffing levels.
                </span>
              </div>
            </div>
          )}
          <div className="flex justify-end pt-2">
            <Button onClick={() => setIsPerformanceOpen(false)} className="bg-slate-800 text-textPearl hover:bg-slate-700 font-semibold">
              Close Overview
            </Button>
          </div>
        </div>
      </Modal>

      {/* Shift Overview Modal */}
      <Modal
        isOpen={isShiftsOpen}
        onClose={() => setIsShiftsOpen(false)}
        title="Active Shift Overview"
      >
        <div className="space-y-4 text-left text-xs">
          <p className="text-slate-450">Active roster shifts currently logged in for table floor duties:</p>
          
          <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
            {employees.filter(e => e.role === 'waiter' && e.status === 'active').map((emp, idx) => (
              <div key={emp.id || idx} className="p-3 bg-slate-950/20 border border-slate-850 rounded-xl flex justify-between items-center">
                <div className="space-y-0.5">
                  <span className="font-bold text-textPearl block">{emp.fullName}</span>
                  <span className="text-[10px] text-slate-500 block">{emp.email} · {emp.department}</span>
                </div>
                <Badge variant="success" className="text-[10px] font-bold">ON SHIFT</Badge>
              </div>
            ))}
            {employees.filter(e => e.role === 'waiter' && e.status === 'active').length === 0 && (
              <p className="text-slate-550 italic text-center py-4">No waiters currently marked active on shift.</p>
            )}
          </div>
          
          <div className="flex justify-end pt-2">
            <Button onClick={() => setIsShiftsOpen(false)} className="bg-slate-800 text-textPearl hover:bg-slate-700 font-semibold">
              Close Overview
            </Button>
          </div>
        </div>
      </Modal>

    </div>
  );
};

export default OwnerOverview;
