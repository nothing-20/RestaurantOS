import React, { useMemo } from 'react';
import Card from '../../../components/ui/Card/Card';
import { Brain, TrendingUp, Zap, Plus } from 'lucide-react';
import { IKdsOrder } from '../../../shared/domain/orders/types';
import { kitchenService } from '../../../shared/services/kitchenService';
import { toast } from 'react-hot-toast';

interface ISmartBatchPredictionProps {
  menuItems: any[];
  orders: IKdsOrder[];
  onPrepareBatch: (item: any, size: number) => Promise<void>;
}

const CONFIDENCE_COLOR: Record<string, { text: string; bg: string; border: string }> = {
  High:   { text: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
  Medium: { text: 'text-yellow-400',  bg: 'bg-yellow-500/10',  border: 'border-yellow-500/20' },
  Low:    { text: 'text-slate-400',   bg: 'bg-slate-500/10',   border: 'border-slate-500/20' },
};

const SmartBatchPrediction: React.FC<ISmartBatchPredictionProps> = ({
  menuItems,
  orders,
  onPrepareBatch,
}) => {
  const now = useMemo(() => new Date(), []);
  const currentHour = now.getHours();
  const dayOfWeek = now.getDay();

  const batchItems = useMemo(
    () => menuItems.filter(item => item.preparationMethod === 'batch' || item.productionMode === 'Batch Production'),
    [menuItems]
  );

  const predictions = useMemo(() => {
    return batchItems.map(item => {
      const prediction = kitchenService.predictBatchQuantity(
        item.name,
        orders,
        currentHour,
        dayOfWeek
      );
      const available = item.availableServings ?? 0;
      const defaultBatch = item.defaultBatchSize ?? 50;
      const deficit = Math.max(0, prediction.suggestedQty - available);

      return {
        item,
        ...prediction,
        currentStock: available,
        defaultBatch,
        deficit,
        needsBatch: deficit > 0,
      };
    }).sort((a, b) => {
      // Sort: needs batch first, then by deficit
      if (a.needsBatch && !b.needsBatch) return -1;
      if (!a.needsBatch && b.needsBatch) return 1;
      return b.deficit - a.deficit;
    });
  }, [batchItems, orders, currentHour, dayOfWeek]);

  const handlePrepare = async (item: any, qty: number) => {
    try {
      await onPrepareBatch(item, qty);
      toast.success(`Prepared ${qty} portions of ${item.name}`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to prepare batch');
    }
  };

  if (batchItems.length === 0) {
    return (
      <div className="text-[10px] text-slate-500 text-center py-4">
        No batch production items configured
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-extrabold text-textPearl flex items-center space-x-1.5">
          <Brain className="w-3.5 h-3.5 text-violet-400" />
          <span>Smart Batch Predictions</span>
        </h3>
        <span className="text-[9px] text-slate-500 font-bold">
          Based on {orders.length} historical orders
        </span>
      </div>

      <div className="space-y-2">
        {predictions.map(p => {
          const confColor = CONFIDENCE_COLOR[p.confidence] || CONFIDENCE_COLOR.Low;
          
          return (
            <div
              key={p.item.id}
              className={`px-3 py-2.5 rounded-xl border transition-all ${
                p.needsBatch
                  ? 'bg-orange-500/5 border-orange-500/20'
                  : 'bg-slate-900/40 border-slate-800'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-extrabold text-textPearl">{p.item.name}</span>
                    <span className={`text-[8px] font-extrabold uppercase tracking-wider px-1.5 py-0.5 rounded border ${confColor.text} ${confColor.bg} ${confColor.border}`}>
                      {p.confidence}
                    </span>
                  </div>

                  <div className="flex items-center space-x-3 mt-1 text-[9px]">
                    <span className="text-slate-500">
                      Current: <span className={`font-bold ${p.currentStock === 0 ? 'text-red-400' : p.currentStock < 10 ? 'text-yellow-400' : 'text-emerald-400'}`}>
                        {p.currentStock}
                      </span>
                    </span>
                    <span className="text-slate-500">
                      Predicted need: <span className="font-bold text-blue-400">{p.suggestedQty}</span>
                    </span>
                    {p.deficit > 0 && (
                      <span className="text-orange-400 font-bold">
                        Gap: {p.deficit}
                      </span>
                    )}
                  </div>

                  <p className="text-[8px] text-slate-500 mt-0.5 italic">{p.reasoning}</p>
                </div>

                {p.needsBatch && (
                  <button
                    onClick={() => handlePrepare(p.item, p.deficit)}
                    className="shrink-0 ml-2 flex items-center space-x-1 text-[9px] font-extrabold text-violet-400 bg-violet-500/10 border border-violet-500/20 hover:bg-violet-500/20 px-2.5 py-1.5 rounded-xl transition-all"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Prepare {p.deficit}</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SmartBatchPrediction;
