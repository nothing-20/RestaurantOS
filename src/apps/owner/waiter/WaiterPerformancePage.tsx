import React, { useMemo } from 'react';
import { useWaiterData } from './useWaiterData';
import { useAuth } from '../../../context/AuthContext';
import Card from '../../../components/ui/Card/Card';
import LoadingSpinner from '../../../components/ui/LoadingSpinner/LoadingSpinner';
import { formatPrice } from '../../../utils/format';
import { Award, CheckCircle, Clock, Heart, TrendingUp, AlertOctagon, Users, BarChart2 } from 'lucide-react';

export const WaiterPerformancePage: React.FC = () => {
  const { user } = useAuth();
  const { orders, waiterRequests, isLoading } = useWaiterData();

  const metrics = useMemo(() => {
    // Current Waiter Stats
    const waiterOrders = orders.filter(o => o.waiterId === user?.uid);
    const deliveredOrders = waiterOrders.filter(o => o.status === 'DELIVERED' || o.status === 'COMPLETED' || o.status === 'ARCHIVED');
    const guestsServed = waiterOrders.reduce((sum, o) => sum + (Number(o.guestsCount) || 2), 0);
    
    // Average delivery time calculation
    let totalDeliverySecs = 0;
    let deliveryCount = 0;
    let lateDeliveries = 0;

    deliveredOrders.forEach(o => {
      const readyAt = o.readyAt;
      if (readyAt && o.deliveredAt) {
        const start = new Date(readyAt).getTime();
        const end = new Date(o.deliveredAt).getTime();
        const durationSecs = (end - start) / 1000;
        if (durationSecs > 0) {
          totalDeliverySecs += durationSecs;
          deliveryCount++;
          if (durationSecs > 600) { // delivery > 10 min is late
            lateDeliveries++;
          }
        }
      }
    });

    const avgDeliveryTime = deliveryCount > 0 
      ? `${Math.round((totalDeliverySecs / deliveryCount) / 60)}m` 
      : '—';

    // Request response stats
    const waiterAlerts = waiterRequests.filter(r => r.acceptedBy === (user?.displayName || user?.email));
    const resolvedAlerts = waiterAlerts.filter(r => r.status === 'Completed');
    
    let totalResponseSecs = 0;
    let responseCount = 0;

    resolvedAlerts.forEach(r => {
      if (r.createdAt && r.resolvedAt) {
        const start = new Date(r.createdAt).getTime();
        const end = new Date(r.resolvedAt).getTime();
        const diff = (end - start) / 1000;
        if (diff > 0) {
          totalResponseSecs += diff;
          responseCount++;
        }
      }
    });

    const avgResponseTime = responseCount > 0
      ? `${Math.round((totalResponseSecs / responseCount) / 60)}m`
      : '—';

    const tablesManaged = new Set(waiterOrders.map(o => o.tableNumber)).size;
    const tipsEarned = waiterOrders.length * 350; // Mock $3.50 tips avg
    const upsellValue = waiterOrders.reduce((sum, o) => {
      const upsellItems = o.items?.filter((it: any) => 
        ['Dessert', 'Desserts', 'Coffee', 'Tea', 'Cold Drinks', 'Soft Drinks', 'Beverages'].includes(it.category)
      ) || [];
      return sum + upsellItems.reduce((s: number, it: any) => s + (it.pricePerUnit * it.count), 0);
    }, 0);

    const complaints = waiterOrders.filter(o => o.status === 'CANCELLED').length;
    
    // Incident Response Rate (Success Rate)
    const totalIncidents = waiterAlerts.length;
    const incidentSuccessRate = totalIncidents > 0 
      ? Math.round((resolvedAlerts.length / totalIncidents) * 100)
      : 100;

    // Service Efficiency Rating
    const efficiencyScore = Math.min(100, Math.max(40, 100 - (lateDeliveries * 8) - (complaints * 12) + (resolvedAlerts.length * 2.5)));

    // Mock repeat customer satisfaction
    const repeatCustomerSatis = Math.round(waiterOrders.length * 0.25);

    return {
      ordersServed: deliveredOrders.length,
      tablesManaged,
      avgDeliveryTime,
      avgResponseTime,
      tipsEarned,
      upsellValue,
      complaints,
      completedRequests: resolvedAlerts.length,
      lateDeliveries,
      guestsServed,
      incidentSuccessRate,
      efficiencyScore,
      repeatCustomerSatis,
      waiterOrders
    };
  }, [orders, waiterRequests, user]);

  if (isLoading) {
    return (
      <div className="h-96 flex items-center justify-center">
        <LoadingSpinner label="Loading performance logs..." />
      </div>
    );
  }

  // Weekdays mock chart percentages
  const weeklyTrends = [
    { day: 'Mon', value: 60 },
    { day: 'Tue', value: 45 },
    { day: 'Wed', value: 80 },
    { day: 'Thu', value: 75 },
    { day: 'Fri', value: 95 },
    { day: 'Sat', value: 100 },
    { day: 'Sun', value: 90 }
  ];

  return (
    <div className="space-y-6 text-left select-none pb-24">
      <div>
        <h1 className="text-2xl font-display font-extrabold text-textPearl">Waiter Performance trends</h1>
        <p className="text-xs text-mutedAsh font-semibold">Track your customer service, speed, upsells, and shift efficiency metrics.</p>
      </div>

      {/* Main Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Orders Delivered', value: metrics.ordersServed, desc: 'Total dining orders served', icon: <CheckCircle className="w-5 h-5 text-emerald-450" /> },
          { label: 'Guests Served', value: metrics.guestsServed, desc: 'Total guest diners handled', icon: <Users className="w-5 h-5 text-blue-450" /> },
          { label: 'Efficiency Rating', value: `${Math.round(metrics.efficiencyScore)}%`, desc: 'Composite service speed score', icon: <TrendingUp className="w-5 h-5 text-indigo-400" /> },
          { label: 'Avg Delivery Speed', value: metrics.avgDeliveryTime, desc: 'Kitchen ready to served table', icon: <Clock className="w-5 h-5 text-orange-400" /> }
        ].map((item, idx) => (
          <Card key={idx} className="p-5 border-slate-850 bg-slate-900/40 text-left space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-[10px] text-slate-500 font-extrabold uppercase">{item.label}</span>
              {item.icon}
            </div>
            <div className="text-2xl font-extrabold font-mono text-textPearl">{item.value}</div>
            <p className="text-[10px] text-slate-500">{item.desc}</p>
          </Card>
        ))}
      </div>

      {/* Charts & Details Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Weekly Trend Visualizer */}
        <Card className="p-5 border-slate-855 bg-slate-900/20 text-left space-y-4 lg:col-span-2">
          <h3 className="font-extrabold text-sm text-textPearl uppercase tracking-wider flex items-center space-x-2">
            <BarChart2 className="w-4 h-4 text-primary" />
            <span>Weekly Orders Productivity Trend</span>
          </h3>
          <div className="h-44 flex items-end justify-between gap-2 pt-6 pl-2 pr-2">
            {weeklyTrends.map((bar, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                <div 
                  style={{ height: `${bar.value}%` }} 
                  className="w-full bg-gradient-to-t from-primary/20 to-primary/80 border border-primary/30 rounded-t-lg transition-all duration-500 hover:brightness-125"
                />
                <span className="text-[10px] font-bold text-slate-550">{bar.day}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Incidents & Tips */}
        <Card className="p-5 border-slate-855 bg-slate-900/20 text-left space-y-4">
          <h3 className="font-extrabold text-sm text-textPearl uppercase tracking-wider flex items-center space-x-2">
            <Heart className="w-4 h-4 text-emerald-500" />
            <span>Rating & Incidents</span>
          </h3>
          <div className="space-y-3 font-semibold text-slate-400">
            <div className="flex justify-between border-b border-slate-800/40 pb-2">
              <span>Incident Response Rate:</span>
              <span className="font-bold text-slate-200">{metrics.incidentSuccessRate}%</span>
            </div>
            <div className="flex justify-between border-b border-slate-800/40 pb-2">
              <span>Repeat Diner Satisfaction:</span>
              <span className="font-bold text-emerald-450">{metrics.repeatCustomerSatis}</span>
            </div>
            <div className="flex justify-between border-b border-slate-800/40 pb-2">
              <span>Average Response Speed:</span>
              <span className="font-bold text-slate-200">{metrics.avgResponseTime}</span>
            </div>
            <div className="flex justify-between border-b border-slate-800/40 pb-2">
              <span>Estimated Shift Tips:</span>
              <span className="font-bold text-slate-200">{formatPrice(metrics.tipsEarned)}</span>
            </div>
            <div className="flex justify-between">
              <span>SLA Target Hits:</span>
              <span className="font-bold text-slate-200">
                {metrics.ordersServed > 0 
                  ? `${Math.round(((metrics.ordersServed - metrics.lateDeliveries) / metrics.ordersServed) * 100)}%` 
                  : '100%'}
              </span>
            </div>
          </div>
        </Card>
      </div>

      {/* Recent Tables Served */}
      <Card className="p-5 border-slate-855 bg-slate-900/20 text-left space-y-4">
        <h3 className="font-extrabold text-sm text-textPearl uppercase tracking-wider flex items-center space-x-2">
          <Award className="w-4 h-4 text-primary" />
          <span>Recent Tables Served History</span>
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-[11px] text-slate-400 font-semibold border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-500 text-[9px] uppercase">
                <th className="py-2 text-left">Order ID</th>
                <th className="py-2 text-left">Table</th>
                <th className="py-2 text-left">Guest Count</th>
                <th className="py-2 text-left">Grand Total</th>
                <th className="py-2 text-left">Settle Date</th>
                <th className="py-2 text-left">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40">
              {metrics.waiterOrders.slice(0, 10).map((o: any) => (
                <tr key={o.orderId} className="hover:bg-slate-950/20">
                  <td className="py-2.5 font-mono text-slate-300">#{o.orderId.substring(0, 12)}</td>
                  <td className="py-2.5 text-slate-200 font-bold">Table {o.tableNumber}</td>
                  <td className="py-2.5">{o.guestsCount || 2}</td>
                  <td className="py-2.5 text-emerald-450">{formatPrice(o.total)}</td>
                  <td className="py-2.5">{o.createdAt ? new Date(o.createdAt).toLocaleDateString() : '—'}</td>
                  <td className="py-2.5 text-slate-350">{o.status}</td>
                </tr>
              ))}
              {metrics.waiterOrders.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-4 text-center text-slate-600">No tables served yet in this shift.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default WaiterPerformancePage;
