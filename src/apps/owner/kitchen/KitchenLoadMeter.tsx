import React, { useMemo } from 'react';
import { Gauge } from 'lucide-react';
import { kitchenService } from '../../../shared/services/kitchenService';

interface IKitchenLoadMeterProps {
  activeOrderCount: number;
  maxCapacity?: number;
}

const KitchenLoadMeter: React.FC<IKitchenLoadMeterProps> = ({
  activeOrderCount,
  maxCapacity = 20,
}) => {
  const load = useMemo(
    () => kitchenService.calculateKitchenLoad(activeOrderCount, maxCapacity),
    [activeOrderCount, maxCapacity]
  );

  const colorMap: Record<string, { ring: string; text: string; bg: string; track: string }> = {
    emerald: { ring: 'stroke-emerald-500', text: 'text-emerald-400', bg: 'bg-emerald-500/10', track: 'stroke-emerald-900/30' },
    yellow:  { ring: 'stroke-yellow-500',  text: 'text-yellow-400',  bg: 'bg-yellow-500/10',  track: 'stroke-yellow-900/30' },
    orange:  { ring: 'stroke-orange-500',  text: 'text-orange-400',  bg: 'bg-orange-500/10',  track: 'stroke-orange-900/30' },
    red:     { ring: 'stroke-red-500',     text: 'text-red-400',     bg: 'bg-red-500/10',     track: 'stroke-red-900/30' },
  };

  const colors = colorMap[load.color] || colorMap.emerald;

  // SVG circular gauge
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (load.loadPct / 100) * circumference;

  return (
    <div className={`flex items-center space-x-3 px-3 py-2 rounded-xl border border-slate-800/50 ${colors.bg}`}>
      {/* Circular Gauge */}
      <div className="relative w-16 h-16 shrink-0">
        <svg className="w-16 h-16 -rotate-90" viewBox="0 0 80 80">
          {/* Background track */}
          <circle
            cx="40"
            cy="40"
            r={radius}
            fill="none"
            strokeWidth="6"
            className={colors.track}
          />
          {/* Progress arc */}
          <circle
            cx="40"
            cy="40"
            r={radius}
            fill="none"
            strokeWidth="6"
            strokeLinecap="round"
            className={`${colors.ring} transition-all duration-700`}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-sm font-extrabold tabular-nums ${colors.text}`}>
            {load.loadPct}%
          </span>
        </div>
      </div>

      {/* Stats */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center space-x-1.5">
          <Gauge className={`w-3.5 h-3.5 ${colors.text}`} />
          <span className={`text-xs font-extrabold ${colors.text}`}>{load.label}</span>
        </div>
        <div className="text-[9px] text-slate-500 font-bold mt-0.5">
          {activeOrderCount}/{maxCapacity} orders
        </div>
        <div className="text-[9px] text-slate-400 mt-0.5 leading-tight">
          {load.suggestion}
        </div>
      </div>
    </div>
  );
};

export default KitchenLoadMeter;
