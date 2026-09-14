import React from 'react';
import { IKdsMetrics } from '../../../features/kitchen-dashboard/types';
import {
  Utensils,
  Flame,
  CheckCircle2,
  AlertTriangle,
  BarChart2,
  Clock,
  Check
} from 'lucide-react';

interface IKitchenStatsBarProps {
  metrics: IKdsMetrics;
  targetPrepMinutes: number;
}

export const KitchenStatsBar: React.FC<IKitchenStatsBarProps> = ({ metrics, targetPrepMinutes }) => {
  const onTimeCount = Math.max(0, metrics.activeOrders - metrics.delayedOrders);

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5 select-none font-sans">
      
      {/* 1. Active Orders */}
      <div className="bg-white border border-[#E3DED5] rounded-xl p-4 shadow-[0_2px_10px_rgba(30,30,20,0.06)] flex flex-col justify-between hover:border-[#D1C9BC] transition-all text-left">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-semibold text-[#5F6762] tracking-wide uppercase">
            Active Orders
          </span>
          <div className="w-6 h-6 rounded-md bg-[#F9E8E4] flex items-center justify-center text-[#C84A38]">
            <Utensils className="w-3.5 h-3.5 text-[#C84A38]" />
          </div>
        </div>
        <div>
          <div className="text-3xl font-bold text-[#18201D] tabular-nums tracking-tight font-sans">
            {metrics.activeOrders}
          </div>
          <p className="text-xs text-[#5F6762] mt-1 font-medium">In queue</p>
        </div>
      </div>

      {/* 2. Preparing */}
      <div className="bg-white border border-[#E3DED5] rounded-xl p-4 shadow-[0_2px_10px_rgba(30,30,20,0.06)] flex flex-col justify-between hover:border-[#D1C9BC] transition-all text-left">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-[#D79A24]" />
            <span className="text-[11px] font-semibold text-[#5F6762] tracking-wide uppercase">
              Preparing
            </span>
          </div>
          <div className="w-6 h-6 rounded-md bg-[#F8EED8] flex items-center justify-center text-[#D79A24]">
            <Flame className="w-3.5 h-3.5 text-[#D79A24]" />
          </div>
        </div>
        <div>
          <div className="text-3xl font-bold text-[#18201D] tabular-nums tracking-tight font-sans">
            {metrics.preparingOrders}
          </div>
          <p className="text-xs text-[#5F6762] mt-1 font-medium">On the pass</p>
        </div>
      </div>

      {/* 3. Ready */}
      <div className="bg-white border border-[#E3DED5] rounded-xl p-4 shadow-[0_2px_10px_rgba(30,30,20,0.06)] flex flex-col justify-between hover:border-[#D1C9BC] transition-all text-left">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-[#287A55]" />
            <span className="text-[11px] font-semibold text-[#5F6762] tracking-wide uppercase">
              Ready
            </span>
          </div>
          <div className="w-6 h-6 rounded-md bg-[#E8F3ED] flex items-center justify-center text-[#287A55]">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#287A55]" />
          </div>
        </div>
        <div>
          <div className="text-3xl font-bold text-[#18201D] tabular-nums tracking-tight font-sans">
            {metrics.readyOrders}
          </div>
          <p className="text-xs text-[#5F6762] mt-1 font-medium">Awaiting pickup</p>
        </div>
      </div>

      {/* 4. Delayed */}
      <div className="bg-white border border-[#E3DED5] rounded-xl p-4 shadow-[0_2px_10px_rgba(30,30,20,0.06)] flex flex-col justify-between hover:border-[#D1C9BC] transition-all text-left">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-1.5">
            <span className={`w-2 h-2 rounded-full ${metrics.delayedOrders > 0 ? 'bg-[#C7463A]' : 'bg-[#E3DED5]'}`} />
            <span className="text-[11px] font-semibold text-[#5F6762] tracking-wide uppercase">
              Delayed
            </span>
          </div>
          <div className={`w-6 h-6 rounded-md flex items-center justify-center ${
            metrics.delayedOrders > 0 ? 'bg-[#F9E8E4] text-[#C7463A]' : 'bg-[#F7F4EE] text-[#5F6762]'
          }`}>
            <AlertTriangle className="w-3.5 h-3.5" />
          </div>
        </div>
        <div>
          <div className={`text-3xl font-bold tabular-nums tracking-tight font-sans ${
            metrics.delayedOrders > 0 ? 'text-[#C7463A]' : 'text-[#18201D]'
          }`}>
            {metrics.delayedOrders}
          </div>
          <p className="text-xs text-[#5F6762] mt-1 font-medium truncate">
            {metrics.delayedOrders > 0 ? `> ${targetPrepMinutes}m overdue` : 'Within target SLA'}
          </p>
        </div>
      </div>

      {/* 5. Kitchen Efficiency */}
      <div className="col-span-2 md:col-span-1 bg-white border border-[#E3DED5] rounded-xl p-4 shadow-[0_2px_10px_rgba(30,30,20,0.06)] flex flex-col justify-between hover:border-[#D1C9BC] transition-all text-left">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[11px] font-semibold text-[#5F6762] tracking-wide uppercase">
            Kitchen Efficiency
          </span>
          <div className="w-6 h-6 rounded-md bg-[#E8F3ED] flex items-center justify-center text-[#287A55]">
            <BarChart2 className="w-3.5 h-3.5 text-[#287A55]" />
          </div>
        </div>
        <div>
          <div className="flex items-baseline justify-between mb-1.5">
            <span className="text-3xl font-bold text-[#18201D] tabular-nums font-sans">
              {metrics.kitchenEfficiencyPct}%
            </span>
          </div>
          
          {/* Horizontal Progress Bar */}
          <div className="h-1.5 w-full bg-[#E3DED5] rounded-full overflow-hidden mb-1.5">
            <div 
              className="h-full bg-[#287A55] rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(0, metrics.kitchenEfficiencyPct))}%` }}
            />
          </div>

          <p className="text-[11px] text-[#5F6762] font-medium leading-tight">
            {metrics.activeOrders > 0 
              ? `${onTimeCount}/${metrics.activeOrders} orders running smoothly`
              : 'All stations operating normally'
            }
          </p>
        </div>
      </div>

    </div>
  );
};

export default KitchenStatsBar;
