import React, { useEffect, useState } from 'react';
import { IKdsOrder, TPriority } from '../../../features/kitchen-dashboard/types';
import {
  getElapsedSeconds,
  formatElapsedSeconds,
  getElapsedColor,
} from '../../../features/kitchen-dashboard/utils/kitchenMetrics';
import OrderTimeline from './OrderTimeline';
import Card from '../../../components/ui/Card/Card';
import { Check, Timer, ChevronDown, ChevronUp, User } from 'lucide-react';

// ─── Status Configuration ─────────────────────────────────────────────────────

export const STATUS_CONFIG: Record<string, { label: string; color: string; dot: string }> = {
  NEW:       { label: 'New',       color: 'border-blue-500/40 bg-blue-950/20 text-blue-400',      dot: 'bg-blue-500' },
  PLACED:    { label: 'New',       color: 'border-blue-500/40 bg-blue-950/20 text-blue-400',      dot: 'bg-blue-500' },
  ACCEPTED:  { label: 'Accepted',  color: 'border-purple-500/40 bg-purple-950/20 text-purple-400', dot: 'bg-purple-500' },
  PREPARING: { label: 'Preparing', color: 'border-orange-500/40 bg-orange-950/20 text-orange-400', dot: 'bg-orange-500 animate-pulse' },
  PAUSED:    { label: 'Paused',    color: 'border-amber-500/40 bg-amber-950/20 text-amber-500',   dot: 'bg-amber-500' },
  READY:     { label: 'Ready',     color: 'border-emerald-500/40 bg-emerald-950/20 text-emerald-400', dot: 'bg-emerald-500' },
  DELIVERED: { label: 'Delivered', color: 'border-slate-700 bg-slate-900/20 text-slate-400',      dot: 'bg-slate-500' },
  COMPLETED: { label: 'Completed', color: 'border-slate-700 bg-slate-900/20 text-slate-400',      dot: 'bg-slate-600' },
  ARCHIVED:  { label: 'Archived',  color: 'border-slate-800 bg-slate-955/20 text-slate-600',      dot: 'bg-slate-700' },
};

export const NEXT_STATUS: Record<string, { label: string; next: string } | null> = {
  NEW:       { label: 'Accept Order', next: 'ACCEPTED' },
  PLACED:    { label: 'Accept Order', next: 'ACCEPTED' },
  ACCEPTED:  { label: 'Start Cooking', next: 'PREPARING' },
  PREPARING: { label: 'Mark Ready ✓', next: 'READY' },
  READY:     { label: 'Mark Delivered', next: 'DELIVERED' },
  PAUSED:    null, // Handled separately
  DELIVERED: null,
  COMPLETED: null,
  ARCHIVED:  null,
};

// ─── Live Elapsed Timer ───────────────────────────────────────────────────────

const ElapsedTimer: React.FC<{ createdAt: string }> = ({ createdAt }) => {
  const [seconds, setSeconds] = useState(getElapsedSeconds(createdAt));

  useEffect(() => {
    const interval = setInterval(() => setSeconds(getElapsedSeconds(createdAt)), 1000);
    return () => clearInterval(interval);
  }, [createdAt]);

  return (
    <span className={`font-mono font-extrabold text-xs tabular-nums ${getElapsedColor(seconds)}`}>
      {formatElapsedSeconds(seconds)}
    </span>
  );
};

// ─── Props ────────────────────────────────────────────────────────────────────

interface IKitchenTicketProps {
  order: IKdsOrder;
  isSelected: boolean;
  onToggleSelect: (orderId: string) => void;
  onStatusUpdate: (orderId: string, nextStatus: string) => void;
  showBulkSelect: boolean;
  employees: any[];
  onAssignChef: (orderId: string, chefId: string, chefName: string) => void;
  onUnassignChef: (orderId: string) => void;
  onPauseOrder: (orderId: string, reason: string) => void;
  onResumeOrder: (orderId: string) => void;
  onRecallOrder: (orderId: string, reason: string) => void;
  onUpdateNotes: (orderId: string, noteType: 'kitchen' | 'chef', noteValue: string) => void;
  onUpdatePriority: (orderId: string, priority: TPriority) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

const KitchenTicket: React.FC<IKitchenTicketProps> = ({
  order,
  isSelected,
  onToggleSelect,
  onStatusUpdate,
  showBulkSelect,
  employees,
  onAssignChef,
  onUnassignChef,
  onPauseOrder,
  onResumeOrder,
  onRecallOrder,
  onUpdateNotes,
  onUpdatePriority,
}) => {
  const [timelineOpen, setTimelineOpen] = useState(false);

  const statusConf = STATUS_CONFIG[order.status] || STATUS_CONFIG['NEW'];
  const nextConf = NEXT_STATUS[order.status];
  const priority = order.priority || 'normal';
  const estimatedPrep = order.estimatedPrepTime || order.items.length * 5;
  const hasTimeline = (order.timeline?.length ?? 0) > 0;
  const isNew = order.status === 'NEW' || order.status === 'PLACED';

  return (
    <Card
      className={`flex flex-col justify-between border ${statusConf.color} rounded-2xl p-0 overflow-hidden transition-all hover:brightness-110 ${
        isNew ? 'ring-1 ring-blue-500/30 shadow-lg shadow-blue-500/5' : ''
      } ${isSelected ? 'ring-2 ring-primary/60 brightness-110' : ''}`}
    >
      {/* Header */}
      <div className="p-4 pb-3 border-b border-current border-opacity-10">
        <div className="flex items-start justify-between gap-1.5">
          <div className="flex items-start space-x-2.5">
            {showBulkSelect && (
              <button
                onClick={(e) => { e.stopPropagation(); onToggleSelect(order.orderId); }}
                className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-all ${
                  isSelected
                    ? 'bg-primary border-primary text-slate-955'
                    : 'bg-transparent border-slate-600 hover:border-primary'
                }`}
              >
                {isSelected && <Check className="w-2.5 h-2.5" strokeWidth={3} />}
              </button>
            )}
            <div>
              <div className="flex items-center space-x-2 mb-1">
                <span className="text-xs font-extrabold text-textPearl tracking-tight">
                  Table {order.tableNumber}
                </span>
                
                <select
                  value={priority}
                  onChange={(e) => {
                    e.stopPropagation();
                    onUpdatePriority(order.orderId, e.target.value as TPriority);
                  }}
                  className="text-[9px] uppercase font-extrabold tracking-widest bg-slate-950/80 border border-slate-800 rounded px-1.5 py-0.5 text-slate-300 outline-none cursor-pointer focus:border-primary/50"
                >
                  <option value="critical">💥 Critical</option>
                  <option value="high">🔴 High</option>
                  <option value="normal">🟡 Normal</option>
                  <option value="low">⚪ Low</option>
                </select>
              </div>

              <div className="flex items-center space-x-1.5">
                <span className={`w-1.5 h-1.5 rounded-full ${statusConf.dot}`} />
                <span className="text-[10px] font-bold text-current opacity-70">{statusConf.label}</span>
                <span className="text-[10px] text-slate-600">·</span>
                <span className="text-[10px] text-slate-500 font-mono">#{(order.orderId || '').substring(0, 8)}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-end space-y-1">
            <ElapsedTimer createdAt={order.createdAt} />
            <span className="text-[9px] text-slate-500 flex items-center space-x-0.5">
              <Timer className="w-2.5 h-2.5" />
              <span>~{estimatedPrep}m est.</span>
            </span>
          </div>
        </div>

        {/* Chef Assignment Section */}
        <div className="mt-2.5 pt-2.5 border-t border-current border-opacity-10">
          {order.assignedChefName ? (
            <div className="flex items-center justify-between text-[10px] bg-slate-950/40 border border-slate-850 rounded-xl px-2.5 py-1">
              <div className="flex items-center space-x-1 text-slate-300 font-semibold truncate max-w-[70%]">
                <User className="w-3 h-3 text-primary shrink-0" />
                <span className="truncate">{order.assignedChefName}</span>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); onUnassignChef(order.orderId); }}
                className="text-[9px] text-red-400 hover:text-red-300 font-extrabold uppercase px-1 py-0.5 shrink-0"
              >
                Unassign
              </button>
            </div>
          ) : (
            <select
              value=""
              onChange={(e) => {
                const chef = employees.find(emp => emp.id === e.target.value);
                if (chef) onAssignChef(order.orderId, chef.id, chef.fullName);
              }}
              className="w-full text-[10px] bg-slate-950/60 border border-slate-850 rounded-xl px-2 py-1 text-slate-400 outline-none cursor-pointer focus:border-primary/50"
            >
              <option value="" disabled>Assign Chef...</option>
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>{emp.fullName}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Items List */}
      <div className="p-4 flex-1 space-y-2">
        {order.items.map((item, idx) => (
          <div key={idx} className="flex items-start space-x-2 text-xs">
            <span className="font-extrabold text-textPearl min-w-[20px]">×{item.count}</span>
            <div className="flex-1">
              <span className="font-semibold text-slate-300">{item.name}</span>
              {item.notes && (
                <p className="text-[10px] text-amber-400 italic mt-0.5">"{item.notes}"</p>
              )}
            </div>
          </div>
        ))}

        {/* Notes Segment */}
        <div className="mt-3 pt-2.5 border-t border-current border-opacity-10 text-[10px] space-y-1 text-left">
          {order.notes && (
            <div className="text-amber-300 italic">
              <strong>Special Instructions:</strong> {order.notes}
            </div>
          )}
          {order.customerNotes && (
            <div className="text-blue-300 italic">
              <strong>Customer Notes:</strong> {order.customerNotes}
            </div>
          )}
          
          {/* Kitchen Notes */}
          <div className="flex items-start justify-between gap-1 py-0.5 group/note">
            <div className="flex-1">
              <strong className="text-slate-400">Kitchen Note:</strong>{' '}
              <span className="text-slate-300">{order.kitchenNotes || '—'}</span>
            </div>
            <button
              onClick={() => {
                const note = prompt('Enter Internal Kitchen Note:', order.kitchenNotes || '');
                if (note !== null) onUpdateNotes(order.orderId, 'kitchen', note);
              }}
              className="text-[9px] text-primary opacity-0 group-hover/note:opacity-100 font-extrabold hover:underline"
            >
              Edit
            </button>
          </div>

          {/* Chef Notes */}
          <div className="flex items-start justify-between gap-1 py-0.5 group/chefnote">
            <div className="flex-1">
              <strong className="text-slate-400">Chef Note:</strong>{' '}
              <span className="text-slate-300">{order.chefNotes || '—'}</span>
            </div>
            <button
              onClick={() => {
                const note = prompt('Enter Internal Chef Note:', order.chefNotes || '');
                if (note !== null) onUpdateNotes(order.orderId, 'chef', note);
              }}
              className="text-[9px] text-primary opacity-0 group-hover/chefnote:opacity-100 font-extrabold hover:underline"
            >
              Edit
            </button>
          </div>
        </div>
      </div>

      {/* Timeline Toggle */}
      <div className="px-4">
        <button
          onClick={() => setTimelineOpen(o => !o)}
          className="w-full flex items-center justify-between py-2 text-[10px] font-bold text-slate-500 hover:text-slate-300 transition-colors border-t border-current border-opacity-10"
        >
          <span>
            {hasTimeline
              ? `Timeline (${order.timeline!.length} events)`
              : 'Timeline (no events yet)'}
          </span>
          {timelineOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>

        {timelineOpen && (
          <div className="pb-3 pt-1">
            <OrderTimeline timeline={order.timeline || []} compact />
          </div>
        )}
      </div>

      {/* Action Button Segment */}
      <div className="px-4 pb-4">
        {order.status === 'PREPARING' ? (
          <div className="flex gap-2">
            <button
              onClick={() => onStatusUpdate(order.orderId, 'READY')}
              className="flex-1 py-2.5 rounded-xl text-xs font-extrabold uppercase tracking-wider border border-current border-opacity-20 bg-current bg-opacity-10 hover:bg-opacity-20 transition-all flex items-center justify-center space-x-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Mark Ready ✓</span>
            </button>
            <button
              onClick={() => {
                const reason = prompt('Enter reason to Pause cooking this order:', 'Waiting for ingredients');
                if (reason !== null) onPauseOrder(order.orderId, reason || 'General Pause');
              }}
              className="px-3.5 py-2.5 rounded-xl text-xs font-extrabold uppercase tracking-wider border border-orange-500/30 bg-orange-500/10 hover:bg-orange-500/25 text-orange-400 transition-all"
              title="Pause Cooking"
            >
              Pause
            </button>
          </div>
        ) : order.status === 'PAUSED' ? (
          <div className="flex flex-col gap-2">
            <div className="bg-orange-955/20 border border-orange-500/20 text-orange-400 rounded-xl p-2.5 text-[10px] italic">
              ⏸️ PAUSED: {order.pauseReason || 'No reason specified'}
              {order.pausedAt && (
                <span className="block text-[9px] text-slate-500 not-italic mt-0.5">
                  at {new Date(order.pausedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
            </div>
            <button
              onClick={() => onResumeOrder(order.orderId)}
              className="w-full py-2.5 rounded-xl text-xs font-extrabold uppercase tracking-wider border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/25 text-emerald-400 transition-all"
            >
              ▶️ Resume Cooking
            </button>
          </div>
        ) : order.status === 'READY' ? (
          <div className="flex flex-col gap-2">
            <button
              onClick={() => onStatusUpdate(order.orderId, 'DELIVERED')}
              className="w-full py-2.5 rounded-xl text-xs font-extrabold uppercase tracking-wider border border-current border-opacity-20 bg-current bg-opacity-10 hover:bg-opacity-20 transition-all flex items-center justify-center space-x-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Mark Delivered</span>
            </button>
            <button
              onClick={() => {
                const reason = prompt('Enter return reason to recall order:', 'Needs Garnish');
                if (reason !== null) onRecallOrder(order.orderId, reason || 'Needs Attention');
              }}
              className="w-full py-2 bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-red-400 text-[10px] font-extrabold rounded-xl transition-all uppercase tracking-wider"
            >
              ⚠️ Recall back to Preparing
            </button>
          </div>
        ) : nextConf ? (
          <button
            onClick={() => onStatusUpdate(order.orderId, nextConf.next)}
            className="w-full py-2.5 rounded-xl text-xs font-extrabold uppercase tracking-wider border border-current border-opacity-20 bg-current bg-opacity-10 hover:bg-opacity-20 transition-all flex items-center justify-center space-x-1.5"
          >
            <Check className="w-3.5 h-3.5" />
            <span>{nextConf.label}</span>
          </button>
        ) : null}
      </div>
    </Card>
  );
};

export default KitchenTicket;
