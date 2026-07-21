import React, { useEffect, useState, useMemo } from 'react';
import { collection, onSnapshot, getDocs } from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { useAuth } from '../../../context/AuthContext';
import { formatPrice } from '../../../shared/utils/format';

// UI Kit components
import Button from '../../../components/ui/Button/Button';
import Select from '../../../components/ui/Select/Select';
import Card from '../../../components/ui/Card/Card';
import Badge from '../../../components/ui/Badge/Badge';
import LoadingSpinner from '../../../components/ui/LoadingSpinner/LoadingSpinner';
import Tabs from '../../../components/ui/Tabs/Tabs';

// Lucide Icons
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Users, 
  Clock, 
  Activity, 
  Sparkles, 
  ShieldAlert, 
  Star, 
  Calendar, 
  ChevronRight, 
  Package, 
  Trash, 
  Briefcase, 
  Percent, 
  AlertCircle,
  HelpCircle,
  ThumbsUp,
  MapPin,
  Utensils
} from 'lucide-react';
import toast from 'react-hot-toast';

export const OwnerAnalytics: React.FC = () => {
  const { user } = useAuth();
  const tenantId = user?.tenantId;

  // Real-time Database states
  const [orders, setOrders] = useState<any[]>([]);
  const [waiterRequests, setWaiterRequests] = useState<any[]>([]);
  const [ratings, setRatings] = useState<any[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [wasteLogs, setWasteLogs] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Active BI tab
  const [activeTab, setActiveTab] = useState('overview');

  // Filter States
  const [filterPeriod, setFilterPeriod] = useState<'today' | '7days' | '30days' | 'all'>('all');
  const [filterWaiter, setFilterWaiter] = useState('all');
  const [filterTable, setFilterTable] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterPaymentMethod, setFilterPaymentMethod] = useState('all');

  // 1. Subscribe to all necessary collections
  useEffect(() => {
    if (!tenantId) return;

    setIsLoading(true);

    const unsubOrders = onSnapshot(collection(db, 'restaurants', tenantId, 'orders'), (snap) => {
      const list: any[] = [];
      snap.forEach(d => list.push({ id: d.id, ...d.data() }));
      setOrders(list);
      setIsLoading(false);
    }, (err) => {
      console.error(err);
      toast.error('Failed to load orders metrics.');
      setIsLoading(false);
    });

    const unsubRequests = onSnapshot(collection(db, 'restaurants', tenantId, 'waiterRequests'), (snap) => {
      const list: any[] = [];
      snap.forEach(d => list.push({ id: d.id, ...d.data() }));
      setWaiterRequests(list);
    });

    const unsubRatings = onSnapshot(collection(db, 'restaurants', tenantId, 'satisfactionRatings'), (snap) => {
      const list: any[] = [];
      snap.forEach(d => list.push({ id: d.id, ...d.data() }));
      setRatings(list);
    });

    const unsubInv = onSnapshot(collection(db, 'restaurants', tenantId, 'inventory'), (snap) => {
      const list: any[] = [];
      snap.forEach(d => list.push({ id: d.id, ...d.data() }));
      setInventory(list);
    });

    const unsubWaste = onSnapshot(collection(db, 'restaurants', tenantId, 'waste'), (snap) => {
      const list: any[] = [];
      snap.forEach(d => list.push({ id: d.id, ...d.data() }));
      setWasteLogs(list);
    });

    const unsubSuppliers = onSnapshot(collection(db, 'restaurants', tenantId, 'suppliers'), (snap) => {
      const list: any[] = [];
      snap.forEach(d => list.push({ id: d.id, ...d.data() }));
      setSuppliers(list);
    });

    const unsubMenuItems = onSnapshot(collection(db, 'restaurants', tenantId, 'menuItems'), (snap) => {
      const list: any[] = [];
      snap.forEach(d => list.push({ id: d.id, ...d.data() }));
      setMenuItems(list);
    });

    return () => {
      unsubOrders();
      unsubRequests();
      unsubRatings();
      unsubInv();
      unsubWaste();
      unsubSuppliers();
      unsubMenuItems();
    };
  }, [tenantId]);

  // Dynamic filter arrays based on database values
  const availableWaiters = useMemo(() => {
    const set = new Set<string>();
    orders.forEach(o => { if (o.waiterName) set.add(o.waiterName); });
    return ['all', ...Array.from(set)];
  }, [orders]);

  const availableTables = useMemo(() => {
    const set = new Set<string>();
    orders.forEach(o => { if (o.tableNumber) set.add(String(o.tableNumber)); });
    return ['all', ...Array.from(set).sort((a, b) => parseInt(a) - parseInt(b))];
  }, [orders]);

  const availableCategories = useMemo(() => {
    const set = new Set<string>();
    orders.forEach(o => {
      o.items?.forEach((i: any) => { if (i.category) set.add(i.category); });
    });
    return ['all', ...Array.from(set)];
  }, [orders]);

  // 2. Aggregate Data filtering logic
  const filteredData = useMemo(() => {
    const todayStr = new Date().toDateString();
    const cutoffDate = new Date();
    if (filterPeriod === '7days') cutoffDate.setDate(cutoffDate.getDate() - 7);
    if (filterPeriod === '30days') cutoffDate.setDate(cutoffDate.getDate() - 30);

    // Filter orders
    const fOrders = orders.filter(o => {
      const orderDate = new Date(o.createdAt);
      // Period filter
      if (filterPeriod === 'today' && orderDate.toDateString() !== todayStr) return false;
      if (filterPeriod !== 'today' && filterPeriod !== 'all' && orderDate < cutoffDate) return false;

      // Waiter filter
      if (filterWaiter !== 'all' && o.waiterName !== filterWaiter) return false;

      // Table filter
      if (filterTable !== 'all' && String(o.tableNumber) !== filterTable) return false;

      // Payment Method filter
      if (filterPaymentMethod !== 'all') {
        if (filterPaymentMethod === 'Cash' && !o.paymentMethods?.cash) return false;
        if (filterPaymentMethod === 'UPI' && !o.paymentMethods?.upi) return false;
        if (filterPaymentMethod === 'Card' && !o.paymentMethods?.card) return false;
        if (filterPaymentMethod === 'Wallet' && !o.paymentMethods?.wallet) return false;
      }

      // Category filter (checks if order contains at least one item in category)
      if (filterCategory !== 'all') {
        const hasCategory = o.items?.some((i: any) => i.category === filterCategory);
        if (!hasCategory) return false;
      }

      return true;
    });

    // Filter waiter requests
    const fRequests = waiterRequests.filter(r => {
      const reqDate = new Date(r.createdAt);
      if (filterPeriod === 'today' && reqDate.toDateString() !== todayStr) return false;
      if (filterPeriod !== 'today' && filterPeriod !== 'all' && reqDate < cutoffDate) return false;
      if (filterTable !== 'all' && String(r.tableNumber) !== filterTable) return false;
      return true;
    });

    // Filter ratings
    const fRatings = ratings.filter(rt => {
      const rtDate = new Date(rt.submittedAt);
      if (filterPeriod === 'today' && rtDate.toDateString() !== todayStr) return false;
      if (filterPeriod !== 'today' && filterPeriod !== 'all' && rtDate < cutoffDate) return false;
      if (filterTable !== 'all' && String(rt.tableNumber) !== filterTable) return false;
      return true;
    });

    // Filter waste logs
    const fWaste = wasteLogs.filter(w => {
      const wDate = new Date(w.timestamp);
      if (filterPeriod === 'today' && wDate.toDateString() !== todayStr) return false;
      if (filterPeriod !== 'today' && filterPeriod !== 'all' && wDate < cutoffDate) return false;
      return true;
    });

    return { orders: fOrders, requests: fRequests, ratings: fRatings, waste: fWaste };
  }, [orders, waiterRequests, ratings, wasteLogs, filterPeriod, filterWaiter, filterTable, filterCategory, filterPaymentMethod]);

  // 3. Overview Analytics calculations
  const biOverview = useMemo(() => {
    const completed = filteredData.orders.filter(o => o.status === 'COMPLETED' || o.status === 'DELIVERED');
    const totalRev = completed.reduce((sum, o) => sum + (o.total || 0), 0);
    const count = completed.length;
    const aov = count > 0 ? totalRev / count : 0;

    // Kitchen prep calculation
    let totalPrepTime = 0;
    let prepCount = 0;
    completed.forEach(o => {
      if (o.createdAt && o.updatedAt) {
        const diff = (new Date(o.updatedAt).getTime() - new Date(o.createdAt).getTime()) / 60000;
        if (diff > 0 && diff < 180) { // filter outliers
          totalPrepTime += diff;
          prepCount++;
        }
      }
    });

    const allCompleted = orders.filter(o => o.status === 'COMPLETED' || o.status === 'DELIVERED');
    let allPrepTime = 0;
    let allPrepCount = 0;
    allCompleted.forEach(o => {
      if (o.createdAt && o.updatedAt) {
        const diff = (new Date(o.updatedAt).getTime() - new Date(o.createdAt).getTime()) / 60000;
        if (diff > 0 && diff < 180) {
          allPrepTime += diff;
          allPrepCount++;
        }
      }
    });
    const fallbackPrep = allPrepCount > 0 ? Math.round(allPrepTime / allPrepCount) : 10;
    const avgPrep = prepCount > 0 ? Math.round(totalPrepTime / prepCount) : fallbackPrep;

    // Average rating calculation helper
    const getRatingsAverage = (list: any[]) => {
      if (list.length === 0) return 5.0;
      const sum = list.reduce((acc, r) => {
        let score = 5;
        if (r.rating === 'Good') score = 4;
        if (r.rating === 'Neutral') score = 3;
        if (r.rating === 'Needs Attention') score = 2;
        if (r.rating === 'Complaint') score = 1;
        return acc + score;
      }, 0);
      return sum / list.length;
    };

    const avgRating = filteredData.ratings.length > 0 
      ? getRatingsAverage(filteredData.ratings) 
      : getRatingsAverage(ratings);

    // Active tables count
    const activeTables = new Set(
      orders
        .filter(o => o.status !== 'COMPLETED' && o.status !== 'CANCELLED' && o.status !== 'DELIVERED')
        .map(o => o.tableNumber)
    ).size;

    // Inventory status limits
    const lowStockCount = inventory.filter(i => i.status === 'low' || i.status === 'critical' || i.status === 'out_of_stock').length;

    return { totalRev, count, aov, avgPrep, avgRating, activeTables, lowStockCount };
  }, [filteredData, orders, inventory, ratings]);

  // 4. Sales metrics
  const salesMetrics = useMemo(() => {
    const freqMap: Record<string, { name: string; count: number; value: number }> = {};
    (filteredData?.orders || []).forEach(o => {
      o?.items?.forEach((i: any) => {
        const itemId = i?.itemId || 'unknown';
        const name = i?.name || 'Unnamed Item';
        const count = typeof i?.count === 'number' ? i.count : (parseInt(i?.count) || 1);
        const price = typeof i?.pricePerUnit === 'number' ? i.pricePerUnit : (typeof i?.price === 'number' ? i.price : 0);
        
        if (freqMap[itemId]) {
          freqMap[itemId].count += count;
          freqMap[itemId].value += price * count;
        } else {
          freqMap[itemId] = {
            name,
            count,
            value: price * count
          };
        }
      });
    });

    const itemsList = Object.values(freqMap).sort((a, b) => b.count - a.count);
    const bestSelling = itemsList.slice(0, 5);
    const worstSelling = itemsList.slice(-5).reverse();

    // Table revenue splits
    const tableMap: Record<string, number> = {};
    (filteredData?.orders || []).forEach(o => {
      if (o?.tableNumber !== undefined) {
        tableMap[o.tableNumber] = (tableMap[o.tableNumber] || 0) + (o.total || 0);
      }
    });

    // Waiter revenue splits
    const waiterMap: Record<string, number> = {};
    (filteredData?.orders || []).forEach(o => {
      if (o?.waiterName) {
        waiterMap[o.waiterName] = (waiterMap[o.waiterName] || 0) + (o.total || 0);
      }
    });

    return { bestSelling, worstSelling, tableMap, waiterMap };
  }, [filteredData]);

  // 5. Operations details
  const operationsMetrics = useMemo(() => {
    // Fastest & slowest completed orders
    const completed = filteredData.orders.filter(o => o.status === 'COMPLETED' || o.status === 'DELIVERED');
    const orderTimes = completed.map(o => {
      const diff = (new Date(o.updatedAt).getTime() - new Date(o.createdAt).getTime()) / 60000;
      return { id: o.orderId, table: o.tableNumber, elapsed: diff > 0 ? diff : 10 };
    }).filter(t => t.elapsed > 0 && t.elapsed < 180);

    const sortedTimes = [...orderTimes].sort((a, b) => a.elapsed - b.elapsed);
    const fastest = sortedTimes.slice(0, 3);
    const slowest = sortedTimes.slice(-3).reverse();

    // Waiter servings stats
    const waiterOrders: Record<string, number> = {};
    filteredData.orders.forEach(o => {
      if (o.waiterName) {
        waiterOrders[o.waiterName] = (waiterOrders[o.waiterName] || 0) + 1;
      }
    });

    // Peak hours (group by hour 0-23)
    const hoursCount = Array(24).fill(0);
    filteredData.orders.forEach(o => {
      const hr = new Date(o.createdAt).getHours();
      hoursCount[hr]++;
    });

    return { fastest, slowest, waiterOrders, hoursCount };
  }, [filteredData]);

  // 6. Finance distributions
  const financialMetrics = useMemo(() => {
    let cash = 0;
    let upi = 0;
    let card = 0;
    let wallet = 0;

    let subtotal = 0;
    let tax = 0;
    let serviceCharge = 0;

    filteredData.orders.forEach(o => {
      if (o.status === 'COMPLETED' || o.status === 'DELIVERED') {
        cash += o.paymentMethods?.cash || 0;
        upi += o.paymentMethods?.upi || 0;
        card += o.paymentMethods?.card || 0;
        wallet += o.paymentMethods?.wallet || 0;

        subtotal += o.subtotal || 0;
        tax += o.tax || 0;
        serviceCharge += o.serviceCharge || 0;
      }
    });

    const cancels = filteredData.orders.filter(o => o.status === 'CANCELLED');
    const refundValue = cancels.reduce((sum, o) => sum + (o.total || 0), 0);

    return { cash, upi, card, wallet, subtotal, tax, serviceCharge, refundValue };
  }, [filteredData]);

  // stockMetrics calculation
  const stockMetrics = useMemo(() => {
    const wasteCost = (filteredData?.waste || []).reduce((sum, w) => sum + (w?.valueLost || w?.value || 0), 0);
    return { wasteCost };
  }, [filteredData]);

  // 7. Business Health Score Algorithm
  const healthScore = useMemo(() => {
    // 1. CSAT component (max 25 pts)
    const csatWeight = (biOverview.avgRating / 5) * 25;

    // 2. Kitchen turnaround component (max 20 pts)
    // 0-10 min = 20, 10-15 min = 15, 15-20 min = 10, >20 min = 5
    let kitchenWeight = 20;
    if (biOverview.avgPrep > 20) kitchenWeight = 5;
    else if (biOverview.avgPrep > 15) kitchenWeight = 10;
    else if (biOverview.avgPrep > 10) kitchenWeight = 15;

    // 3. Inventory health safety (max 20 pts)
    // Proportion of healthy items
    const totalIngredients = inventory.length;
    let inventoryWeight = 20;
    if (totalIngredients > 0) {
      const healthyRatio = (totalIngredients - biOverview.lowStockCount) / totalIngredients;
      inventoryWeight = healthyRatio * 20;
    }

    // 4. Waste Lost Factor (max 15 pts)
    // waste cost ratio relative to total revenue
    let wasteWeight = 15;
    if (biOverview.totalRev > 0) {
      const ratio = stockMetrics.wasteCost / biOverview.totalRev;
      if (ratio > 0.1) wasteWeight = 3;
      else if (ratio > 0.05) wasteWeight = 8;
      else if (ratio > 0.02) wasteWeight = 12;
    }

    // 5. Cancellations Rate (max 20 pts)
    let cancelWeight = 20;
    const totalOrders = filteredData.orders.length;
    if (totalOrders > 0) {
      const cancelRatio = financialMetrics.refundValue / (biOverview.totalRev + financialMetrics.refundValue);
      if (cancelRatio > 0.15) cancelWeight = 5;
      else if (cancelRatio > 0.08) cancelWeight = 10;
      else if (cancelRatio > 0.03) cancelWeight = 15;
    }

    const score = Math.round(csatWeight + kitchenWeight + inventoryWeight + wasteWeight + cancelWeight);
    
    let label = 'Excellent';
    let color = 'text-emerald-500 border-emerald-500/20 bg-emerald-500/5';
    if (score < 50) {
      label = 'Critical';
      color = 'text-red-500 border-red-500/20 bg-red-500/5';
    } else if (score < 70) {
      label = 'Needs Attention';
      color = 'text-amber-500 border-amber-500/20 bg-amber-500/5';
    } else if (score < 85) {
      label = 'Good';
      color = 'text-sky-500 border-sky-500/20 bg-sky-500/5';
    }

    return { score, label, color };
  }, [biOverview, inventory, stockMetrics.wasteCost, filteredData, financialMetrics]);

  // 8. Rule-Based Forecasts Panel
  const forecasts = useMemo(() => {
    const list: string[] = [];

    // 1. Forecast stock depletion & likely shortages
    const lowItems = inventory.filter(i => i.status === 'low' || i.status === 'critical' || i.status === 'out_of_stock');
    if (lowItems.length > 0) {
      const names = lowItems.slice(0, 2).map(i => i.name).join(', ');
      list.push(`Likely shortages: [${names}] are below safety limits. Supplier reorders recommended.`);
    } else {
      list.push('Inventory stock levels look healthy with no imminent ingredient shortages.');
    }

    // 2. Busy days/Weekend Traffic predictions
    const weekendCount = orders.filter(o => {
      const day = new Date(o.createdAt).getDay();
      return day === 0 || day === 6;
    }).length;
    const totalCount = orders.length;
    if (totalCount > 0) {
      const ratio = Math.round((weekendCount / totalCount) * 100);
      list.push(`Weekend transactions account for ${ratio}% of order volume. Adjust prep schedules for weekend traffic.`);
    }

    // 3. Expected Demand Prediction
    const weeklyAvg = Math.round(orders.length / 4) || 5;
    list.push(`Expected demand: ~${weeklyAvg} orders expected over the next 7-day trailing window.`);

    // 4. CSAT/Customer retention
    const repeatRatio = ratings.length > 0
      ? Math.round((ratings.filter(r => r.repeatCustomer).length / ratings.length) * 100)
      : 80;
    list.push(`Customer retention: CSAT feedback indicates a ${repeatRatio}% customer loyalty level.`);

    return list.slice(0, 4);
  }, [inventory, orders, ratings]);

  // 9. Smart Insights Engines
  const smartInsights = useMemo(() => {
    const list: { type: 'success' | 'warning' | 'info'; title: string; text: string }[] = [];

    // Revenue growth insights
    if (biOverview.totalRev > 0) {
      list.push({
        type: 'success',
        title: 'Revenue Flow Insights',
        text: `Completed ticket sales generated a gross revenue of ${formatPrice(biOverview.totalRev)}.`
      });
    }

    // Top selling item insight
    const topDish = salesMetrics.bestSelling[0];
    if (topDish) {
      list.push({
        type: 'info',
        title: 'Top Selling Dish',
        text: `"${topDish.name}" is your highest volume menu item, totaling ${topDish.count} servings.`
      });
    }

    // Slowest moving item
    const bottomDish = salesMetrics.worstSelling[salesMetrics.worstSelling.length - 1];
    if (bottomDish) {
      list.push({
        type: 'info',
        title: 'Slowest Moving Dish',
        text: `"${bottomDish.name}" is your lowest volume menu item, totaling only ${bottomDish.count} servings.`
      });
    }

    // Peak ordering hour
    let peakHr = 0;
    let peakCount = 0;
    operationsMetrics.hoursCount.forEach((c, h) => {
      if (c > peakCount) {
        peakCount = c;
        peakHr = h;
      }
    });
    if (peakCount > 0) {
      list.push({
        type: 'success',
        title: 'Peak Seating Hour',
        text: `Most orders are processed at ${peakHr}:00. Ensure staffing matches peak volume.`
      });
    }

    // Top waiter stars highlight
    let topWaiter = '';
    let maxServings = 0;
    Object.entries(operationsMetrics.waiterOrders).forEach(([w, c]) => {
      if (c > maxServings) {
        maxServings = c;
        topWaiter = w;
      }
    });
    if (maxServings > 0) {
      list.push({
        type: 'success',
        title: 'Highest Performing Waiter',
        text: `${topWaiter} resolved the highest number of customer orders (${maxServings} orders).`
      });
    }

    // Cancelled Item Audit
    const cancelledOrders = filteredData.orders.filter(o => o.status === 'CANCELLED');
    const cancelledItemsMap: Record<string, number> = {};
    cancelledOrders.forEach(o => {
      o.items?.forEach((i: any) => {
        cancelledItemsMap[i.name] = (cancelledItemsMap[i.name] || 0) + (i.count || 1);
      });
    });
    const topCancelled = Object.entries(cancelledItemsMap).sort((a,b) => b[1] - a[1])[0];
    if (topCancelled) {
      list.push({
        type: 'warning',
        title: 'Cancellation Warning',
        text: `"${topCancelled[0]}" had the highest cancellation rate (${topCancelled[1]} cancellations logged).`
      });
    }

    // Most profitable category
    const categoryRevMap: Record<string, number> = {};
    filteredData.orders.forEach(o => {
      if (o.status === 'COMPLETED' || o.status === 'DELIVERED') {
        o.items?.forEach((i: any) => {
          const cat = i.category || 'Other';
          const count = i.count || 1;
          const price = i.price || i.pricePerUnit || 0;
          categoryRevMap[cat] = (categoryRevMap[cat] || 0) + (price * count);
        });
      }
    });
    const topCategory = Object.entries(categoryRevMap).sort((a,b) => b[1] - a[1])[0];
    if (topCategory) {
      list.push({
        type: 'success',
        title: 'Most Profitable Category',
        text: `Category "${topCategory[0]}" generated the highest sales revenue of ${formatPrice(topCategory[1])}.`
      });
    }

    // Spoilage waste insight
    if (stockMetrics.wasteCost > 0) {
      list.push({
        type: 'warning',
        title: 'Stock Spoilage offset',
        text: `Spoiled ingredients resulted in an offset loss of ${formatPrice(stockMetrics.wasteCost)}.`
      });
    }

    return list.slice(0, 4);
  }, [biOverview, salesMetrics, operationsMetrics, filteredData, stockMetrics, ratings]);

  // Custom Line Chart for trailing period sales (Revenue graph)
  const renderPeriodSalesChart = () => {
    if (filteredData.orders.length === 0) {
      return (
        <div className="h-44 flex flex-col items-center justify-center text-slate-500 border border-slate-850/50 rounded-xl bg-slate-900/10">
          <Activity className="w-8 h-8 mb-2 animate-pulse text-slate-700" />
          <span className="text-xs font-semibold">No revenue data available for selected filters.</span>
        </div>
      );
    }

    const dataPoints = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const total = filteredData.orders
        .filter(o => (o.status === 'COMPLETED' || o.status === 'DELIVERED') && new Date(o.createdAt).toDateString() === d.toDateString())
        .reduce((sum, o) => sum + (o.total || 0), 0);
      return { 
        label: d.toLocaleDateString(undefined, { weekday: 'short' }), 
        amount: total / 100 
      };
    });

    const maxAmt = Math.max(...dataPoints.map(d => d.amount), 50);
    const padding = 45;
    const width = 600;
    const height = 220;

    const points = dataPoints.map((d, i) => {
      const x = padding + (i * (width - padding * 2)) / 6;
      const y = height - padding - (d.amount / maxAmt) * (height - padding * 2);
      return { x, y, label: d.label, amount: d.amount };
    });

    const pathD = points.reduce((acc, p, i) => {
      return i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
    }, '');

    return (
      <div className="w-full select-none">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full overflow-visible text-slate-500">
          <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#1e293b" strokeWidth="1" />
          <line x1={padding} y1={padding} x2={padding} y2={height - padding} stroke="#1e293b" strokeWidth="1" />
          {points.length > 1 && (
            <path d={pathD} fill="none" stroke="#f59e0b" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          )}
          {points.map((p, i) => (
            <g key={i}>
              <circle cx={p.x} cy={p.y} r="4.5" fill="#f59e0b" className="cursor-pointer" />
              <text x={p.x} y={height - 18} textAnchor="middle" fill="#64748b" className="text-[10px] font-bold">
                {p.label}
              </text>
              <text x={p.x} y={p.y - 10} textAnchor="middle" fill="#e2e8f0" className="text-[9.5px] font-semibold">
                ${p.amount.toFixed(0)}
              </text>
            </g>
          ))}
        </svg>
      </div>
    );
  };

  // Custom Line Chart for items sold count (Sales graph)
  const renderSalesCurveChart = () => {
    if (filteredData.orders.length === 0) {
      return (
        <div className="h-44 flex flex-col items-center justify-center text-slate-500 border border-slate-850/50 rounded-xl bg-slate-900/10">
          <TrendingUp className="w-8 h-8 mb-2 text-slate-700 animate-pulse" />
          <span className="text-xs font-semibold">No items sold data available for selected filters.</span>
        </div>
      );
    }

    const dataPoints = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const count = filteredData.orders
        .filter(o => new Date(o.createdAt).toDateString() === d.toDateString())
        .reduce((sum, o) => sum + (o.items?.reduce((s: number, item: any) => s + (item.count || 1), 0) || 0), 0);
      return { 
        label: d.toLocaleDateString(undefined, { weekday: 'short' }), 
        count 
      };
    });

    const maxCount = Math.max(...dataPoints.map(d => d.count), 5);
    const padding = 45;
    const width = 600;
    const height = 220;

    const points = dataPoints.map((d, i) => {
      const x = padding + (i * (width - padding * 2)) / 6;
      const y = height - padding - (d.count / maxCount) * (height - padding * 2);
      return { x, y, label: d.label, count: d.count };
    });

    const pathD = points.reduce((acc, p, i) => {
      return i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
    }, '');

    return (
      <div className="w-full select-none">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full overflow-visible text-slate-500">
          <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#1e293b" strokeWidth="1" />
          <line x1={padding} y1={padding} x2={padding} y2={height - padding} stroke="#1e293b" strokeWidth="1" />
          {points.length > 1 && (
            <path d={pathD} fill="none" stroke="#3b82f6" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          )}
          {points.map((p, i) => (
            <g key={i}>
              <circle cx={p.x} cy={p.y} r="4.5" fill="#3b82f6" className="cursor-pointer" />
              <text x={p.x} y={height - 18} textAnchor="middle" fill="#64748b" className="text-[10px] font-bold">
                {p.label}
              </text>
              <text x={p.x} y={p.y - 10} textAnchor="middle" fill="#e2e8f0" className="text-[9.5px] font-semibold">
                {p.count} qty
              </text>
            </g>
          ))}
        </svg>
      </div>
    );
  };

  // Custom Staff Performance Bar Chart (Performance graph)
  const renderWaiterPerformanceChart = () => {
    const waiterStats = Object.entries(operationsMetrics.waiterOrders);
    if (waiterStats.length === 0) {
      return (
        <div className="h-44 flex flex-col items-center justify-center text-slate-500 border border-slate-850/50 rounded-xl bg-slate-900/10">
          <Users className="w-8 h-8 mb-2 text-slate-700 animate-pulse" />
          <span className="text-xs font-semibold">No staff performance data available.</span>
        </div>
      );
    }

    const maxOrders = Math.max(...waiterStats.map(([_, count]) => count), 5);
    const padding = 45;
    const width = 600;
    const height = 220;

    return (
      <div className="w-full select-none">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full overflow-visible text-slate-500">
          <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#1e293b" strokeWidth="1" />
          <line x1={padding} y1={padding} x2={padding} y2={height - padding} stroke="#1e293b" strokeWidth="1" />
          {waiterStats.map(([waiter, count], i) => {
            const barWidth = 40;
            const gap = (width - padding * 2 - barWidth * waiterStats.length) / Math.max(1, waiterStats.length - 1);
            const x = padding + i * (barWidth + gap);
            const barHeight = (count / maxOrders) * (height - padding * 2);
            const y = height - padding - barHeight;

            return (
              <g key={waiter}>
                <rect x={x} y={y} width={barWidth} height={barHeight} fill="#10b981" rx="4" />
                <text x={x + barWidth / 2} y={height - 18} textAnchor="middle" fill="#64748b" className="text-[10px] font-bold">
                  {waiter}
                </text>
                <text x={x + barWidth / 2} y={y - 8} textAnchor="middle" fill="#e2e8f0" className="text-[9.5px] font-semibold font-mono">
                  {count}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    );
  };

  // Custom Spoilage Waste Cost Bar Chart (Stock graph)
  const renderStockWasteChart = () => {
    if (filteredData.waste.length === 0) {
      return (
        <div className="h-44 flex flex-col items-center justify-center text-slate-500 border border-slate-850/50 rounded-xl bg-slate-900/10">
          <Package className="w-8 h-8 mb-2 text-slate-700 animate-pulse" />
          <span className="text-xs font-semibold">No stock waste logs logged.</span>
        </div>
      );
    }

    const wasteMap: Record<string, number> = {};
    filteredData.waste.forEach(w => {
      wasteMap[w.ingredientName] = (wasteMap[w.ingredientName] || 0) + (w.valueLost || w.value || 0);
    });

    const wasteStats = Object.entries(wasteMap).slice(0, 5);
    const maxWaste = Math.max(...wasteStats.map(([_, cost]) => cost), 10);
    const padding = 45;
    const width = 600;
    const height = 220;

    return (
      <div className="w-full select-none">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full overflow-visible text-slate-500">
          <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#1e293b" strokeWidth="1" />
          <line x1={padding} y1={padding} x2={padding} y2={height - padding} stroke="#1e293b" strokeWidth="1" />
          {wasteStats.map(([ing, cost], i) => {
            const barWidth = 45;
            const gap = (width - padding * 2 - barWidth * wasteStats.length) / Math.max(1, wasteStats.length - 1);
            const x = padding + i * (barWidth + gap);
            const barHeight = (cost / maxWaste) * (height - padding * 2);
            const y = height - padding - barHeight;

            return (
              <g key={ing}>
                <rect x={x} y={y} width={barWidth} height={barHeight} fill="#ef4444" rx="4" />
                <text x={x + barWidth / 2} y={height - 18} textAnchor="middle" fill="#64748b" className="text-[9px] font-bold">
                  {ing.substring(0, 8)}
                </text>
                <text x={x + barWidth / 2} y={y - 8} textAnchor="middle" fill="#e2e8f0" className="text-[9px] font-semibold font-mono">
                  ${cost.toFixed(0)}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    );
  };

  // Custom Finance Payment Methods Splits Chart (Finance graph)
  const renderFinanceMethodsChart = () => {
    const methods = [
      { name: 'UPI', amount: financialMetrics.upi, color: '#f59e0b' },
      { name: 'Card', amount: financialMetrics.card, color: '#10b981' },
      { name: 'Cash', amount: financialMetrics.cash, color: '#3b82f6' },
      { name: 'Wallet', amount: financialMetrics.wallet, color: '#8b5cf6' }
    ].filter(m => m.amount > 0);

    if (methods.length === 0) {
      return (
        <div className="h-44 flex flex-col items-center justify-center text-slate-550 border border-slate-850/50 rounded-xl bg-slate-900/10">
          <DollarSign className="w-8 h-8 mb-2 text-slate-700 animate-pulse" />
          <span className="text-xs font-semibold">No transaction settlement records found.</span>
        </div>
      );
    }

    const maxAmt = Math.max(...methods.map(m => m.amount), 50);
    const padding = 45;
    const width = 600;
    const height = 220;

    return (
      <div className="w-full select-none">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full overflow-visible text-slate-500">
          <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#1e293b" strokeWidth="1" />
          <line x1={padding} y1={padding} x2={padding} y2={height - padding} stroke="#1e293b" strokeWidth="1" />
          {methods.map((m, i) => {
            const barWidth = 50;
            const gap = (width - padding * 2 - barWidth * methods.length) / Math.max(1, methods.length - 1);
            const x = padding + i * (barWidth + gap);
            const barHeight = (m.amount / maxAmt) * (height - padding * 2);
            const y = height - padding - barHeight;

            return (
              <g key={m.name}>
                <rect x={x} y={y} width={barWidth} height={barHeight} fill={m.color} rx="4" />
                <text x={x + barWidth / 2} y={height - 18} textAnchor="middle" fill="#64748b" className="text-[10px] font-bold">
                  {m.name}
                </text>
                <text x={x + barWidth / 2} y={y - 8} textAnchor="middle" fill="#e2e8f0" className="text-[9.5px] font-semibold font-mono">
                  ${(m.amount / 100).toFixed(0)}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <LoadingSpinner label="Compiling business intelligence diagnostics..." />
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="space-y-6 text-left select-none antialiased">
        <Card className="p-8 text-center border border-dashed border-slate-850 rounded-2xl bg-slate-900/10">
          <Activity className="w-12 h-12 text-slate-700 mx-auto mb-3 animate-pulse" />
          <h3 className="text-sm font-bold text-textPearl uppercase tracking-wider mb-2">Insufficient Analytics Data</h3>
          <p className="text-xs text-slate-500 font-semibold max-w-md mx-auto leading-relaxed">
            Analytics metrics, trend forecasts, and business intelligence diagnostics will become available here as orders, transactions, and reviews are recorded.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-left select-none antialiased">
      
      {/* FILTER CONTROL BAR PANEL */}
      <Card className="p-4 border-slate-850 bg-slate-900/35">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5 text-xs">
          <div className="space-y-1">
            <label className="font-bold text-slate-500 uppercase block tracking-wider text-[9px]">Period Window</label>
            <select
              value={filterPeriod}
              onChange={(e: any) => setFilterPeriod(e.target.value)}
              className="w-full bg-slate-950 border border-slate-850 focus:border-primary rounded-xl p-2.5 text-xs font-semibold text-textPearl outline-none"
            >
              <option value="all">All-Time Statistics</option>
              <option value="today">Today's metrics</option>
              <option value="7days">Last 7 Days</option>
              <option value="30days">Last 30 Days</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="font-bold text-slate-500 uppercase block tracking-wider text-[9px]">Filter Waiter</label>
            <select
              value={filterWaiter}
              onChange={(e) => setFilterWaiter(e.target.value)}
              className="w-full bg-slate-950 border border-slate-850 focus:border-primary rounded-xl p-2.5 text-xs font-semibold text-textPearl outline-none"
            >
              <option value="all">All Waiters</option>
              {availableWaiters.filter(w => w !== 'all').map(w => (
                <option key={w} value={w}>{w}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="font-bold text-slate-500 uppercase block tracking-wider text-[9px]">Filter Table</label>
            <select
              value={filterTable}
              onChange={(e) => setFilterTable(e.target.value)}
              className="w-full bg-slate-950 border border-slate-850 focus:border-primary rounded-xl p-2.5 text-xs font-semibold text-textPearl outline-none"
            >
              <option value="all">All Tables</option>
              {availableTables.filter(t => t !== 'all').map(t => (
                <option key={t} value={t}>Table #{t}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="font-bold text-slate-500 uppercase block tracking-wider text-[9px]">Category</label>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full bg-slate-950 border border-slate-850 focus:border-primary rounded-xl p-2.5 text-xs font-semibold text-textPearl outline-none"
            >
              <option value="all">All Categories</option>
              {availableCategories.filter(c => c !== 'all').map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1 col-span-2 md:col-span-1">
            <label className="font-bold text-slate-500 uppercase block tracking-wider text-[9px]">Payment Method</label>
            <select
              value={filterPaymentMethod}
              onChange={(e) => setFilterPaymentMethod(e.target.value)}
              className="w-full bg-slate-950 border border-slate-850 focus:border-primary rounded-xl p-2.5 text-xs font-semibold text-textPearl outline-none"
            >
              <option value="all">All Payments</option>
              <option value="UPI">UPI Payment</option>
              <option value="Card">Credit Card</option>
              <option value="Cash">Cash Settle</option>
              <option value="Wallet">Wallet</option>
            </select>
          </div>
        </div>
      </Card>

      {/* DASHBOARD TAB WRAPPER */}
      <Tabs
        activeTabId={activeTab}
        onTabChange={setActiveTab}
        tabs={[
          { id: 'overview', label: 'Overview', icon: Activity },
          { id: 'sales', label: 'Sales curves', icon: DollarSign },
          { id: 'operations', label: 'Operations Performance', icon: Utensils },
          { id: 'inventory', label: 'Stock analytics', icon: Package },
          { id: 'customer', label: 'CSAT & ratings', icon: Users },
          { id: 'financial', label: 'Finance Ledgers', icon: Percent },
          { id: 'batch_prepared', label: 'Batch Portions', icon: Sparkles }
        ]}
      />

      {/* Overview tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="p-5 border-slate-850 bg-slate-900/30">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Today's Revenue</span>
              <h2 className="text-2xl font-display font-extrabold text-textPearl mt-1">{formatPrice(biOverview.totalRev)}</h2>
              <span className="text-[9px] text-slate-550 block font-semibold mt-1.5">AOV: {formatPrice(biOverview.aov)}</span>
            </Card>

            <Card className="p-5 border-slate-850 bg-slate-900/30">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Kitchen Turnaround</span>
              <h2 className="text-2xl font-display font-extrabold text-textPearl mt-1">{biOverview.avgPrep} mins</h2>
              <span className="text-[9px] text-slate-550 block font-semibold mt-1.5">Average ticket cooking speed</span>
            </Card>

            <Card className="p-5 border-slate-850 bg-slate-900/30">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Customer Satisfaction</span>
              <h2 className="text-2xl font-display font-extrabold text-textPearl mt-1 flex items-center gap-1">
                <span>{biOverview.avgRating.toFixed(1)}</span>
                <Star className="w-5 h-5 text-amber-500 fill-current shrink-0" />
              </h2>
              <span className="text-[9px] text-slate-550 block font-semibold mt-1.5">{filteredData.ratings.length} reviews submitted</span>
            </Card>

            <Card className="p-5 border-slate-850 bg-slate-900/30">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Safety Stock alerts</span>
              <h2 className="text-2xl font-display font-extrabold text-amber-550 mt-1">{biOverview.lowStockCount} items</h2>
              <span className="text-[9px] text-slate-550 block font-semibold mt-1.5">Ingredients below threshold levels</span>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Health dial panel */}
            <Card className="p-5 border-slate-850 bg-slate-900/30 flex flex-col items-center justify-center text-center space-y-4">
              <h3 className="text-xs font-bold text-textPearl uppercase tracking-wider block w-full text-left">
                Business Health score
              </h3>
              <div className="relative w-36 h-36 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-95" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="40" stroke="#1e293b" strokeWidth="8" fill="transparent" />
                  <circle cx="50" cy="50" r="40" stroke="#f59e0b" strokeWidth="8" fill="transparent"
                    strokeDasharray={251.2}
                    strokeDashoffset={251.2 - (251.2 * healthScore.score) / 100}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center space-y-0.5">
                  <span className="text-3xl font-display font-extrabold text-textPearl">{healthScore.score}</span>
                  <span className="text-[9px] text-slate-500 font-bold block uppercase tracking-widest">Score</span>
                </div>
              </div>
              <div className={`px-4.5 py-1.5 border rounded-2xl text-[11px] font-extrabold uppercase tracking-widest ${healthScore.color}`}>
                {healthScore.label}
              </div>
            </Card>

            {/* Smart insights */}
            <Card className="lg:col-span-2 p-5 border-slate-850 bg-slate-900/30 space-y-4">
              <h3 className="text-xs font-bold text-textPearl uppercase tracking-wider pb-2 border-b border-slate-850/60">
                Actionable Smart Insights
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {smartInsights.map((ins, idx) => (
                  <div key={idx} className="bg-slate-950/40 p-3.5 border border-slate-855 rounded-2xl space-y-1.5">
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-primary shrink-0" />
                      <strong className="text-[11.5px] font-bold text-textPearl">{ins.title}</strong>
                    </div>
                    <p className="text-[10px] text-slate-500 leading-relaxed font-semibold">{ins.text}</p>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* SVG sales curve line */}
            <Card className="lg:col-span-2 p-5 border-slate-850 bg-slate-900/30 space-y-4">
              <h3 className="text-xs font-bold text-textPearl uppercase tracking-wider pb-2 border-b border-slate-850/60">
                Revenue Trailing Curve
              </h3>
              <div className="pt-2">
                {renderPeriodSalesChart()}
              </div>
            </Card>

            {/* Rule forecasts */}
            <Card className="p-5 border-slate-850 bg-slate-900/30 space-y-4">
              <h3 className="text-xs font-bold text-textPearl uppercase tracking-wider pb-2 border-b border-slate-850/60">
                Forecast Predictions Center
              </h3>
              <div className="space-y-3.5">
                {forecasts.map((fc, idx) => (
                  <div key={idx} className="flex gap-2.5 items-start text-xs leading-relaxed text-slate-400">
                    <ShieldAlert className="w-4.5 h-4.5 text-amber-500 shrink-0 mt-0.5" />
                    <span>{fc}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Sales Analytics Tab */}
      {activeTab === 'sales' && (
        <div className="space-y-6">
          <Card className="p-5 border-slate-850 bg-slate-900/30 space-y-4">
            <h3 className="text-xs font-bold text-textPearl uppercase tracking-wider pb-2 border-b border-slate-850/60">
              Sales Volume Trailing Curve
            </h3>
            <div className="pt-2">
              {renderSalesCurveChart()}
            </div>
          </Card>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-5 border-slate-850 bg-slate-900/30 space-y-4">
              <h3 className="text-xs font-bold text-textPearl uppercase tracking-wider pb-2 border-b border-slate-850/60">
                Top Selling Menu Items
              </h3>
              <div className="space-y-2.5">
                {salesMetrics.bestSelling.map((d, i) => (
                  <div key={i} className="flex justify-between items-center bg-slate-950/40 p-3 border border-slate-855 rounded-xl text-xs select-none">
                    <div className="flex items-center space-x-2">
                      <span className="w-5 h-5 bg-slate-800 text-slate-400 text-[10px] font-bold flex items-center justify-center rounded-lg">{i + 1}</span>
                      <span className="font-semibold text-textPearl">{d.name}</span>
                    </div>
                    <Badge variant="primary" className="scale-95">{d.count} servings sold</Badge>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-5 border-slate-850 bg-slate-900/30 space-y-4">
              <h3 className="text-xs font-bold text-textPearl uppercase tracking-wider pb-2 border-b border-slate-850/60">
                Under-Performing Items
              </h3>
              <div className="space-y-2.5">
                {salesMetrics.worstSelling.map((d, i) => (
                  <div key={i} className="flex justify-between items-center bg-slate-950/40 p-3 border border-slate-855 rounded-xl text-xs select-none">
                    <div className="flex items-center space-x-2">
                      <span className="w-5 h-5 bg-slate-800 text-slate-400 text-[10px] font-bold flex items-center justify-center rounded-lg">{i + 1}</span>
                      <span className="font-semibold text-textPearl">{d.name}</span>
                    </div>
                    <Badge variant="muted" className="scale-95">{d.count} sold</Badge>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-5 border-slate-850 bg-slate-900/30 space-y-4">
              <h3 className="text-xs font-bold text-textPearl uppercase tracking-wider pb-2 border-b border-slate-850/60">
                Revenue Splits per Seating Table
              </h3>
              <div className="space-y-2">
                {Object.entries(salesMetrics.tableMap).map(([tbl, amt]) => (
                  <div key={tbl} className="flex justify-between text-xs font-semibold py-1">
                    <span className="text-slate-400">Table #{tbl}</span>
                    <strong className="text-textPearl font-mono">{formatPrice(amt)}</strong>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-5 border-slate-850 bg-slate-900/30 space-y-4">
              <h3 className="text-xs font-bold text-textPearl uppercase tracking-wider pb-2 border-b border-slate-850/60">
                Revenue Splits per Waiter Staff
              </h3>
              <div className="space-y-2">
                {Object.entries(salesMetrics.waiterMap).map(([waiter, amt]) => (
                  <div key={waiter} className="flex justify-between text-xs font-semibold py-1">
                    <span className="text-slate-400">{waiter}</span>
                    <strong className="text-textPearl font-mono">{formatPrice(amt)}</strong>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Operations Analytics Tab */}
      {activeTab === 'operations' && (
        <div className="space-y-6">
          <Card className="p-5 border-slate-850 bg-slate-900/30 space-y-4">
            <h3 className="text-xs font-bold text-textPearl uppercase tracking-wider pb-2 border-b border-slate-850/60">
              Waiter Service Performance
            </h3>
            <div className="pt-2">
              {renderWaiterPerformanceChart()}
            </div>
          </Card>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-5 border-slate-850 bg-slate-900/30 space-y-4">
              <h3 className="text-xs font-bold text-textPearl uppercase tracking-wider pb-2 border-b border-slate-850/60">
                Fastest Orders Turnaround (Mins)
              </h3>
              <div className="space-y-2.5">
                {operationsMetrics.fastest.length === 0 ? (
                  <p className="text-xs text-slate-550 font-bold uppercase text-center py-4">No completed orders</p>
                ) : (
                  operationsMetrics.fastest.map((t, idx) => (
                    <div key={idx} className="flex justify-between items-center bg-slate-950/40 p-3 border border-slate-855 rounded-xl text-xs">
                      <span className="font-semibold text-textPearl">Order: #{t?.id ? (t.id.split('-')[1] || t.id) : 'N/A'}</span>
                      <span className="font-bold text-emerald-500">{t?.elapsed !== undefined ? t.elapsed.toFixed(1) : '10'} mins</span>
                    </div>
                  ))
                )}
              </div>
            </Card>

            <Card className="p-5 border-slate-850 bg-slate-900/30 space-y-4">
              <h3 className="text-xs font-bold text-textPearl uppercase tracking-wider pb-2 border-b border-slate-850/60">
                Kitchen Prep Bottlenecks (Slowest Mins)
              </h3>
              <div className="space-y-2.5">
                {operationsMetrics.slowest.length === 0 ? (
                  <p className="text-xs text-slate-550 font-bold uppercase text-center py-4">No completed orders</p>
                ) : (
                  operationsMetrics.slowest.map((t, idx) => (
                    <div key={idx} className="flex justify-between items-center bg-slate-950/40 p-3 border border-slate-855 rounded-xl text-xs">
                      <span className="font-semibold text-textPearl">Order: #{t?.id ? (t.id.split('-')[1] || t.id) : 'N/A'}</span>
                      <span className="font-bold text-red-500">{t?.elapsed !== undefined ? t.elapsed.toFixed(1) : '10'} mins</span>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>

          {/* Peak dining heatmap bar */}
          <Card className="p-5 border-slate-850 bg-slate-900/30 space-y-4">
            <h3 className="text-xs font-bold text-textPearl uppercase tracking-wider pb-2 border-b border-slate-850/60">
              Hourly Dining Occupancy Density (Orders Count)
            </h3>
            <div className="grid grid-cols-24 gap-1 h-12 pt-2 items-end">
              {operationsMetrics.hoursCount.map((cnt, hr) => {
                const max = Math.max(...operationsMetrics.hoursCount, 1);
                const heightPercent = (cnt / max) * 100;
                return (
                  <div key={hr} className="flex flex-col items-center h-full group relative">
                    <div 
                      className={`w-full rounded-t ${cnt > 0 ? 'bg-primary' : 'bg-slate-900'}`}
                      style={{ height: `${heightPercent}%` }}
                    />
                    <span className="text-[7px] text-slate-600 block mt-1 font-mono">{String(hr).padStart(2, '0')}</span>
                    {/* Tooltip */}
                    <div className="absolute bottom-14 hidden group-hover:block bg-slate-900 border border-slate-800 text-[8.5px] p-1 rounded font-bold shadow-2xl z-20 whitespace-nowrap text-textPearl">
                      {hr}:00 - {cnt} orders
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      )}

      {/* Inventory Analytics Tab */}
      {activeTab === 'inventory' && (
        <div className="space-y-6">
          <Card className="p-5 border-slate-850 bg-slate-900/30 space-y-4">
            <h3 className="text-xs font-bold text-textPearl uppercase tracking-wider pb-2 border-b border-slate-850/60">
              Stock Spoilage & Waste Loss
            </h3>
            <div className="pt-2">
              {renderStockWasteChart()}
            </div>
          </Card>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-5 border-slate-850 bg-slate-900/30 space-y-4">
              <h3 className="text-xs font-bold text-textPearl uppercase tracking-wider pb-2 border-b border-slate-850/60">
                Spoilage Waste Loss by Category
              </h3>
              <div className="space-y-3.5">
                {filteredData.waste.length === 0 ? (
                  <p className="text-xs text-slate-550 font-bold uppercase text-center py-4">No waste logs recorded</p>
                ) : (
                  filteredData.waste.map((w, idx) => (
                    <div key={idx} className="flex justify-between items-center bg-slate-950/40 p-2.5 border border-slate-855 rounded-xl text-xs">
                      <div>
                        <span className="font-bold text-textPearl block">{w.ingredientName}</span>
                        <span className="text-[9.5px] text-slate-550 block font-semibold">Reason: {w.reason}</span>
                      </div>
                      <strong className="text-red-500 font-mono font-extrabold">{formatPrice(w.valueLost)}</strong>
                    </div>
                  ))
                )}
              </div>
            </Card>

            <Card className="p-5 border-slate-850 bg-slate-900/30 space-y-4">
              <h3 className="text-xs font-bold text-textPearl uppercase tracking-wider pb-2 border-b border-slate-850/60">
                Safety Stock Replenishment suggestions
              </h3>
              <div className="space-y-2.5">
                {inventory.filter(i => i.status === 'low' || i.status === 'critical' || i.status === 'out_of_stock').slice(0, 4).map(i => (
                  <div key={i.id} className="flex justify-between items-center text-xs py-1">
                    <span className="text-slate-400 font-semibold">{i.name}</span>
                    <strong className="text-amber-500 font-mono">{i.currentStock} {i.unit}</strong>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Customer Analytics Tab */}
      {activeTab === 'customer' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-5 border-slate-850 bg-slate-900/30 space-y-4">
              <h3 className="text-xs font-bold text-textPearl uppercase tracking-wider pb-2 border-b border-slate-850/60">
                Satisfactions Rating Breakdown (Reviews Count)
              </h3>
              <div className="space-y-3">
                {[
                  { key: 'Excellent', val: '😍' },
                  { key: 'Good', val: '😊' },
                  { key: 'Neutral', val: '😐' },
                  { key: 'Needs Attention', val: '🙁' },
                  { key: 'Complaint', val: '😡' }
                ].map(opt => {
                  const cnt = filteredData.ratings.filter(r => r.rating === opt.key).length;
                  return (
                    <div key={opt.key} className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1.5 font-semibold text-slate-350">
                        <span>{opt.val}</span>
                        <span>{opt.key}</span>
                      </span>
                      <strong className="text-textPearl font-mono">{cnt} feedbacks</strong>
                    </div>
                  );
                })}
              </div>
            </Card>

            <Card className="p-5 border-slate-850 bg-slate-900/30 space-y-4">
              <h3 className="text-xs font-bold text-textPearl uppercase tracking-wider pb-2 border-b border-slate-850/60">
                Customer Dining Metrics
              </h3>
              <div className="space-y-4 text-xs font-medium text-slate-400">
                <div className="flex justify-between">
                  <span>Repeat customer visits</span>
                  <strong className="text-textPearl font-bold">
                    {Math.round((filteredData.ratings.filter(r => r.repeatCustomer).length / Math.max(filteredData.ratings.length, 1)) * 100)}%
                  </strong>
                </div>

                <div className="flex justify-between">
                  <span>Average Dining Duration</span>
                  <strong className="text-textPearl font-bold">38 mins avg</strong>
                </div>

                <div className="flex justify-between">
                  <span>Total Waiter Service Requests</span>
                  <strong className="text-primary font-bold">{filteredData.requests.length} calls</strong>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Financial Analytics Tab */}
      {activeTab === 'financial' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-5 border-slate-850 bg-slate-900/30">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">UPI Revenue (Simulated)</span>
              <h2 className="text-2xl font-display font-extrabold text-textPearl mt-1">{formatPrice(financialMetrics.upi)}</h2>
            </Card>

            <Card className="p-5 border-slate-850 bg-slate-900/30">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Credit Card Revenue</span>
              <h2 className="text-2xl font-display font-extrabold text-textPearl mt-1">{formatPrice(financialMetrics.card)}</h2>
            </Card>

            <Card className="p-5 border-slate-850 bg-slate-900/30">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Cash Settle Revenue</span>
              <h2 className="text-2xl font-display font-extrabold text-textPearl mt-1">{formatPrice(financialMetrics.cash)}</h2>
            </Card>
          </div>

          <Card className="p-5 border-slate-850 bg-slate-900/30 space-y-4">
            <h3 className="text-xs font-bold text-textPearl uppercase tracking-wider pb-2 border-b border-slate-850/60">
              Payment Methods Splits
            </h3>
            <div className="pt-2">
              {renderFinanceMethodsChart()}
            </div>
          </Card>

          <Card className="p-5 border-slate-850 bg-slate-900/30 space-y-4">
            <h3 className="text-xs font-bold text-textPearl uppercase tracking-wider pb-2 border-b border-slate-850/60">
              Invoicing margins summary
            </h3>
            <div className="space-y-3.5 text-xs font-medium text-slate-400">
              <div className="flex justify-between">
                <span>Gross Subtotal</span>
                <span className="text-textPearl font-mono font-bold">{formatPrice(financialMetrics.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax collected (GST 5%)</span>
                <span className="text-textPearl font-mono font-bold">{formatPrice(financialMetrics.tax)}</span>
              </div>
              <div className="flex justify-between">
                <span>Service charge collected (5%)</span>
                <span className="text-textPearl font-mono font-bold">{formatPrice(financialMetrics.serviceCharge)}</span>
              </div>
              <div className="flex justify-between">
                <span>Refunded/Cancelled offset loss</span>
                <span className="text-red-500 font-mono font-bold">-{formatPrice(financialMetrics.refundValue)}</span>
              </div>
              <div className="flex justify-between text-textPearl font-extrabold text-sm pt-2.5 border-t border-slate-850/60">
                <span>Net revenue margins</span>
                <span className="text-primary font-mono">{formatPrice(biOverview.totalRev)}</span>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Batch Portions tab */}
      {activeTab === 'batch_prepared' && (() => {
        const batchItems = menuItems.filter(i => i.preparationMethod === 'batch');
        const totalBatches = batchItems.length;
        const totalPrepared = batchItems.reduce((acc, curr) => acc + (curr.defaultBatchSize ?? 50), 0);
        const totalRemaining = batchItems.reduce((acc, curr) => acc + (curr.availableServings ?? 0), 0);
        
        let totalConsumed = 0;
        const itemConsumptionMap: Record<string, number> = {};
        
        orders.forEach(order => {
          if (order.status === 'COMPLETED' || order.status === 'DELIVERED') {
            order.items?.forEach((item: any) => {
              const matchingItem = batchItems.find(bi => bi.id === item.itemId);
              if (matchingItem) {
                const count = Number(item.count || 1);
                totalConsumed += count;
                itemConsumptionMap[matchingItem.name] = (itemConsumptionMap[matchingItem.name] || 0) + count;
              }
            });
          }
        });

        const uniqueDays = new Set<string>();
        orders.forEach(order => {
          if (order.createdAt) {
            uniqueDays.add(order.createdAt.substring(0, 10));
          }
        });
        const daysCount = Math.max(1, uniqueDays.size);
        const avgDailyConsumption = totalConsumed / daysCount;
        const estimatedDaysUntilExhaustion = avgDailyConsumption > 0 
          ? (totalRemaining / avgDailyConsumption)
          : Infinity;

        return (
          <div className="space-y-6 animate-in fade-in duration-200 text-left">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="p-5 border-slate-850 bg-slate-900/30">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Active Batch Items</span>
                <h2 className="text-2xl font-display font-extrabold text-textPearl mt-1">{totalBatches} items</h2>
                <div className="text-[10px] text-slate-400 mt-1">Configured for Advance Prep</div>
              </Card>

              <Card className="p-5 border-slate-850 bg-slate-900/30">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Total Batch Prepared</span>
                <h2 className="text-2xl font-display font-extrabold text-textPearl mt-1">{totalPrepared} portions</h2>
                <div className="text-[10px] text-slate-400 mt-1">Total Capacity Across Batches</div>
              </Card>

              <Card className="p-5 border-slate-850 bg-slate-900/30">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Total Batch Consumed</span>
                <h2 className="text-2xl font-display font-extrabold text-emerald-400 mt-1">{totalConsumed} portions</h2>
                <div className="text-[10px] text-slate-400 mt-1">Served from Batches (All Time)</div>
              </Card>

              <Card className="p-5 border-slate-850 bg-slate-900/30">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Remaining portions</span>
                <h2 className="text-2xl font-display font-extrabold text-amber-400 mt-1">{totalRemaining} portions</h2>
                <div className="text-[10px] text-slate-400 mt-1">Available in Stock</div>
              </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="p-5 border-slate-850 bg-slate-900/30 space-y-4">
                <h3 className="text-xs font-bold text-textPearl uppercase tracking-wider pb-2 border-b border-slate-850/60">
                  Consumption Rates & Exhaustion forecast
                </h3>
                
                <div className="space-y-4 py-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400">Average Daily Consumption:</span>
                    <strong className="text-textPearl text-sm">{avgDailyConsumption.toFixed(1)} portions/day</strong>
                  </div>

                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400">Current Stock Portion Level:</span>
                    <strong className="text-textPearl text-sm">{totalRemaining} / {totalPrepared} portions</strong>
                  </div>

                  <div className="p-4 bg-slate-950/40 border border-slate-850 rounded-xl space-y-1.5">
                    <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">Exhaustion Forecast</span>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-350">Estimated Time Until Exhaustion:</span>
                      <strong className="text-sm text-primary font-mono font-extrabold">
                        {estimatedDaysUntilExhaustion === Infinity ? 'N/A (No sales)' : `${estimatedDaysUntilExhaustion.toFixed(1)} days`}
                      </strong>
                    </div>
                    <p className="text-[9px] text-slate-505 mt-1 leading-relaxed">
                      Based on historical order logs. We advise checking the low portions warnings inside the KDS prepared batches panel to schedule next preps.
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-5 border-slate-850 bg-slate-900/30 space-y-4">
                <h3 className="text-xs font-bold text-textPearl uppercase tracking-wider pb-2 border-b border-slate-850/60">
                  Batch Consumed Breakdowns
                </h3>
                {Object.keys(itemConsumptionMap).length === 0 ? (
                  <p className="text-xs text-slate-500 py-4 text-center font-semibold">No servings have been ordered yet.</p>
                ) : (
                  <div className="space-y-3.5 max-h-64 overflow-y-auto pr-1">
                    {Object.entries(itemConsumptionMap).map(([name, count]) => {
                      const matchedItem = menuItems.find(i => i.name === name);
                      const remaining = matchedItem?.availableServings ?? 0;
                      return (
                        <div key={name} className="flex justify-between items-center bg-slate-950/40 p-3 border border-slate-855 rounded-xl text-xs">
                          <div>
                            <span className="font-bold text-textPearl block">{name}</span>
                            <span className="text-[9px] text-slate-550 block mt-0.5">Remaining Stock: {remaining} portions</span>
                          </div>
                          <div className="text-right">
                            <strong className="font-mono text-emerald-400 font-extrabold text-sm">{count} portions</strong>
                            <span className="text-[8px] text-slate-500 block uppercase mt-0.5">Ordered</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </Card>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default OwnerAnalytics;
