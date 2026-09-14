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
    <div className="space-y-4 text-left select-none font-sans">
      {/* Search & Counter Surface */}
      <div className="p-4 bg-white border border-[#E3DED5] rounded-xl shadow-[0_1px_4px_rgba(30,30,20,0.05)] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5F6762]" />
          <input
            type="text"
            placeholder="Search menu items..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-white border border-[#E3DED5] rounded-lg text-[#18201D] placeholder:text-[#7A817C] outline-none focus:border-[#13241F]"
          />
        </div>
        <span className="text-[11px] text-[#5F6762] font-semibold tracking-wider">
          {filteredMetrics.length} TOTAL ITEMS TRACKED
        </span>
      </div>

      {/* Table Surface */}
      <div className="bg-white border border-[#E3DED5] rounded-lg shadow-[0_1px_4px_rgba(30,30,20,0.05)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#13241F] border-b border-[#1E3B33] text-[#FFFFFF] font-semibold uppercase tracking-[0.05em] text-[11px]">
              <tr>
                <th className="px-4 py-3.5 text-[#FFFFFF]">Menu Item Name</th>
                <th className="px-4 py-3.5 text-center text-[#FFFFFF]">Type</th>
                <th className="px-4 py-3.5 text-center text-[#FFFFFF]">Total Orders</th>
                <th className="px-4 py-3.5 text-center text-[#FFFFFF]">Qty Served</th>
                <th className="px-4 py-3.5 text-center text-[#FFFFFF]">Avg Prep Time</th>
                <th className="px-4 py-3.5 text-center text-[#DDE5E0]">Batch Prepared</th>
                <th className="px-4 py-3.5 text-center text-[#DDE5E0]">Batch Consumed</th>
                <th className="px-4 py-3.5 text-center text-[#DDE5E0]">Waste</th>
                <th className="px-4 py-3.5 text-center text-[#FFFFFF]">Current Stock</th>
                <th className="px-4 py-3.5 text-center text-[#FFFFFF]">Peak Hour</th>
                <th className="px-4 py-3.5 text-[#FFFFFF]">Last Prepared</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E3DED5]">
              {filteredMetrics.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-[#5F6762] font-semibold bg-white">
                    No matching items found.
                  </td>
                </tr>
              ) : (
                filteredMetrics.map((item, idx) => {
                  const isLow = item.currentStock > 0 && item.currentStock <= 10;
                  const isOut = item.currentStock === 0;

                  return (
                    <tr 
                      key={item.id} 
                      className={`transition-colors hover:bg-[#F3EFE8] ${
                        idx % 2 === 0 ? 'bg-white' : 'bg-[#FBF9F5]'
                      }`}
                    >
                      <td className="px-4 py-4 font-semibold text-[#18201D]">
                        {item.name}
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${
                          item.isBatch
                            ? 'bg-[#E8F5EE] border-[#287A55]/30 text-[#287A55]'
                            : 'bg-[#E8F3ED] border-[#CFE5D8] text-[#287A55]'
                        }`}>
                          {item.isBatch ? 'Batch Prep' : 'On Demand'}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center font-semibold text-[#18201D]">{item.totalOrders}</td>
                      <td className="px-4 py-4 text-center font-semibold text-[#39423D]">{item.totalQty}</td>
                      <td className="px-4 py-4 text-center font-mono font-bold text-[#A66B00]">
                        {item.avgPrepTime > 0 ? `${item.avgPrepTime.toFixed(1)}m` : '—'}
                      </td>
                      <td className="px-4 py-4 text-center font-mono text-[#39423D]">
                        {item.isBatch ? `+${item.batchPrepared}` : '—'}
                      </td>
                      <td className="px-4 py-4 text-center font-mono text-[#5F6762]">
                        {item.isBatch ? `-${item.batchConsumed}` : '—'}
                      </td>
                      <td className="px-4 py-4 text-center font-mono text-[#C7463A] font-semibold">
                        {item.isBatch && item.waste > 0 ? `-${item.waste}` : '—'}
                      </td>
                      <td className="px-4 py-4 text-center font-mono font-semibold">
                        {item.isBatch ? (
                          <span className={isOut ? 'text-[#C7463A]' : isLow ? 'text-[#D79A24]' : 'text-[#287A55]'}>
                            {item.currentStock} portions
                          </span>
                        ) : (
                          <span className="text-[#5F6762]">—</span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-center font-medium text-[#5F6762]">{item.peakHour}</td>
                      <td className="px-4 py-4 font-mono text-[11px] text-[#5F6762]">{formatTimestamp(item.lastPreparedAt)}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
export default ItemHistoryTab;
