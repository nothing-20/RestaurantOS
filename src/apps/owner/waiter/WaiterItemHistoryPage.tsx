import React, { useState, useMemo } from 'react';
import { useWaiterData } from './useWaiterData';
import Card from '../../../components/ui/Card/Card';
import Badge from '../../../components/ui/Badge/Badge';
import LoadingSpinner from '../../../components/ui/LoadingSpinner/LoadingSpinner';
import { formatPrice } from '../../../utils/format';
import { Search, Flame, Coffee, BarChart2 } from 'lucide-react';

export const WaiterItemHistoryPage: React.FC = () => {
  const { orders, menuItems, isLoading } = useWaiterData();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const categories = useMemo(() => {
    const list = new Set<string>();
    menuItems.forEach(i => { if (i.category) list.add(i.category); });
    return Array.from(list).sort();
  }, [menuItems]);

  const itemMetrics = useMemo(() => {
    // 1. Gather raw counts
    const rawMetrics = menuItems.map(menuItem => {
      let totalServed = 0;
      let totalRevenue = 0;
      let cancelledCount = 0;
      let returnedCount = 0;
      let prepTimesSum = 0;
      let prepTimesCount = 0;

      const hourCounts: Record<number, number> = {};
      const tableCounts: Record<string, number> = {};
      const staffSet = new Set<string>();

      orders.forEach(order => {
        const match = order.items?.find((i: any) => i.itemId === menuItem.id || i.menuItemId === menuItem.id);
        if (match) {
          if (order.status === 'CANCELLED') {
            cancelledCount += match.count;
          } else {
            totalServed += match.count;
            totalRevenue += match.pricePerUnit ? (match.pricePerUnit * match.count) : (menuItem.price * match.count);
            
            // Hour profiling
            if (order.createdAt) {
              const hr = new Date(order.createdAt).getHours();
              hourCounts[hr] = (hourCounts[hr] || 0) + match.count;
            }

            // Table profiling
            if (order.tableNumber) {
              const tbl = String(order.tableNumber);
              tableCounts[tbl] = (tableCounts[tbl] || 0) + match.count;
            }

            // Staff profiling
            if (order.waiterName) staffSet.add(order.waiterName);
            if (order.assignedChefName) staffSet.add(order.assignedChefName);
          }

          const readyAt = order.readyAt;
          if (order.createdAt && readyAt) {
            const diff = (new Date(readyAt).getTime() - new Date(order.createdAt).getTime()) / 60000;
            if (diff > 0) {
              prepTimesSum += diff;
              prepTimesCount += 1;
            }
          }
        }
      });

      const avgPrep = prepTimesCount > 0 ? Math.round(prepTimesSum / prepTimesCount) : 0;

      // Peak sell hour computation
      let peakHour = -1;
      let maxHourCount = 0;
      Object.entries(hourCounts).forEach(([hr, cnt]) => {
        if (cnt > maxHourCount) {
          maxHourCount = cnt;
          peakHour = Number(hr);
        }
      });
      const peakHourStr = peakHour !== -1 
        ? `${peakHour === 0 ? 12 : peakHour > 12 ? peakHour - 12 : peakHour} ${peakHour >= 12 ? 'PM' : 'AM'}` 
        : '—';

      // Top tables ordering
      const topTables = Object.entries(tableCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([tbl]) => `T-${tbl}`)
        .join(', ') || '—';

      const activeStaff = Array.from(staffSet).slice(0, 3).join(', ') || '—';

      return {
        ...menuItem,
        totalServed,
        totalRevenue,
        cancelledCount,
        returnedCount,
        avgPrep,
        peakHourStr,
        topTables,
        activeStaff
      };
    });

    // 2. Assign popularity rank
    const sorted = [...rawMetrics].sort((a, b) => b.totalServed - a.totalServed);
    return rawMetrics.map(item => {
      const idx = sorted.findIndex(s => s.id === item.id);
      return {
        ...item,
        rank: idx !== -1 ? idx + 1 : '—'
      };
    });
  }, [menuItems, orders]);

  const filteredMetrics = useMemo(() => {
    return itemMetrics.filter(m => {
      const matchesSearch = m.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || m.category === selectedCategory;
      return matchesSearch && matchesCategory;
    }).sort((a, b) => b.totalServed - a.totalServed);
  }, [itemMetrics, searchTerm, selectedCategory]);

  if (isLoading) {
    return (
      <div className="h-96 flex items-center justify-center">
        <LoadingSpinner label="Loading items database..." />
      </div>
    );
  }

  return (
    <div className="space-y-6 text-left select-none pb-24">
      <div>
        <h1 className="text-2xl font-display font-extrabold text-[#18201D]">Item History</h1>
        <p className="text-xs text-[#5F6875] font-semibold">Track individual item preparation speed, popularity, and sales metrics.</p>
      </div>

      {/* Filters */}
      <Card className="p-4 bg-white border border-[#E3DED5] flex flex-col md:flex-row gap-3 rounded-2xl shadow-xs">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#667085]" />
          <input
            type="text"
            placeholder="Search item name..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-[#F7F4EE] border border-[#E3DED5] rounded-xl text-[#18201D] placeholder:text-[#8D9B95] outline-none focus:border-primary"
          />
        </div>
        <select
          value={selectedCategory}
          onChange={e => setSelectedCategory(e.target.value)}
          className="w-48 bg-[#F7F4EE] border border-[#E3DED5] rounded-xl p-2 text-xs text-[#18201D] outline-none focus:border-primary"
        >
          <option value="all">All Categories</option>
          {categories.map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </Card>

      {/* Item Metrics Cards */}
      {filteredMetrics.length === 0 ? (
        <Card className="p-12 text-center border border-dashed border-[#E3DED5] bg-white text-[#5F6875] rounded-3xl">
          <Coffee className="w-10 h-10 text-[#8D9B95] mx-auto mb-3" />
          <p className="text-sm font-semibold">No items matched your search query.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMetrics.map(metric => (
            <Card key={metric.id} className="p-5 border border-[#E3DED5] bg-white rounded-2xl text-xs space-y-4 shadow-xs">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-extrabold text-sm text-[#18201D]">{metric.name}</h3>
                    {metric.rank === 1 && <Flame className="w-3.5 h-3.5 text-orange-500" />}
                  </div>
                  <span className="text-[10px] text-[#667085] font-bold uppercase">{metric.category}</span>
                </div>
                <Badge variant="muted">{formatPrice(metric.price)}</Badge>
              </div>

              <div className="grid grid-cols-2 gap-3 bg-[#F7F4EE] p-3 rounded-xl border border-[#E3DED5] text-[#5F6875]">
                <div>
                  <span className="block text-[9px] text-[#667085] uppercase font-extrabold">Portions Served:</span>
                  <span className="text-base font-extrabold text-[#18201D] font-mono">{metric.totalServed}</span>
                </div>
                <div>
                  <span className="block text-[9px] text-[#667085] uppercase font-extrabold">Revenue:</span>
                  <span className="text-base font-extrabold text-emerald-700 font-mono">{formatPrice(metric.totalRevenue)}</span>
                </div>
              </div>

              <div className="space-y-1.5 text-[10px] text-[#5F6875] font-semibold border-t border-[#E3DED5] pt-3">
                <div className="flex justify-between">
                  <span>Popularity Rank:</span>
                  <span className="text-[#18201D] font-extrabold">#{metric.rank}</span>
                </div>
                <div className="flex justify-between">
                  <span>Peak Sell Hour:</span>
                  <span className="text-[#18201D]">{metric.peakHourStr}</span>
                </div>
                <div className="flex justify-between">
                  <span>Top Tables:</span>
                  <span className="text-[#18201D]">{metric.topTables}</span>
                </div>
                <div className="flex justify-between">
                  <span>Active Staff:</span>
                  <span className="text-[#18201D] truncate max-w-[150px]" title={metric.activeStaff}>
                    {metric.activeStaff}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Avg Prep Time:</span>
                  <span className="text-[#18201D]">{metric.avgPrep > 0 ? `${metric.avgPrep} mins` : '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Cancelled/Returned:</span>
                  <span className="text-[#18201D] font-mono">
                    {metric.cancelledCount} / {metric.returnedCount}
                  </span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default WaiterItemHistoryPage;
