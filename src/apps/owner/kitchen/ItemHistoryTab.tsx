import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../../../config/firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import { useAuth } from '../../../context/AuthContext';
import Card from '../../../components/ui/Card/Card';
import { Search, Flame, BarChart2, CheckCircle } from 'lucide-react';

interface IItemHistoryTabProps {
  orders: any[];
  menuItems: any[];
}

export const ItemHistoryTab: React.FC<IItemHistoryTabProps> = ({ orders, menuItems }) => {
  const { user } = useAuth();
  const [historyList, setHistoryList] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Real-time listener for prepared batches history (to get historical prepared/waste volumes)
  useEffect(() => {
    if (!user?.tenantId) return;

    const colRef = collection(db, 'restaurants', user.tenantId, 'preparedBatchesHistory');
    const unsub = onSnapshot(colRef, (snap) => {
      const list: any[] = [];
      snap.forEach(doc => {
        list.push({ id: doc.id, ...doc.data() });
      });
      setHistoryList(list);
    }, (err) => {
      console.error('History read error in ItemHistory:', err);
    });

    return () => unsub();
  }, [user?.tenantId]);

  // Calculations per item
  const itemMetrics = useMemo(() => {
    return menuItems.map(menuItem => {
      const isBatch = menuItem.preparationMethod === 'batch' || menuItem.productionMode === 'Batch Production';
      
      // Calculate orders and quantities served
      let totalOrders = 0;
      let totalQty = 0;
      let prepTimesSum = 0;
      let prepTimesCount = 0;
      const hourlyCounts: Record<number, number> = {};

      orders.forEach(order => {
        const matchingItem = order.items?.find((i: any) => i.itemId === menuItem.id);
        if (matchingItem) {
          totalOrders += 1;
          totalQty += matchingItem.count;

          // Estimate kitchen duration (from createdAt to readyAt)
          if (order.createdAt && order.readyAt) {
            const duration = (new Date(order.readyAt).getTime() - new Date(order.createdAt).getTime()) / 60000;
            if (duration > 0) {
              prepTimesSum += duration;
              prepTimesCount += 1;
            }
          }

          // Hourly distribution
          if (order.createdAt) {
            const hr = new Date(order.createdAt).getHours();
            hourlyCounts[hr] = (hourlyCounts[hr] || 0) + matchingItem.count;
          }
        }
      });

      const avgPrepTime = prepTimesCount > 0 ? (prepTimesSum / prepTimesCount) : 0;

      // Peak hour calculation
      let peakHour = '—';
      let maxHourCount = 0;
      Object.entries(hourlyCounts).forEach(([hrStr, count]) => {
        if (count > maxHourCount) {
          maxHourCount = count;
          const hrNum = Number(hrStr);
          const ampm = hrNum >= 12 ? 'PM' : 'AM';
          const displayHr = hrNum % 12 === 0 ? 12 : hrNum % 12;
          peakHour = `${displayHr}:00 ${ampm}`;
        }
      });

      // Calculate batch preparations and waste from history logs
      let batchPrepared = 0;
      let waste = 0;

      historyList.forEach(hist => {
        if (hist.itemId === menuItem.id) {
          if (hist.type === 'waste') {
            waste += hist.portionsDiscarded || 0;
          } else {
            batchPrepared += hist.portionsAdded || 0;
          }
        }
      });

      // Batch consumed = (Batch prepared) - (Waste portions) - (Current portions)
      const batchConsumed = isBatch 
        ? Math.max(0, batchPrepared - waste - (menuItem.availableServings ?? 0))
        : 0;

      return {
        id: menuItem.id,
        name: menuItem.name,
        isBatch,
        totalOrders,
        totalQty,
        avgPrepTime,
        batchPrepared,
        batchConsumed,
        waste,
        currentStock: menuItem.availableServings ?? 0,
        peakHour,
        lastPreparedAt: menuItem.lastPreparedAt || null
      };
    });
  }, [menuItems, orders, historyList]);

  // Filtered items
  const filteredMetrics = useMemo(() => {
    return itemMetrics.filter(item =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [itemMetrics, searchTerm]);

  const formatTimestamp = (isoString?: string) => {
    if (!isoString) return 'Never';
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return 'Never';
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' · ' + date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  return (
    <div className="space-y-4 text-left select-none">
      {/* Action Header */}
      <Card className="p-4 border-slate-850 bg-slate-900/35 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search menu items..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-955 border border-slate-850 rounded-xl text-textPearl outline-none focus:border-primary/50"
          />
        </div>
        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
          {filteredMetrics.length} total items tracked
        </span>
      </Card>

      {/* Grid view / Table */}
      <Card className="border-slate-850 bg-slate-900/35 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 border-b border-slate-850 text-slate-400 font-extrabold uppercase tracking-widest text-[9px]">
              <tr>
                <th className="px-4 py-3.5">Menu Item Name</th>
                <th className="px-4 py-3.5 text-center">Type</th>
                <th className="px-4 py-3.5 text-center">Total Orders</th>
                <th className="px-4 py-3.5 text-center">Qty Served</th>
                <th className="px-4 py-3.5 text-center">Avg Prep Time</th>
                <th className="px-4 py-3.5 text-center">Batch Prepared</th>
                <th className="px-4 py-3.5 text-center">Batch Consumed</th>
                <th className="px-4 py-3.5 text-center text-red-400">Waste</th>
                <th className="px-4 py-3.5 text-center">Current Stock</th>
                <th className="px-4 py-3.5 text-center">Peak Hour</th>
                <th className="px-4 py-3.5">Last Prepared</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850">
              {filteredMetrics.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-slate-500 font-semibold">
                    No matching items found.
                  </td>
                </tr>
              ) : (
                filteredMetrics.map(item => (
                  <tr key={item.id} className="hover:bg-slate-900/25 transition-colors">
                    <td className="px-4 py-4 font-bold text-textPearl">
                      {item.name}
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded border ${
                        item.isBatch
                          ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-450'
                          : 'bg-blue-500/10 border-blue-500/20 text-blue-400'
                      }`}>
                        {item.isBatch ? 'Batch Prep' : 'On Demand'}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center font-bold text-slate-300">{item.totalOrders}</td>
                    <td className="px-4 py-4 text-center font-bold text-slate-350">{item.totalQty}</td>
                    <td className="px-4 py-4 text-center font-mono font-bold text-primary">
                      {item.avgPrepTime > 0 ? `${item.avgPrepTime.toFixed(1)}m` : '—'}
                    </td>
                    <td className="px-4 py-4 text-center font-mono text-slate-400">
                      {item.isBatch ? `+${item.batchPrepared}` : '—'}
                    </td>
                    <td className="px-4 py-4 text-center font-mono text-slate-400">
                      {item.isBatch ? `-${item.batchConsumed}` : '—'}
                    </td>
                    <td className="px-4 py-4 text-center font-mono text-red-400 font-semibold">
                      {item.isBatch && item.waste > 0 ? `-${item.waste}` : '—'}
                    </td>
                    <td className="px-4 py-4 text-center font-mono font-extrabold text-slate-300">
                      {item.isBatch ? `${item.currentStock} portions` : '—'}
                    </td>
                    <td className="px-4 py-4 text-center font-medium text-slate-400">{item.peakHour}</td>
                    <td className="px-4 py-4 font-mono text-[10px] text-slate-450">{formatTimestamp(item.lastPreparedAt)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
export default ItemHistoryTab;
