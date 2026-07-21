import React, { useMemo, useState } from 'react';
import { useWaiterData } from './useWaiterData';
import Card from '../../../components/ui/Card/Card';
import LoadingSpinner from '../../../components/ui/LoadingSpinner/LoadingSpinner';
import { Clock, Activity, AlertCircle } from 'lucide-react';

interface ITimelineEventItem {
  timestamp: string;
  orderId: string;
  tableNumber: string;
  type: string;
  title: string;
  performedBy: string;
  description?: string;
}

export const WaiterTimelinePage: React.FC = () => {
  const { orders, isLoading } = useWaiterData();

  // Filters State
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedWaiter, setSelectedWaiter] = useState('all');
  const [selectedChef, setSelectedChef] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');

  const timelineEvents = useMemo((): ITimelineEventItem[] => {
    const events: ITimelineEventItem[] = [];

    orders.forEach(order => {
      if (order.timeline && Array.isArray(order.timeline)) {
        order.timeline.forEach((event: any) => {
          events.push({
            timestamp: event.timestamp || order.createdAt,
            orderId: order.orderId,
            tableNumber: String(order.tableNumber),
            type: event.type || 'EVENT',
            title: event.title || event.type,
            performedBy: event.performedBy || 'System',
            description: event.description || ''
          });
        });
      }
    });

    return events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [orders]);

  const uniqueStatuses = useMemo(() => {
    const set = new Set<string>();
    timelineEvents.forEach(e => { if (e.type) set.add(e.type); });
    return Array.from(set).sort();
  }, [timelineEvents]);

  const uniqueWaiters = useMemo(() => {
    const set = new Set<string>();
    orders.forEach(o => { if (o.waiterName) set.add(o.waiterName); });
    return Array.from(set).sort();
  }, [orders]);

  const uniqueChefs = useMemo(() => {
    const set = new Set<string>();
    orders.forEach(o => { if (o.assignedChefName) set.add(o.assignedChefName); });
    return Array.from(set).sort();
  }, [orders]);

  const filteredEvents = useMemo(() => {
    return timelineEvents.filter(ev => {
      const order = orders.find(o => o.orderId === ev.orderId);
      
      const matchesStatus = selectedStatus === 'all' || ev.type === selectedStatus;
      const matchesWaiter = selectedWaiter === 'all' || (order && order.waiterName === selectedWaiter);
      const matchesChef = selectedChef === 'all' || (order && order.assignedChefName === selectedChef);

      let matchesDate = true;
      if (dateFilter !== 'all') {
        const evDate = new Date(ev.timestamp);
        const now = new Date();
        if (dateFilter === 'today') {
          matchesDate = evDate.toDateString() === now.toDateString();
        } else if (dateFilter === 'yesterday') {
          const yesterday = new Date();
          yesterday.setDate(now.getDate() - 1);
          matchesDate = evDate.toDateString() === yesterday.toDateString();
        }
      }

      return matchesStatus && matchesWaiter && matchesChef && matchesDate;
    });
  }, [timelineEvents, selectedStatus, selectedWaiter, selectedChef, dateFilter, orders]);

  const getEventColors = (type: string) => {
    switch (type) {
      case 'DELIVERED':
      case 'COMPLETED':
      case 'PAID':
      case 'PAYMENT_COMPLETED':
        return { ring: 'ring-emerald-500/20', bg: 'bg-emerald-500', text: 'text-emerald-450' };
      case 'READY':
      case 'PICKED_UP':
        return { ring: 'ring-blue-500/20', bg: 'bg-blue-500', text: 'text-blue-400 font-extrabold' };
      case 'PREPARING':
      case 'ACCEPTED':
        return { ring: 'ring-orange-500/20', bg: 'bg-orange-500', text: 'text-orange-400 font-extrabold' };
      case 'PLACED':
      case 'SENT_TO_KITCHEN':
        return { ring: 'ring-yellow-500/20', bg: 'bg-yellow-550', text: 'text-yellow-450' };
      case 'CANCELLED':
        return { ring: 'ring-rose-500/20', bg: 'bg-rose-500', text: 'text-rose-400' };
      default:
        return { ring: 'ring-slate-500/20', bg: 'bg-slate-550', text: 'text-slate-400' };
    }
  };

  const formatTime = (isoStr: string) => {
    try {
      const d = new Date(isoStr);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' · ' + d.toLocaleDateString([], { month: 'short', day: 'numeric' });
    } catch (e) {
      return '—';
    }
  };

  if (isLoading) {
    return (
      <div className="h-96 flex items-center justify-center">
        <LoadingSpinner label="Synchronizing with KDS event feed..." />
      </div>
    );
  }

  return (
    <div className="space-y-6 text-left select-none pb-24">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-slate-800 rounded-xl border border-slate-700">
            <Activity className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-extrabold text-textPearl">Kitchen Timeline</h1>
            <p className="text-xs text-mutedAsh font-semibold">Real-time chronologies of KDS operational stages, handovers, and pickup statuses.</p>
          </div>
        </div>
      </div>

      {/* Filters Toolbar */}
      <Card className="p-4 bg-slate-900/40 border-slate-850 grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div className="space-y-1">
          <label className="text-[10px] text-slate-500 font-extrabold uppercase">Event Status</label>
          <select
            value={selectedStatus}
            onChange={e => setSelectedStatus(e.target.value)}
            className="w-full bg-slate-955 border border-slate-800 rounded-xl p-2 text-xs text-slate-300 outline-none animate-none"
          >
            <option value="all">All Events</option>
            {uniqueStatuses.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] text-slate-500 font-extrabold uppercase">Waiter</label>
          <select
            value={selectedWaiter}
            onChange={e => setSelectedWaiter(e.target.value)}
            className="w-full bg-slate-955 border border-slate-800 rounded-xl p-2 text-xs text-slate-300 outline-none"
          >
            <option value="all">All Waiters</option>
            {uniqueWaiters.map(w => (
              <option key={w} value={w}>{w}</option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] text-slate-500 font-extrabold uppercase">Chef</label>
          <select
            value={selectedChef}
            onChange={e => setSelectedChef(e.target.value)}
            className="w-full bg-slate-955 border border-slate-800 rounded-xl p-2 text-xs text-slate-300 outline-none"
          >
            <option value="all">All Chefs</option>
            {uniqueChefs.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] text-slate-500 font-extrabold uppercase">Time Period</label>
          <select
            value={dateFilter}
            onChange={e => setDateFilter(e.target.value)}
            className="w-full bg-slate-955 border border-slate-800 rounded-xl p-2 text-xs text-slate-300 outline-none"
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="yesterday">Yesterday</option>
          </select>
        </div>
      </Card>

      {filteredEvents.length === 0 ? (
        <Card className="p-12 text-center border-slate-850 bg-slate-900/10 text-slate-500 rounded-3xl">
          <AlertCircle className="w-10 h-10 text-slate-700 mx-auto mb-3" />
          <p className="text-sm font-semibold">No operational timeline events match the filters.</p>
        </Card>
      ) : (
        <Card className="p-6 border-slate-850 bg-slate-900/20 rounded-2xl">
          <div className="relative border-l border-slate-805 ml-3.5 space-y-6">
            {filteredEvents.slice(0, 50).map((event, idx) => {
              const colors = getEventColors(event.type);
              return (
                <div key={idx} className="relative pl-6 text-xs group">
                  {/* Color-coded Node */}
                  <span className={`absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full ${colors.bg} border-2 border-slate-900 ring-2 ${colors.ring} group-hover:scale-125 transition-transform`} />
                  
                  <div className="space-y-1">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <span className="text-[10px] text-slate-500 font-extrabold flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-550" />
                        {formatTime(event.timestamp)}
                      </span>
                      <span className="text-[9px] text-slate-500 font-mono">
                        Order: <strong className="text-slate-400">#{event.orderId.substring(0, 12)}</strong> · Table {event.tableNumber}
                      </span>
                    </div>
                    <h4 className={`font-extrabold text-sm ${colors.text} leading-tight`}>{event.title}</h4>
                    {event.description && (
                      <p className="text-slate-400 text-[11px] leading-relaxed">{event.description}</p>
                    )}
                    <div className="text-[9px] text-slate-550">
                      Performed by: <strong className="text-slate-455 font-bold">{event.performedBy}</strong>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
};

export default WaiterTimelinePage;
