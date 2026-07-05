import React from 'react';
import { ITimelineEvent } from '../../../types';
import {
  CircleDot,
  CheckCircle2,
  ChefHat,
  Flame,
  UtensilsCrossed,
  Package,
  XCircle,
  Archive
} from 'lucide-react';

// ─── Icon Map ─────────────────────────────────────────────────────────────────

const TIMELINE_ICONS: Record<ITimelineEvent['type'], React.ReactNode> = {
  ORDER_CREATED: <CircleDot className="w-3.5 h-3.5 text-blue-400" />,
  ACCEPTED:      <CheckCircle2 className="w-3.5 h-3.5 text-purple-400" />,
  PREPARING:     <Flame className="w-3.5 h-3.5 text-orange-400" />,
  READY:         <ChefHat className="w-3.5 h-3.5 text-emerald-400" />,
  DELIVERED:     <UtensilsCrossed className="w-3.5 h-3.5 text-teal-400" />,
  COMPLETED:     <Package className="w-3.5 h-3.5 text-slate-400" />,
  ARCHIVED:      <Archive className="w-3.5 h-3.5 text-slate-500" />,
  CANCELLED:     <XCircle className="w-3.5 h-3.5 text-red-400" />,
};

const TIMELINE_DOT_COLORS: Record<ITimelineEvent['type'], string> = {
  ORDER_CREATED: 'bg-blue-500',
  ACCEPTED:      'bg-purple-500',
  PREPARING:     'bg-orange-500',
  READY:         'bg-emerald-500',
  DELIVERED:     'bg-teal-500',
  COMPLETED:     'bg-slate-400',
  ARCHIVED:      'bg-slate-600',
  CANCELLED:     'bg-red-500',
};

// ─── Formatter ────────────────────────────────────────────────────────────────

const formatTimestamp = (isoStr: string): string => {
  if (!isoStr) return '';
  const d = new Date(isoStr);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
};

// ─── Component ────────────────────────────────────────────────────────────────

interface IOrderTimelineProps {
  timeline: ITimelineEvent[];
  /** Compact mode hides performer and description lines */
  compact?: boolean;
}

const OrderTimeline: React.FC<IOrderTimelineProps> = ({ timeline, compact = false }) => {
  // Render in chronological order (oldest first)
  const sorted = [...timeline].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  if (sorted.length === 0) {
    return (
      <p className="text-[10px] text-slate-600 italic px-1 py-2">
        No timeline events recorded yet.
      </p>
    );
  }

  return (
    <div className="space-y-0 relative">
      {sorted.map((event, idx) => {
        const isLast = idx === sorted.length - 1;
        const dotColor = TIMELINE_DOT_COLORS[event.type] || 'bg-slate-500';
        const icon = TIMELINE_ICONS[event.type];

        return (
          <div key={`${event.type}-${idx}`} className="flex items-start space-x-2.5 relative">
            {/* Vertical connector line */}
            <div className="flex flex-col items-center">
              <div className={`w-2 h-2 rounded-full mt-1 shrink-0 ring-1 ring-slate-950 ${dotColor}`} />
              {!isLast && (
                <div className="w-px flex-1 bg-slate-800 mt-0.5 min-h-[20px]" />
              )}
            </div>

            {/* Event content */}
            <div className={`pb-3 flex-1 min-w-0 ${isLast ? '' : ''}`}>
              <div className="flex items-center space-x-1.5 flex-wrap gap-y-0.5">
                {icon}
                <span className="text-[11px] font-extrabold text-textPearl leading-none">
                  {event.title}
                </span>
                <span className="text-[9px] font-mono text-slate-600 ml-auto shrink-0">
                  {formatTimestamp(event.timestamp)}
                </span>
              </div>

              {!compact && event.description && (
                <p className="text-[10px] text-slate-500 mt-0.5 italic leading-tight">
                  {event.description}
                </p>
              )}

              {!compact && event.performedBy && (
                <p className="text-[9px] text-slate-600 mt-0.5">
                  by {event.performedBy}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default OrderTimeline;
