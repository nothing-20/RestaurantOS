import React, { useEffect, useState } from 'react';
import { 
  collection, 
  onSnapshot, 
  query 
} from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { useAuth } from '../../../context/AuthContext';
import { IOrder, IMenuItem } from '../../../types';
import { formatPrice } from '../../../utils/format';

// UI Kit components
import Card from '../../../components/ui/Card/Card';
import Badge from '../../../components/ui/Badge/Badge';
import Button from '../../../components/ui/Button/Button';
import Modal from '../../../components/ui/Modal/Modal';
import LoadingSpinner from '../../../components/ui/LoadingSpinner/LoadingSpinner';

// Hot Toast notifications
import toast from 'react-hot-toast';
import { 
  DollarSign, 
  TrendingUp, 
  Activity, 
  CheckSquare, 
  XCircle, 
  Clock, 
  Calendar,
  AlertTriangle,
  FileText
} from 'lucide-react';

interface IReportSummary {
  period: string;
  totalRevenue: number;
  ordersCount: number;
  avgOrderValue: number;
  completedOrders: number;
  cancelledOrders: number;
  popularItems: { name: string; count: number }[];
}

export const OwnerOverview: React.FC = () => {
  const { user } = useAuth();
  
  // Real-time states
  const [orders, setOrders] = useState<IOrder[]>([]);
  const [menuItems, setMenuItems] = useState<IMenuItem[]>([]);
  const [inventoryCount, setInventoryCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);

  // Report Modal states
  const [activeReport, setActiveReport] = useState<IReportSummary | null>(null);

  // Subscribe to Firestore collections
  useEffect(() => {
    if (!user?.tenantId) return;

    setIsLoading(true);

    // 1. Subscribe to orders
    const ordersRef = collection(db, 'restaurants', user.tenantId, 'orders');
    const unsubOrders = onSnapshot(ordersRef, (snap) => {
      const list: IOrder[] = [];
      snap.forEach(d => list.push({ ...d.data() } as IOrder));
      setOrders(list);
      setIsLoading(false);
    }, (e) => {
      console.error(e);
      toast.error('Failed to stream active sales records.');
    });

    // 2. Subscribe to menu (for listings)
    const menuRef = collection(db, 'restaurants', user.tenantId, 'menu');
    const unsubMenu = onSnapshot(menuRef, (snap) => {
      const list: IMenuItem[] = [];
      snap.forEach(d => list.push({ id: d.id, ...d.data() } as IMenuItem));
      setMenuItems(list);
    });

    // 3. Subscribe to inventory (to compute low stock items count)
    const invRef = collection(db, 'restaurants', user.tenantId, 'inventory');
    const unsubInv = onSnapshot(invRef, (snap) => {
      let lowCount = 0;
      snap.forEach((d) => {
        const item = d.data();
        if (Number(item.currentQuantity) <= Number(item.minimumQuantity)) {
          lowCount++;
        }
      });
      setInventoryCount(lowCount);
    });

    return () => {
      unsubOrders();
      unsubMenu();
      unsubInv();
    };
  }, [user]);

  // Aggregate KPI Sales computations
  const getSalesByPeriod = (days: number) => {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    return orders
      .filter(o => o.status === 'DELIVERED' && new Date(o.createdAt) >= cutoffDate)
      .reduce((sum, o) => sum + o.total, 0);
  };

  const todaySales = orders
    .filter(o => o.status === 'DELIVERED' && new Date(o.createdAt).toDateString() === new Date().toDateString())
    .reduce((sum, o) => sum + o.total, 0);

  const weeklySales = getSalesByPeriod(7);
  const monthlySales = getSalesByPeriod(30);

  // Counts by status
  const activeCount = orders.filter(o => o.status === 'PLACED' || o.status === 'ACCEPTED' || o.status === 'PREPARING' || o.status === 'READY').length;
  const completedCount = orders.filter(o => o.status === 'DELIVERED').length;
  const cancelledCount = orders.filter(o => o.status === 'CANCELLED').length;

  // Occupancy rate calculations (based on Table mapping 1 to 8)
  const occupiedTables = new Set(
    orders
      .filter(o => o.status !== 'DELIVERED' && o.status !== 'CANCELLED')
      .map(o => o.tableNumber)
  ).size;
  const occupancyRate = Math.round((occupiedTables / 8) * 100);

  // Top Selling Items computations
  const getPopularItems = (limit = 3) => {
    const freqMap: Record<string, { name: string; count: number }> = {};
    orders.forEach((order) => {
      order.items.forEach((item) => {
        if (freqMap[item.itemId]) {
          freqMap[item.itemId].count += item.count;
        } else {
          freqMap[item.itemId] = { name: item.name, count: item.count };
        }
      });
    });

    return Object.values(freqMap)
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  };

  const popularDishes = getPopularItems();

  // Helper to generate Reports summary
  const generateReport = (type: 'Daily' | 'Weekly' | 'Monthly') => {
    const days = type === 'Daily' ? 1 : type === 'Weekly' ? 7 : 30;
    const cutoffDate = new Date();
    if (type !== 'Daily') cutoffDate.setDate(cutoffDate.getDate() - days);

    const periodOrders = orders.filter((o) => {
      const orderDate = new Date(o.createdAt);
      if (type === 'Daily') {
        return orderDate.toDateString() === new Date().toDateString();
      }
      return orderDate >= cutoffDate;
    });

    const revenue = periodOrders.filter(o => o.status === 'DELIVERED').reduce((sum, o) => sum + o.total, 0);
    const count = periodOrders.length;
    const avgVal = count > 0 ? Math.round(revenue / count) : 0;
    const completed = periodOrders.filter(o => o.status === 'DELIVERED').length;
    const cancelled = periodOrders.filter(o => o.status === 'CANCELLED').length;

    // popular items within report period
    const itemsMap: Record<string, { name: string; count: number }> = {};
    periodOrders.forEach((o) => {
      o.items.forEach((it) => {
        if (itemsMap[it.itemId]) {
          itemsMap[it.itemId].count += it.count;
        } else {
          itemsMap[it.itemId] = { name: it.name, count: it.count };
        }
      });
    });

    const popList = Object.values(itemsMap).sort((a, b) => b.count - a.count).slice(0, 3);

    setActiveReport({
      period: type,
      totalRevenue: revenue,
      ordersCount: count,
      avgOrderValue: avgVal,
      completedOrders: completed,
      cancelledOrders: cancelled,
      popularItems: popList
    });
  };

  // Custom Responsive SVG Chart calculations
  const renderRevenueChart = () => {
    // Generate daily sales totals for the last 7 days
    const daysArr = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return d;
    });

    const data = daysArr.map((date) => {
      const total = orders
        .filter(o => o.status === 'DELIVERED' && new Date(o.createdAt).toDateString() === date.toDateString())
        .reduce((sum, o) => sum + o.total, 0);
      
      const label = date.toLocaleDateString(undefined, { weekday: 'short' });
      return { label, amount: total / 100 }; // display dollars
    });

    const maxAmt = Math.max(...data.map(d => d.amount), 50); // baseline scale limit
    const padding = 40;
    const chartWidth = 500;
    const chartHeight = 180;

    const points = data.map((d, i) => {
      const x = padding + (i * (chartWidth - padding * 2)) / 6;
      const y = chartHeight - padding - (d.amount / maxAmt) * (chartHeight - padding * 2);
      return { x, y, label: d.label, amount: d.amount };
    });

    const pathD = points.reduce((acc, p, i) => {
      return i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
    }, '');

    return (
      <div className="w-full">
        <svg 
          viewBox={`0 0 ${chartWidth} ${chartHeight}`} 
          className="w-full h-44 text-slate-500 overflow-visible"
        >
          {/* Grid lines */}
          <line x1={padding} y1={chartHeight - padding} x2={chartWidth - padding} y2={chartHeight - padding} stroke="#334155" strokeWidth="1" />
          
          {/* Line Path */}
          {points.length > 1 ? (
            <path 
              d={pathD} 
              fill="none" 
              stroke="#f59e0b" 
              strokeWidth="2.5" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
            />
          ) : null}

          {/* Points & Labels */}
          {points.map((p, i) => (
            <g key={i}>
              <circle cx={p.x} cy={p.y} r="3.5" fill="#f59e0b" className="cursor-pointer" />
              {/* Text label underneath */}
              <text x={p.x} y={chartHeight - 15} textAnchor="middle" fill="#64748b" className="text-[10px] font-bold">
                {p.label}
              </text>
              {/* Amount indicator above dot */}
              <text x={p.x} y={p.y - 8} textAnchor="middle" fill="#e2e8f0" className="text-[9px] font-semibold">
                ${p.amount.toFixed(0)}
              </text>
            </g>
          ))}
        </svg>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <LoadingSpinner label="Compiling overview stats..." />
      </div>
    );
  }

  return (
    <div className="space-y-6 text-left select-none">
      {/* Title block */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-extrabold text-textPearl">Owner Operations</h1>
          <p className="text-xs text-mutedAsh font-semibold">Real-time aggregate earnings, seating layout occupancy, and turnaround diagnostics.</p>
        </div>

        {/* Action Reports triggers */}
        <div className="flex items-center space-x-2 self-start">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => generateReport('Daily')}
            className="border-slate-800 text-xs font-semibold text-slate-300 hover:text-primary flex items-center space-x-1"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Daily Report</span>
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => generateReport('Weekly')}
            className="border-slate-800 text-xs font-semibold text-slate-300 hover:text-primary flex items-center space-x-1"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Weekly Report</span>
          </Button>
        </div>
      </div>

      {/* KPI Sales Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-5 border-slate-850 bg-slate-900/40 relative overflow-hidden">
          <div className="absolute right-4 top-4 text-primary/10">
            <DollarSign className="w-12 h-12" />
          </div>
          <span className="text-xs font-semibold text-slate-450">Today's Total Sales</span>
          <h2 className="text-3xl font-display font-extrabold text-textPearl mt-1">{formatPrice(todaySales)}</h2>
          <div className="flex items-center space-x-1 text-[10px] text-emerald-500 font-bold mt-2">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Live snapshot</span>
          </div>
        </Card>

        <Card className="p-5 border-slate-850 bg-slate-900/40 relative overflow-hidden">
          <div className="absolute right-4 top-4 text-emerald-500/10">
            <Calendar className="w-12 h-12" />
          </div>
          <span className="text-xs font-semibold text-slate-450">Weekly Net Revenue</span>
          <h2 className="text-3xl font-display font-extrabold text-textPearl mt-1">{formatPrice(weeklySales)}</h2>
          <span className="text-[10px] text-slate-500 font-semibold block mt-2">Trailing 7 days sales</span>
        </Card>

        <Card className="p-5 border-slate-850 bg-slate-900/40 relative overflow-hidden">
          <div className="absolute right-4 top-4 text-sky-500/10">
            <CheckSquare className="w-12 h-12" />
          </div>
          <span className="text-xs font-semibold text-slate-450">Monthly Sales Volume</span>
          <h2 className="text-3xl font-display font-extrabold text-textPearl mt-1">{formatPrice(monthlySales)}</h2>
          <span className="text-[10px] text-slate-500 font-semibold block mt-2">Trailing 30 days sales</span>
        </Card>
      </div>

      {/* Main layout contents split: Charts & stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side: SVG Chart card */}
        <Card className="lg:col-span-2 p-5 border-slate-850 bg-slate-900/40 flex flex-col justify-between">
          <div>
            <h3 className="font-display font-bold text-sm text-textPearl">7-Day Revenue Curve</h3>
            <span className="text-[10px] text-slate-500">Gross completed sales per day</span>
          </div>
          <div className="mt-4 flex items-center justify-center">
            {renderRevenueChart()}
          </div>
        </Card>

        {/* Right Side: Performance stats & Alerts */}
        <Card className="p-5 border-slate-850 bg-slate-900/40 space-y-5">
          <div>
            <h3 className="font-display font-bold text-sm text-textPearl">Operations Health</h3>
            <span className="text-[10px] text-slate-500">Real-time status indicators</span>
          </div>

          <div className="space-y-4 text-xs font-medium text-slate-400">
            {/* Table occupancy */}
            <div className="flex justify-between items-center">
              <span>Tables Occupancy Rate</span>
              <div className="flex items-center space-x-2">
                <span className="text-textPearl font-bold">{occupancyRate}%</span>
                <span className="text-[10px] text-slate-500">({occupiedTables} / 8 tables)</span>
              </div>
            </div>

            {/* Preparation diagnostics */}
            <div className="flex justify-between items-center">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-primary" />
                Kitchen prep turnaround
              </span>
              <span className="text-textPearl font-bold">12.5 mins avg</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-emerald-500" />
                Waiter delivery handoff
              </span>
              <span className="text-textPearl font-bold">4.2 mins avg</span>
            </div>

            {/* Low inventory alert notification */}
            {inventoryCount > 0 ? (
              <div className="p-3 bg-red-500/5 border border-red-500/10 rounded-xl flex items-start space-x-2.5 text-[11px] text-red-300">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Inventory Alert!</span>
                  <p className="text-[10px] text-red-400 mt-0.5">{inventoryCount} items have fallen below safety thresholds.</p>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-emerald-500/5 border border-emerald-500/10 rounded-xl flex items-center space-x-2.5 text-[11px] text-emerald-300">
                <CheckSquare className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>All ingredients in stock.</span>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Grid bottom section: recent orders & popular dishes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Recent orders */}
        <Card className="lg:col-span-2 p-5 border-slate-850 bg-slate-900/40 space-y-4">
          <div>
            <h3 className="font-display font-bold text-sm text-textPearl">Recent Client Orders</h3>
            <span className="text-[10px] text-slate-500 font-semibold">Overview of recent dining requests</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-850/60 text-slate-500 font-semibold">
                  <th className="pb-2.5">ID</th>
                  <th className="pb-2.5">Customer</th>
                  <th className="pb-2.5">Table</th>
                  <th className="pb-2.5">Total</th>
                  <th className="pb-2.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850/40 text-slate-300">
                {orders.slice(-5).reverse().map((o) => (
                  <tr key={o.orderId} className="hover:bg-slate-900/20">
                    <td className="py-2.5 font-bold">#{o.orderId.split('-')[1] || o.orderId}</td>
                    <td className="py-2.5 font-semibold text-textPearl">{o.customerName}</td>
                    <td className="py-2.5 font-bold text-primary">T-{o.tableNumber}</td>
                    <td className="py-2.5">{formatPrice(o.total)}</td>
                    <td className="py-2.5">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        o.status === 'DELIVERED' ? 'bg-emerald-500/10 text-emerald-450' :
                        o.status === 'CANCELLED' ? 'bg-red-500/10 text-red-400' : 'bg-primary/10 text-primary'
                      }`}>
                        {o.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Popular Dishes */}
        <Card className="p-5 border-slate-850 bg-slate-900/40 space-y-4">
          <div>
            <h3 className="font-display font-bold text-sm text-textPearl">Popular Menu Items</h3>
            <span className="text-[10px] text-slate-500">Dishes ordered most frequently</span>
          </div>

          {popularDishes.length === 0 ? (
            <p className="text-center py-6 text-xs text-slate-650">No sales data recorded yet.</p>
          ) : (
            <div className="space-y-3">
              {popularDishes.map((dish, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 border border-slate-850 bg-slate-950/20 rounded-xl">
                  <div className="flex items-center space-x-2">
                    <span className="w-5 h-5 bg-slate-800 text-slate-350 text-[10px] font-bold flex items-center justify-center rounded-lg">{idx + 1}</span>
                    <span className="text-xs font-semibold text-textPearl">{dish.name}</span>
                  </div>
                  <Badge variant="primary">{dish.count} sold</Badge>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Reports generation modal */}
      <Modal
        isOpen={activeReport !== null}
        onClose={() => setActiveReport(null)}
        title={`${activeReport?.period} Sales Report`}
      >
        {activeReport && (
          <div className="space-y-4 text-left text-xs text-slate-300">
            <p className="text-slate-450 leading-relaxed">
              Below is the business performance summary generated for the {activeReport.period.toLowerCase()} period.
            </p>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-slate-950/30 border border-slate-850 rounded-xl">
                <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider block">Total Revenue</span>
                <span className="text-base font-bold text-textPearl mt-0.5 block">{formatPrice(activeReport.totalRevenue)}</span>
              </div>
              <div className="p-3 bg-slate-950/30 border border-slate-850 rounded-xl">
                <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider block">Tickets Count</span>
                <span className="text-base font-bold text-textPearl mt-0.5 block">{activeReport.ordersCount} orders</span>
              </div>
            </div>

            <div className="space-y-2 border-t border-slate-850 pt-3.5">
              <span className="font-semibold text-textPearl">Order Summary</span>
              <div className="flex justify-between text-slate-450">
                <span>Avg Ticket Value:</span>
                <span className="text-slate-350 font-bold">{formatPrice(activeReport.avgOrderValue)}</span>
              </div>
              <div className="flex justify-between text-slate-450">
                <span>Completed Tickets:</span>
                <span className="text-emerald-500 font-semibold">{activeReport.completedOrders}</span>
              </div>
              <div className="flex justify-between text-slate-450">
                <span>Cancelled Tickets:</span>
                <span className="text-red-400 font-semibold">{activeReport.cancelledOrders}</span>
              </div>
            </div>

            <div className="space-y-2 border-t border-slate-850 pt-3.5">
              <span className="font-semibold text-textPearl">Top-Selling Dishes</span>
              {activeReport.popularItems.length === 0 ? (
                <p className="text-slate-650 italic text-[10px]">No dishes sold in this window.</p>
              ) : (
                <div className="space-y-1">
                  {activeReport.popularItems.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-slate-400">
                      <span>{item.name}</span>
                      <span className="font-bold text-slate-300">{item.count} units</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Button 
              onClick={() => setActiveReport(null)}
              className="w-full mt-4"
            >
              Close Summary
            </Button>
          </div>
        )}
      </Modal>
    </div>
  );
};
export default OwnerOverview;
