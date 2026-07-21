import React, { useEffect, useState } from 'react';
import { IKdsOrder, TPriority } from '../../../features/kitchen-dashboard/types';
import {
  getElapsedSeconds,
  formatElapsedSeconds,
  getElapsedColor,
} from '../../../features/kitchen-dashboard/utils/kitchenMetrics';
import OrderTimeline from './OrderTimeline';
import Card from '../../../components/ui/Card/Card';
import { Check, Timer, ChevronDown, ChevronUp, User, Clock, MapPin, Truck, UtensilsCrossed, AlertTriangle } from 'lucide-react';

// ─── Status Configuration ─────────────────────────────────────────────────────

export const STATUS_CONFIG: Record<string, { label: string; color: string; dot: string }> = {
  NEW:           { label: 'New',       color: 'border-blue-500/40 bg-blue-950/20 text-blue-400',      dot: 'bg-blue-500' },
  PLACED:        { label: 'New',       color: 'border-blue-500/40 bg-blue-950/20 text-blue-400',      dot: 'bg-blue-500' },
  ACCEPTED:      { label: 'Accepted',  color: 'border-purple-500/40 bg-purple-950/20 text-purple-400', dot: 'bg-purple-500' },
  CHEF_ASSIGNED: { label: 'Chef Assigned', color: 'border-violet-500/40 bg-violet-950/20 text-violet-400', dot: 'bg-violet-500' },
  PREPARING:     { label: 'Preparing', color: 'border-orange-500/40 bg-orange-950/20 text-orange-400', dot: 'bg-orange-500 animate-pulse' },
  PAUSED:        { label: 'Paused',    color: 'border-amber-500/40 bg-amber-950/20 text-amber-500',   dot: 'bg-amber-500' },
  READY:         { label: 'Ready',     color: 'border-emerald-500/40 bg-emerald-950/20 text-emerald-400', dot: 'bg-emerald-500' },
  PICKED_UP:     { label: 'Picked Up', color: 'border-indigo-500/40 bg-indigo-950/20 text-indigo-400', dot: 'bg-indigo-500' },
  DELIVERED:     { label: 'Delivered', color: 'border-teal-500/40 bg-teal-950/20 text-teal-400',      dot: 'bg-teal-500' },
  SERVED:        { label: 'Delivered', color: 'border-teal-500/40 bg-teal-950/20 text-teal-400',      dot: 'bg-teal-500' },
  COMPLETED:     { label: 'Completed', color: 'border-slate-700 bg-slate-900/20 text-slate-400',      dot: 'bg-slate-600' },
  ARCHIVED:      { label: 'Archived',  color: 'border-slate-800 bg-slate-955/20 text-slate-600',      dot: 'bg-slate-700' },
  CANCELLED:     { label: 'Cancelled', color: 'border-red-800 bg-red-955/20 text-red-600',           dot: 'bg-red-700' },
};

/**
 * Smart Order Lifecycle — Single next action for each status.
 * The button label and next status are derived from the current order state.
 */
export const NEXT_STATUS: Record<string, { label: string; next: string; bg: string; hover: string } | null> = {
  NEW:           { label: 'Accept Order',   next: 'ACCEPTED',  bg: 'bg-blue-600',    hover: 'hover:bg-blue-700' },
  PLACED:        { label: 'Accept Order',   next: 'ACCEPTED',  bg: 'bg-blue-600',    hover: 'hover:bg-blue-700' },
  ACCEPTED:      { label: 'Start Cooking',  next: 'PREPARING', bg: 'bg-purple-600',  hover: 'hover:bg-purple-700' },
  CHEF_ASSIGNED: { label: 'Start Cooking',  next: 'PREPARING', bg: 'bg-purple-600',  hover: 'hover:bg-purple-700' },
  PREPARING:     { label: 'Mark Ready ✓',   next: 'READY',     bg: 'bg-orange-600',  hover: 'hover:bg-orange-700' },
  READY:         { label: 'Hand to Waiter', next: 'PICKED_UP', bg: 'bg-emerald-600', hover: 'hover:bg-emerald-700' },
  PICKED_UP:     { label: 'Mark Delivered', next: 'SERVED',    bg: 'bg-indigo-600',  hover: 'hover:bg-indigo-700' },
  SERVED:        { label: 'Complete Order', next: 'COMPLETED', bg: 'bg-teal-600',    hover: 'hover:bg-teal-700' },
  DELIVERED:     { label: 'Complete Order', next: 'COMPLETED', bg: 'bg-teal-600',    hover: 'hover:bg-teal-700' },
  PAUSED:        null,
  COMPLETED:     null,
  ARCHIVED:      null,
  CANCELLED:     null,
};

// ─── Customer Type Badge ──────────────────────────────────────────────────────

const CUSTOMER_TYPE_CONFIG: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  'dine-in':  { label: 'Dine-In',  icon: <UtensilsCrossed className="w-2.5 h-2.5" />, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
  'takeaway': { label: 'Takeaway', icon: <MapPin className="w-2.5 h-2.5" />,           color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
  'delivery': { label: 'Delivery', icon: <Truck className="w-2.5 h-2.5" />,            color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
};

// ─── Enhanced Live Timer ──────────────────────────────────────────────────────

const EnhancedTimer: React.FC<{ createdAt: string; estimatedMinutes: number }> = ({ createdAt, estimatedMinutes }) => {
  const [seconds, setSeconds] = useState(getElapsedSeconds(createdAt));

  useEffect(() => {
    const interval = setInterval(() => setSeconds(getElapsedSeconds(createdAt)), 1000);
    return () => clearInterval(interval);
  }, [createdAt]);

  const elapsedMinutes = seconds / 60;
  const remainingSeconds = Math.max(0, (estimatedMinutes * 60) - seconds);
  const remainingMinutes = remainingSeconds / 60;
  const estimatedFinish = new Date(new Date(createdAt).getTime() + estimatedMinutes * 60000);
  const slaPct = estimatedMinutes > 0 ? (elapsedMinutes / estimatedMinutes) * 100 : 0;

  // SLA color coding
  let slaColor = 'text-emerald-400';    // Green — within SLA
  let slaBg = 'bg-emerald-500/10';
  let slaLabel = 'On Time';
  if (slaPct > 100) {
    slaColor = 'text-red-400';           // Red — delayed
    slaBg = 'bg-red-500/10';
    slaLabel = 'Delayed';
  } else if (slaPct > 80) {
    slaColor = 'text-yellow-400';        // Yellow — approaching
    slaBg = 'bg-yellow-500/10';
    slaLabel = 'At Risk';
  }

  const elapsedColor = getElapsedColor(seconds);

  return (
    <div className="flex flex-col items-end space-y-0.5">
      {/* Elapsed */}
      <span className={`font-mono font-extrabold text-xs tabular-nums ${elapsedColor}`}>
        {formatElapsedSeconds(seconds)}
      </span>
      {/* Remaining */}
      {remainingSeconds > 0 ? (
        <span className="text-[9px] text-slate-500 flex items-center space-x-0.5">
          <Clock className="w-2.5 h-2.5" />
          <span>{Math.floor(remainingMinutes)}m left</span>
        </span>
      ) : (
        <span className="text-[9px] text-red-400 flex items-center space-x-0.5 font-bold">
          <AlertTriangle className="w-2.5 h-2.5" />
          <span>Overdue</span>
        </span>
      )}
      {/* Est. Finish */}
      <span className="text-[9px] text-slate-500 flex items-center space-x-0.5">
        <Timer className="w-2.5 h-2.5" />
        <span>ETA {estimatedFinish.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
      </span>
      {/* SLA Badge */}
      <span className={`text-[8px] font-extrabold uppercase tracking-wider px-1.5 py-0.5 rounded border ${slaColor} ${slaBg} border-current/20`}>
        {slaLabel}
      </span>
    </div>
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
  menuItems?: any[];
}

// ─── Component ────────────────────────────────────────────────────────────────

const KitchenTicket: React.FC<IKitchenTicketProps> = React.memo(({
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
  menuItems = [],
}) => {
  const [timelineOpen, setTimelineOpen] = useState(false);

  const statusConf = STATUS_CONFIG[order.status] || STATUS_CONFIG['NEW'];
  const nextConf = NEXT_STATUS[order.status];
  const priority = order.priority || 'normal';
  const estimatedPrep = order.estimatedPrepTime || order.items.length * 5;
  const hasTimeline = (order.timeline?.length ?? 0) > 0;
  const isNew = order.status === 'NEW' || order.status === 'PLACED';
  const customerType = (order as any).customerType || 'dine-in';
  const customerTypeConf = CUSTOMER_TYPE_CONFIG[customerType] || CUSTOMER_TYPE_CONFIG['dine-in'];

  // Determine if chef needs assignment before "Start Cooking"
  const needsChefAssignment = (order.status === 'ACCEPTED' || order.status === 'CHEF_ASSIGNED') && !order.assignedChefName;

  return (
    <Card
      className={`flex flex-col justify-between border ${statusConf.color} rounded-2xl p-0 overflow-hidden transition-all hover:brightness-110 ${
        isNew ? 'ring-1 ring-blue-500/30 shadow-lg shadow-blue-500/5' : ''
      } ${isSelected ? 'ring-2 ring-primary/60 brightness-110' : ''}`}
    >
      {/* ── Header ────────────────────────────────────────────────────── */}
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
              {/* Table + Customer Type */}
              <div className="flex items-center space-x-2">
                <span className="text-xs font-extrabold text-textPearl tracking-tight">
                  Table {order.tableNumber}
                </span>
                <span className={`inline-flex items-center space-x-0.5 px-1.5 py-0.5 rounded border text-[8px] font-extrabold uppercase tracking-wider ${customerTypeConf.color}`}>
                  {customerTypeConf.icon}
                  <span>{customerTypeConf.label}</span>
                </span>
              </div>

              {/* Order ID + Waiter */}
              <div className="flex flex-wrap gap-x-2 items-center text-[10px] text-slate-400 mt-1">
                {order.waiterName && (
                  <span className="font-semibold text-slate-300">
                    🤵 {order.waiterName}
                  </span>
                )}
                <span>·</span>
                <span className="font-mono text-slate-500 text-[9px] font-bold">ID: {order.orderId}</span>
              </div>

              {/* Priority Selector */}
              <select
                value={priority}
                onChange={(e) => {
                  e.stopPropagation();
                  onUpdatePriority(order.orderId, e.target.value as TPriority);
                }}
                className="text-[9px] uppercase font-extrabold tracking-widest bg-slate-950/80 border border-slate-800 rounded px-1.5 py-0.5 text-slate-300 outline-none cursor-pointer focus:border-primary/50 mt-1"
              >
                <option value="critical">💥 Critical</option>
                <option value="high">🔴 High</option>
                <option value="normal">🟡 Normal</option>
                <option value="low">⚪ Low</option>
              </select>

              {/* Status Badge */}
              <div className="flex items-center space-x-1.5 mt-1">
                <span className={`w-1.5 h-1.5 rounded-full ${statusConf.dot}`} />
                <span className="text-[10px] font-bold text-current opacity-70">{statusConf.label}</span>
                <span className="text-[10px] text-slate-600">·</span>
                <span className="text-[10px] text-slate-500 font-mono">#{(order.orderId || '').substring(0, 8)}</span>
              </div>
            </div>
          </div>

          {/* ── Enhanced Timer ─────────────────────────────────────────── */}
          <EnhancedTimer createdAt={order.createdAt} estimatedMinutes={estimatedPrep} />
        </div>

        {/* ── Chef Assignment Section ─────────────────────────────────── */}
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

      {/* ── Items List ────────────────────────────────────────────────── */}
      <div className="p-4 flex-1 space-y-2">
        {order.items.map((item, idx) => {
          const menuItem = menuItems?.find(mi => mi.id === item.itemId);
          const isBatch = menuItem?.preparationMethod === 'batch' || menuItem?.productionMode === 'Batch Production';
          const available = menuItem?.availableServings ?? 0;
          const defaultBatchSize = menuItem?.defaultBatchSize ?? 50;

          const percentage = defaultBatchSize > 0 ? (available / defaultBatchSize) * 100 : 100;
          
          let portionBadge = null;
          let needNewBatch = false;

          if (isBatch) {
            if (available === 0) {
              portionBadge = <span className="ml-1.5 px-1.5 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20 text-[9px] font-extrabold uppercase animate-pulse">Sold Out</span>;
              needNewBatch = true;
            } else if (available < item.count) {
              portionBadge = <span className="ml-1.5 px-1.5 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20 text-[9px] font-extrabold uppercase">Insufficient ({available} left)</span>;
              needNewBatch = true;
            } else if (percentage < 15) {
              portionBadge = <span className="ml-1.5 px-1.5 py-0.5 rounded bg-orange-500/10 text-orange-400 border border-orange-500/20 text-[9px] font-bold">{available} portions</span>;
            } else if (percentage < 30) {
              portionBadge = <span className="ml-1.5 px-1.5 py-0.5 rounded bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 text-[9px] font-bold">{available} portions</span>;
            } else {
              portionBadge = <span className="ml-1.5 px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-450 border border-emerald-500/20 text-[9px] font-medium">{available} portions</span>;
            }
          }

          return (
            <div key={idx} className="flex flex-col space-y-0.5">
              <div className="flex items-start space-x-2 text-xs">
                <span className="font-extrabold text-textPearl min-w-[20px]">×{item.count}</span>
                <div className="flex-1">
                  <span className="font-semibold text-slate-300">{item.name}</span>
                  {isBatch && <span className="ml-1 text-[8px] px-1 py-0.5 rounded bg-violet-500/10 text-violet-400 border border-violet-500/20 font-bold uppercase">Batch</span>}
                  {portionBadge}
                  {item.notes && (
                    <p className="text-[10px] text-amber-400 italic mt-0.5">"{item.notes}"</p>
                  )}
                </div>
              </div>
              {needNewBatch && (
                <div className="ml-7 text-[10px] font-extrabold text-rose-500 flex items-center space-x-1 animate-pulse">
                  <span>⚠️ Need New Batch</span>
                </div>
              )}
            </div>
          );
        })}

        {/* ── Notes Segment ──────────────────────────────────────────── */}
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

      {/* ── Timeline Toggle ───────────────────────────────────────────── */}
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

      {/* ── Smart Action Button — ONE primary action per status ────────── */}
      <div className="px-4 pb-4">
        {/* PAUSED state — show reason + Resume button */}
        {order.status === 'PAUSED' ? (
          <div className="flex flex-col gap-2">
            <div className="bg-amber-950/20 border border-amber-500/20 text-amber-400 rounded-xl p-2.5 text-[10px] italic text-left">
              ⏸️ PAUSED: {order.pauseReason || 'No reason specified'}
              {order.pausedAt && (
                <span className="block text-[9px] text-slate-500 mt-0.5">
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

        /* ACCEPTED/CHEF_ASSIGNED without chef — show "Assign Chef" */
        ) : needsChefAssignment ? (
          <div className="flex flex-col gap-2">
            <select
              value=""
              onChange={(e) => {
                const chef = employees.find(emp => emp.id === e.target.value);
                if (chef) {
                  onAssignChef(order.orderId, chef.id, chef.fullName);
                }
              }}
              className="w-full py-2.5 rounded-xl text-xs font-extrabold bg-violet-600/20 border border-violet-500/30 text-violet-300 outline-none cursor-pointer px-3"
            >
              <option value="" disabled>👨‍🍳 Select Chef to Assign...</option>
              {employees
                .filter(emp => emp.role === 'chef' || emp.role === 'kitchen_staff' || emp.role === 'kitchen')
                .map(emp => (
                  <option key={emp.id} value={emp.id}>{emp.fullName}</option>
                ))
              }
            </select>
            {/* Allow starting without assignment */}
            <button
              onClick={() => onStatusUpdate(order.orderId, 'PREPARING')}
              className="w-full py-2 rounded-xl text-[10px] font-extrabold uppercase tracking-wider border border-slate-700 bg-slate-800/50 hover:bg-slate-800 text-slate-400 transition-all"
            >
              Skip Assignment → Start Cooking
            </button>
          </div>

        /* Primary single action button */
        ) : nextConf ? (
          <div className="flex flex-col gap-2">
            <button
              onClick={() => onStatusUpdate(order.orderId, nextConf.next)}
              className={`w-full py-2.5 rounded-xl text-xs font-extrabold uppercase tracking-wider ${nextConf.bg} ${nextConf.hover} text-white transition-all flex items-center justify-center space-x-1.5 border border-white/10`}
            >
              <Check className="w-3.5 h-3.5" />
              <span>{nextConf.label}</span>
            </button>

            {/* Secondary actions */}
            {order.status === 'PREPARING' && (
              <button
                onClick={() => {
                  const reason = prompt('Enter reason to Pause cooking this order:', 'Waiting for ingredients');
                  if (reason !== null) onPauseOrder(order.orderId, reason || 'General Pause');
                }}
                className="w-full py-2 rounded-xl text-[10px] font-extrabold uppercase tracking-wider border border-orange-500/30 bg-orange-500/10 hover:bg-orange-500/25 text-orange-400 transition-all"
              >
                ⏸ Pause Cooking
              </button>
            )}

            {(order.status === 'READY' || order.status === 'PICKED_UP') && (
              <button
                onClick={() => {
                  const reason = prompt('Enter return reason to recall order:', 'Needs Garnish');
                  if (reason !== null) onRecallOrder(order.orderId, reason || 'Needs Attention');
                }}
                className="w-full py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 text-[10px] font-extrabold rounded-xl transition-all uppercase tracking-wider"
              >
                ⚠️ Recall to Preparing
              </button>
            )}
          </div>

        /* Terminal state — disabled button */
        ) : (
          <button
            disabled
            className="w-full py-2.5 rounded-xl text-xs font-extrabold uppercase tracking-wider bg-slate-800 text-slate-500 cursor-not-allowed transition-all flex items-center justify-center space-x-1.5 border border-slate-700/50"
          >
            <span>Completed</span>
          </button>
        )}
      </div>
    </Card>
  );
});

KitchenTicket.displayName = 'KitchenTicket';

export default KitchenTicket;
