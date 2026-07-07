import React from 'react';
import { IKdsMetrics, IKdsOrder } from '../../../features/kitchen-dashboard/types';

import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Clock,
  Zap,
  ChefHat
} from 'lucide-react';

interface IKitchenInsightsPanelProps {
  metrics: IKdsMetrics;
  orders: IKdsOrder[];
}

// ─── Insight Row ──────────────────────────────────────────────────────────────

const InsightRow: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string;
  severity?: 'normal' | 'warn' | 'critical';
}> = ({ icon, label, value, severity = 'normal' }) => {
  const valueColor =
    severity === 'critical'
      ? 'text-red-400'
      : severity === 'warn'
      ? 'text-yellow-400'
      : 'text-textPearl';

  return (
    <div className="flex items-center justify-between py-2.5 border-b border-slate-850 last:border-b-0">
      <div className="flex items-center space-x-2.5">
        <div className="opacity-70">{icon}</div>
        <span className="text-xs text-slate-400 font-semibold">{label}</span>
      </div>
      <span className={`text-xs font-extrabold tabular-nums ${valueColor}`}>{value}</span>
    </div>
  );
};

// ─── Component ────────────────────────────────────────────────────────────────

const KitchenInsightsPanel: React.FC<IKitchenInsightsPanelProps> = ({ metrics, orders }) => {
  const longestOrder = metrics.longestWaitingOrderId
    ? orders.find(o => o.orderId === metrics.longestWaitingOrderId)
    : null;

  const longestLabel = longestOrder
    ? `Table ${longestOrder.tableNumber} — ${metrics.longestWaitingMinutes.toFixed(1)}m`
    : '—';

  const avgPrepLabel =
    metrics.avgPrepTimeMinutes > 0
      ? `${metrics.avgPrepTimeMinutes.toFixed(1)} min`
      : '—';

  const fastestLabel =
    metrics.fastestCompletedMinutes > 0
      ? `${metrics.fastestCompletedMinutes.toFixed(1)} min`
      : '—';

  const avgTicketLabel =
    metrics.avgTicketTimeMinutes > 0
      ? `${metrics.avgTicketTimeMinutes.toFixed(1)} min`
      : '—';

  const bottleneckLabel = metrics.bottleneckStation || 'None';

  const longestSeverity: 'normal' | 'warn' | 'critical' =
    metrics.longestWaitingMinutes > 20
      ? 'critical'
      : metrics.longestWaitingMinutes > 15
      ? 'warn'
      : 'normal';

  const over15Severity: 'normal' | 'warn' | 'critical' =
    metrics.ordersOver15Min > 3 ? 'critical' : metrics.ordersOver15Min > 0 ? 'warn' : 'normal';

  return (
    <div className="bg-slate-900/40 border border-slate-850 rounded-2xl p-4">
      <div className="flex items-center space-x-2 mb-3">
        <Zap className="w-3.5 h-3.5 text-primary" />
        <h3 className="text-xs font-extrabold text-textPearl uppercase tracking-widest">
          Live Insights
        </h3>
      </div>

      <div>
        <InsightRow
          icon={<TrendingUp className="w-3.5 h-3.5 text-red-400" />}
          label="Longest Waiting"
          value={longestLabel}
          severity={longestSeverity}
        />
        <InsightRow
          icon={<TrendingDown className="w-3.5 h-3.5 text-emerald-400" />}
          label="Fastest Completed"
          value={fastestLabel}
        />
        <InsightRow
          icon={<ChefHat className="w-3.5 h-3.5 text-orange-400" />}
          label="Bottleneck Station"
          value={bottleneckLabel}
          severity={metrics.bottleneckStation ? 'warn' : 'normal'}
        />
        <InsightRow
          icon={<Clock className="w-3.5 h-3.5 text-blue-400" />}
          label="Avg Prep Time"
          value={avgPrepLabel}
        />
        <InsightRow
          icon={<Clock className="w-3.5 h-3.5 text-teal-400" />}
          label="Avg Ticket Time"
          value={avgTicketLabel}
        />
        <InsightRow
          icon={<AlertTriangle className="w-3.5 h-3.5 text-red-400" />}
          label="Orders > 15 min"
          value={String(metrics.ordersOver15Min)}
          severity={over15Severity}
        />
      </div>
    </div>
  );
};

export default KitchenInsightsPanel;
