import React, { useMemo } from 'react';
import Card from '../../../components/ui/Card/Card';
import { User, Briefcase, Coffee, WifiOff, Zap } from 'lucide-react';
import { IKdsOrder, IChefAvailability, TChefStatus } from '../../../shared/domain/orders/types';
import { kitchenService } from '../../../shared/services/kitchenService';

interface IChefAvailabilityPanelProps {
  employees: any[];
  orders: IKdsOrder[];
}

const STATUS_DISPLAY: Record<TChefStatus, { label: string; color: string; icon: React.ReactNode }> = {
  available: { label: 'Available', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', icon: <User className="w-3.5 h-3.5" /> },
  busy:      { label: 'Busy',      color: 'text-orange-400 bg-orange-500/10 border-orange-500/20',   icon: <Briefcase className="w-3.5 h-3.5" /> },
  break:     { label: 'On Break',  color: 'text-amber-400 bg-amber-500/10 border-amber-500/20',     icon: <Coffee className="w-3.5 h-3.5" /> },
  offline:   { label: 'Offline',   color: 'text-slate-500 bg-slate-500/10 border-slate-500/20',      icon: <WifiOff className="w-3.5 h-3.5" /> },
};

const ChefAvailabilityPanel: React.FC<IChefAvailabilityPanelProps> = ({ employees, orders }) => {
  const chefs = useMemo(
    () => kitchenService.deriveChefAvailability(employees, orders),
    [employees, orders]
  );

  const suggested = useMemo(() => kitchenService.suggestBestChef(chefs), [chefs]);

  if (chefs.length === 0) {
    return (
      <Card className="p-4 bg-slate-900/50 border border-slate-800 rounded-2xl">
        <p className="text-xs text-slate-500 text-center">No kitchen staff configured</p>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-extrabold text-textPearl flex items-center space-x-1.5">
          <User className="w-3.5 h-3.5 text-primary" />
          <span>Chef Availability</span>
        </h3>
        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">
          {chefs.filter(c => c.status === 'available' || c.status === 'busy').length}/{chefs.length} active
        </span>
      </div>

      <div className="grid grid-cols-1 gap-2">
        {chefs.map(chef => {
          const display = STATUS_DISPLAY[chef.status];
          const isSuggested = suggested?.chefId === chef.chefId;

          return (
            <div
              key={chef.chefId}
              className={`flex items-center justify-between px-3 py-2 rounded-xl border transition-all ${display.color} ${
                isSuggested ? 'ring-1 ring-primary/40' : ''
              }`}
            >
              <div className="flex items-center space-x-2">
                {display.icon}
                <div>
                  <div className="flex items-center space-x-1.5">
                    <span className="text-[10px] font-extrabold">{chef.chefName}</span>
                    {isSuggested && (
                      <span className="text-[8px] px-1 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 font-extrabold uppercase tracking-wider flex items-center space-x-0.5">
                        <Zap className="w-2 h-2" />
                        <span>Best Pick</span>
                      </span>
                    )}
                  </div>
                  <span className="text-[9px] opacity-70">{display.label}</span>
                </div>
              </div>

              <div className="text-right space-y-0.5">
                <div className="text-[9px] font-bold">
                  {chef.currentLoad} active · {chef.ordersCompleted} done
                </div>
                {chef.avgCookTimeMinutes > 0 && (
                  <div className="text-[8px] opacity-60">
                    ~{chef.avgCookTimeMinutes}m avg
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ChefAvailabilityPanel;
