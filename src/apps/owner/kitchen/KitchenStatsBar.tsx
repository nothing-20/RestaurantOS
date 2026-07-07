import React from 'react';
import { IKdsMetrics } from '../../../features/kitchen-dashboard/types';
import {
  Flame,
  ChefHat,
  CheckCircle2,
  Clock,
  AlertTriangle,
  UtensilsCrossed,
  BarChart2,
  Zap
} from 'lucide-react';

// ─── Stat Card ────────────────────────────────────────────────────────────────

interface IStatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  subtext?: string;
  accent: string;       // border/icon accent colour class
  bgAccent: string;     // subtle background accent
  pulse?: boolean;
  alert?: boolean;
}

const StatCard: React.FC<IStatCardProps> = ({
  icon, label, value, subtext, accent, bgAccent, pulse = false, alert = false,
}) => (
  <div className={`relative flex flex-col justify-between p-4 rounded-2xl border ${accent} ${bgAccent} overflow-hidden min-w-0`}>
    {alert && (
      <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-red-500 animate-ping" />
    )}
    <div className="flex items-center space-x-2 mb-2">
      <div className={`opacity-80 ${pulse ? 'animate-pulse' : ''}`}>{icon}</div>
      <span className="text-[9px] font-extrabold uppercase tracking-widest text-slate-400 truncate">
        {label}
      </span>
    </div>
    <div>
      <span className={`text-2xl font-display font-extrabold text-textPearl tabular-nums leading-none ${pulse ? 'animate-pulse' : ''}`}>
        {value}
      </span>
      {subtext && (
        <p className="text-[9px] text-slate-500 font-semibold mt-0.5 leading-tight">{subtext}</p>
      )}
    </div>
  </div>
);

// ─── Props ────────────────────────────────────────────────────────────────────

interface IKitchenStatsBarProps {
  metrics: IKdsMetrics;
  targetPrepMinutes: number;
}

// ─── Component ────────────────────────────────────────────────────────────────

const KitchenStatsBar: React.FC<IKitchenStatsBarProps> = ({ metrics, targetPrepMinutes }) => {
  const effColor =
    metrics.kitchenEfficiencyPct >= 80
      ? 'text-emerald-400 border-emerald-500/25 bg-emerald-950/10'
      : metrics.kitchenEfficiencyPct >= 60
      ? 'text-yellow-400 border-yellow-500/25 bg-yellow-950/10'
      : 'text-red-400 border-red-500/25 bg-red-950/10';

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-8 gap-3">

      {/* 1. Active Orders */}
      <StatCard
        icon={<Flame className="w-4 h-4 text-orange-400" />}
        label="Active Orders"
        value={metrics.activeOrders}
        subtext="In queue"
        accent="border-orange-500/20"
        bgAccent="bg-orange-950/10"
        pulse={metrics.activeOrders > 0}
      />

      {/* 2. Preparing */}
      <StatCard
        icon={<ChefHat className="w-4 h-4 text-yellow-400" />}
        label="Preparing"
        value={metrics.preparingOrders}
        subtext="On the pass"
        accent="border-yellow-500/20"
        bgAccent="bg-yellow-950/10"
        pulse={metrics.preparingOrders > 0}
      />

      {/* 3. Ready */}
      <StatCard
        icon={<CheckCircle2 className="w-4 h-4 text-emerald-400" />}
        label="Ready"
        value={metrics.readyOrders}
        subtext="Awaiting pickup"
        accent="border-emerald-500/20"
        bgAccent="bg-emerald-950/10"
      />

      {/* 4. Avg Prep Time */}
      <StatCard
        icon={<Clock className="w-4 h-4 text-blue-400" />}
        label="Avg Prep Time"
        value={metrics.avgPrepTimeMinutes > 0 ? `${metrics.avgPrepTimeMinutes.toFixed(1)}m` : '—'}
        subtext={`Target: ${targetPrepMinutes}m`}
        accent="border-blue-500/20"
        bgAccent="bg-blue-950/10"
      />

      {/* 5. Delayed Orders */}
      <StatCard
        icon={<AlertTriangle className="w-4 h-4 text-red-400" />}
        label="Delayed"
        value={metrics.delayedOrders}
        subtext={`> ${targetPrepMinutes}m threshold`}
        accent={metrics.delayedOrders > 0 ? 'border-red-500/30' : 'border-slate-800/60'}
        bgAccent={metrics.delayedOrders > 0 ? 'bg-red-950/15' : 'bg-slate-900/20'}
        alert={metrics.delayedOrders > 0}
      />

      {/* 6. Completed Today */}
      <StatCard
        icon={<UtensilsCrossed className="w-4 h-4 text-teal-400" />}
        label="Completed Today"
        value={metrics.completedToday}
        subtext="This shift"
        accent="border-teal-500/20"
        bgAccent="bg-teal-950/10"
      />

      {/* 7. Kitchen Efficiency */}
      <div className={`relative flex flex-col justify-between p-4 rounded-2xl border overflow-hidden min-w-0 ${effColor}`}>
        <div className="flex items-center space-x-2 mb-2">
          <BarChart2 className="w-4 h-4 opacity-80" />
          <span className="text-[9px] font-extrabold uppercase tracking-widest text-slate-400 truncate">
            Efficiency
          </span>
        </div>
        <div>
          <span className="text-2xl font-display font-extrabold tabular-nums leading-none">
            {metrics.kitchenEfficiencyPct}%
          </span>
          <p className="text-[9px] text-slate-500 font-semibold mt-0.5">
            Within {targetPrepMinutes}m target
          </p>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-900/40">
          <div
            className="h-full transition-all duration-700 bg-current opacity-60"
            style={{ width: `${metrics.kitchenEfficiencyPct}%` }}
          />
        </div>
      </div>

      {/* 8. Peak Queue */}
      <StatCard
        icon={<Zap className="w-4 h-4 text-purple-400" />}
        label="Peak Queue"
        value={metrics.peakQueueToday}
        subtext="This session"
        accent="border-purple-500/20"
        bgAccent="bg-purple-950/10"
      />
    </div>
  );
};

export default KitchenStatsBar;
