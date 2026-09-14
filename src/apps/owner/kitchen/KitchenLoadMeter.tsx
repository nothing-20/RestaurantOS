import React, { useMemo } from 'react';
import { Gauge } from 'lucide-react';
import { kitchenService } from '../../../shared/services/kitchenService';

interface IKitchenLoadMeterProps {
  activeOrderCount: number;
  maxCapacity?: number;
}

export const KitchenLoadMeter: React.FC<IKitchenLoadMeterProps> = ({
  activeOrderCount,
  maxCapacity = 20,
}) => {
  const load = useMemo(
    () => kitchenService.calculateKitchenLoad(activeOrderCount, maxCapacity),
    [activeOrderCount, maxCapacity]
  );

  const colorMap: Record<string, { stroke: string; text: string; bg: string }> = {
    emerald: { stroke: 'stroke-[#287A55]', text: 'text-[#287A55]', bg: 'bg-[#E8F5EE]' },
    yellow:  { stroke: 'stroke-[#D79A24]', text: 'text-[#D79A24]', bg: 'bg-[#FEF7EC]' },
    orange:  { stroke: 'stroke-[#C84A38]', text: 'text-[#C84A38]', bg: 'bg-[#FDEEEC]' },
    red:     { stroke: 'stroke-[#C7463A]', text: 'text-[#C7463A]', bg: 'bg-[#FDEEEC]' },
  };

  const colors = colorMap[load.color] || colorMap.emerald;

  // SVG circular gauge
  const radius = 32;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (load.loadPct / 100) * circumference;

  return (
    <div className="flex items-center space-x-3.5 px-4 py-3 bg-white border border-[#E3DED5] rounded-xl shadow-[0_2px_10px_rgba(30,30,20,0.06)] text-left select-none font-sans">
      {/* Circular Gauge */}
      <div className="relative w-14 h-14 shrink-0">
        <svg className="w-14 h-14 -rotate-90" viewBox="0 0 80 80">
          <circle
            cx="40"
            cy="40"
            r={radius}
            fill="none"
            strokeWidth="7"
            className="stroke-[#E3DED5]"
          />
          <circle
            cx="40"
            cy="40"
            r={radius}
            fill="none"
            strokeWidth="7"
            strokeLinecap="round"
            className={`${colors.stroke} transition-all duration-700`}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xs font-bold font-sans text-[#18201D] tabular-nums">
            {load.loadPct}%
          </span>
        </div>
      </div>

      {/* Stats */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center space-x-1.5">
          <Gauge className={`w-3.5 h-3.5 ${colors.text}`} />
          <span className={`text-xs font-bold uppercase tracking-wider ${colors.text}`}>{load.label}</span>
        </div>
        <div className="text-[11px] text-[#18201D] font-medium mt-0.5">
          {activeOrderCount} / {maxCapacity} orders in prep
        </div>
        <div className="text-[10px] text-[#6F746F] mt-0.5 truncate leading-tight">
          {load.suggestion}
        </div>
      </div>
    </div>
  );
};

export default KitchenLoadMeter;
