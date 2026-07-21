import React, { useMemo } from 'react';
import Card from '../../../components/ui/Card/Card';
import { Flame, TrendingUp } from 'lucide-react';
import { IKdsOrder } from '../../../shared/domain/orders/types';
import { kitchenService } from '../../../shared/services/kitchenService';

interface IKitchenHeatMapProps {
  orders: IKdsOrder[];
}

const KitchenHeatMap: React.FC<IKitchenHeatMapProps> = ({ orders }) => {
  const data = useMemo(() => kitchenService.calculateHeatMapData(orders), [orders]);

  const maxHourCount = Math.max(...data.hourlyData.map(h => h.count), 1);
  const maxDayCount = Math.max(...data.dailyData.map(d => d.count), 1);

  const getHeatColor = (count: number, max: number): string => {
    const pct = max > 0 ? (count / max) * 100 : 0;
    if (pct === 0) return 'bg-slate-900/40';
    if (pct < 20) return 'bg-emerald-900/40';
    if (pct < 40) return 'bg-emerald-700/40';
    if (pct < 60) return 'bg-yellow-700/40';
    if (pct < 80) return 'bg-orange-700/40';
    return 'bg-red-600/40';
  };

  const getHeatText = (count: number, max: number): string => {
    const pct = max > 0 ? (count / max) * 100 : 0;
    if (pct === 0) return 'text-slate-700';
    if (pct < 20) return 'text-emerald-500';
    if (pct < 40) return 'text-emerald-400';
    if (pct < 60) return 'text-yellow-400';
    if (pct < 80) return 'text-orange-400';
    return 'text-red-400';
  };

  // Show only operating hours (6 AM to midnight)
  const operatingHours = data.hourlyData.filter(h => h.hour >= 6 && h.hour <= 23);

  return (
    <div className="space-y-4">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {[
          { label: 'Peak Hour', value: `${data.peakHour}:00`, color: 'text-red-400' },
          { label: 'Slow Hour', value: `${data.slowHour}:00`, color: 'text-emerald-400' },
          { label: 'Busiest Day', value: data.busiestDay, color: 'text-orange-400' },
          { label: 'Avg/Hour', value: `${data.avgOrdersPerHour}`, color: 'text-blue-400' },
        ].map(stat => (
          <div key={stat.label} className="bg-slate-900/50 border border-slate-800 rounded-xl px-3 py-2 text-center">
            <div className={`text-sm font-extrabold ${stat.color}`}>{stat.value}</div>
            <div className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Hourly Heat Map */}
      <div>
        <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-2 flex items-center space-x-1">
          <Flame className="w-3 h-3 text-orange-400" />
          <span>Hourly Order Volume</span>
        </h4>
        <div className="grid grid-cols-9 sm:grid-cols-18 gap-1">
          {operatingHours.map(h => (
            <div
              key={h.hour}
              className={`flex flex-col items-center justify-center rounded-lg border border-slate-800/50 py-1.5 px-1 ${getHeatColor(h.count, maxHourCount)}`}
              title={`${h.hour}:00 — ${h.count} orders, avg ${h.avgPrepTime}m prep`}
            >
              <span className={`text-[9px] font-extrabold tabular-nums ${getHeatText(h.count, maxHourCount)}`}>
                {h.count}
              </span>
              <span className="text-[7px] text-slate-600 font-mono">{h.hour}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Daily Distribution */}
      <div>
        <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-2 flex items-center space-x-1">
          <TrendingUp className="w-3 h-3 text-blue-400" />
          <span>Daily Distribution</span>
        </h4>
        <div className="space-y-1">
          {data.dailyData.map(d => {
            const pct = maxDayCount > 0 ? (d.count / maxDayCount) * 100 : 0;
            return (
              <div key={d.day} className="flex items-center space-x-2">
                <span className="text-[9px] font-bold text-slate-500 w-12 text-right shrink-0">
                  {d.dayName.substring(0, 3)}
                </span>
                <div className="flex-1 h-4 bg-slate-900/40 rounded-full overflow-hidden border border-slate-800/50">
                  <div
                    className={`h-full rounded-full transition-all ${
                      pct > 80 ? 'bg-red-500/60' : pct > 50 ? 'bg-orange-500/60' : 'bg-emerald-500/60'
                    }`}
                    style={{ width: `${Math.max(pct, 2)}%` }}
                  />
                </div>
                <span className="text-[9px] font-extrabold text-slate-400 w-8 text-right tabular-nums">
                  {d.count}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default KitchenHeatMap;
