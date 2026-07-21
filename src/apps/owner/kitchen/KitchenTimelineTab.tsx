import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../../../config/firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import { useAuth } from '../../../context/AuthContext';
import Card from '../../../components/ui/Card/Card';
import { Clock, Info, CheckCircle2, AlertTriangle, Play, Package, UserCheck, CreditCard } from 'lucide-react';

interface IKitchenTimelineTabProps {
  orders: any[];
}

export const KitchenTimelineTab: React.FC<IKitchenTimelineTabProps> = ({ orders }) => {
  const { user } = useAuth();
  const [batchHistory, setBatchHistory] = useState<any[]>([]);

  // Listen to prepared batches history for refills & waste logs
  useEffect(() => {
    if (!user?.tenantId) return;
    const colRef = collection(db, 'restaurants', user.tenantId, 'preparedBatchesHistory');
    const unsub = onSnapshot(colRef, (snap) => {
      const list: any[] = [];
      snap.forEach(doc => {
        list.push({ id: doc.id, ...doc.data() });
      });
      setBatchHistory(list);
    }, (err) => {
      console.error('Batch history timeline error:', err);
    });
    return () => unsub();
  }, [user?.tenantId]);

  // Aggregate and sort events
  const timelineEvents = useMemo(() => {
    const list: any[] = [];

    // 1. Gather events from order timelines
    orders.forEach(order => {
      if (order.timeline && Array.isArray(order.timeline)) {
        order.timeline.forEach((evt: any) => {
          list.push({
            id: `${order.orderId}-${evt.timestamp}-${evt.type}`,
            orderId: order.orderId,
            timestamp: evt.timestamp,
            title: evt.title || evt.type,
            description: evt.description || `Order status advanced to ${evt.type}.`,
            performedBy: evt.performedBy || 'System',
            type: evt.type
          });
        });
      }
    });

    // 2. Gather events from prepared batches history
    batchHistory.forEach(hist => {
      const isWaste = hist.type === 'waste';
      list.push({
        id: hist.id,
        orderId: null,
        timestamp: hist.timestamp,
        title: isWaste ? 'Waste Recorded ⚠️' : 'Batch Refilled 🥞',
        description: isWaste 
          ? `Discarded ${hist.portionsDiscarded} portions of "${hist.itemName}" due to expiry.`
          : `Prepared new batch of "${hist.itemName}" adding ${hist.portionsAdded} portions. Required ingredients deducted.`,
        performedBy: hist.preparedBy || 'Kitchen Chef',
        type: isWaste ? 'WASTE' : 'BATCH_REFILL'
      });
    });

    // Sort descending by time
    return list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [orders, batchHistory]);

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'NEW':
      case 'PLACED':
        return <Info className="w-4 h-4 text-blue-400" />;
      case 'ACCEPTED':
        return <CheckCircle2 className="w-4 h-4 text-purple-400" />;
      case 'CHEF_ASSIGNED':
        return <UserCheck className="w-4 h-4 text-violet-400" />;
      case 'PREPARING':
        return <Play className="w-4 h-4 text-orange-400 fill-current" />;
      case 'READY':
        return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
      case 'BATCH_REFILL':
        return <Package className="w-4 h-4 text-emerald-450" />;
      case 'WASTE':
        return <AlertTriangle className="w-4 h-4 text-red-400" />;
      case 'COMPLETED':
      case 'PAID':
        return <CreditCard className="w-4 h-4 text-teal-400" />;
      default:
        return <Clock className="w-4 h-4 text-slate-500" />;
    }
  };

  const formatTimestamp = (isoString?: string) => {
    if (!isoString) return '—';
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return '—';
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' · ' + date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="space-y-4 text-left select-none max-w-4xl mx-auto">
      <Card className="p-4 border-slate-850 bg-slate-900/35 flex justify-between items-center">
        <h4 className="font-extrabold text-sm text-textPearl">Kitchen Activity Log</h4>
        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{timelineEvents.length} events logged</span>
      </Card>

      <Card className="p-6 border-slate-850 bg-slate-900/35">
        <div className="relative border-l border-slate-850 pl-6 space-y-6">
          {timelineEvents.length === 0 ? (
            <p className="text-slate-500 font-semibold text-center py-6">No kitchen timeline events recorded yet.</p>
          ) : (
            timelineEvents.slice(0, 50).map((evt) => (
              <div key={evt.id} className="relative group">
                {/* Bullet Icon indicator */}
                <div className="absolute -left-[35px] top-0.5 w-6 h-6 rounded-lg bg-slate-950 flex items-center justify-center border border-slate-850 group-hover:border-primary/45 transition-colors">
                  {getEventIcon(evt.type)}
                </div>

                {/* Event Card Info */}
                <div className="space-y-1">
                  <div className="flex flex-wrap items-baseline gap-2">
                    <span className="font-extrabold text-textPearl text-xs">{evt.title}</span>
                    {evt.orderId && (
                      <span className="font-mono text-[10px] text-primary/75 font-semibold">
                        #{evt.orderId}
                      </span>
                    )}
                    <span className="font-mono text-[9px] text-slate-550 ml-auto">
                      {formatTimestamp(evt.timestamp)}
                    </span>
                  </div>
                  <p className="text-slate-400 text-xs">{evt.description}</p>
                  <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">
                    Performed by: {evt.performedBy}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
};
export default KitchenTimelineTab;
