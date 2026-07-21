import React, { useState, useMemo } from 'react';
import Card from '../../../components/ui/Card/Card';
import { AlertTriangle, Check, X, ShieldAlert } from 'lucide-react';
import { IRecipeValidation, IIngredientCheck } from '../../../shared/domain/orders/types';
import { kitchenService } from '../../../shared/services/kitchenService';
import { useAuth } from '../../../context/AuthContext';

interface IRecipeValidationPanelProps {
  orderItems: Array<{ itemId: string; name: string; count: number }>;
  onValidationComplete: (canProceed: boolean) => void;
  onClose: () => void;
}

const RecipeValidationPanel: React.FC<IRecipeValidationPanelProps> = ({
  orderItems,
  onValidationComplete,
  onClose,
}) => {
  const { user } = useAuth();
  const [validations, setValidations] = useState<IRecipeValidation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasRun, setHasRun] = useState(false);

  React.useEffect(() => {
    if (!user?.tenantId || hasRun) return;
    setHasRun(true);
    setIsLoading(true);
    kitchenService.validateRecipeIngredients(user.tenantId, orderItems)
      .then(results => {
        setValidations(results);
        setIsLoading(false);
      })
      .catch(err => {
        console.error('Recipe validation error:', err);
        setIsLoading(false);
      });
  }, [user?.tenantId, orderItems, hasRun]);

  const canPrepareAll = validations.every(v => v.canPrepare);
  const totalMissing = validations.reduce((sum, v) => sum + v.missingCount, 0);
  const totalLow = validations.reduce((sum, v) => sum + v.lowStockCount, 0);

  const statusIcon = (status: IIngredientCheck['status']) => {
    switch (status) {
      case 'available': return <Check className="w-3 h-3 text-emerald-400" />;
      case 'low': return <AlertTriangle className="w-3 h-3 text-yellow-400" />;
      case 'out': return <X className="w-3 h-3 text-red-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <Card className="w-full max-w-lg mx-4 bg-slate-900 border border-slate-700 rounded-3xl p-6 shadow-2xl max-h-[80vh] overflow-y-auto">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-base font-extrabold text-textPearl flex items-center space-x-2">
              <ShieldAlert className="w-4 h-4 text-primary" />
              <span>Recipe Validation</span>
            </h2>
            <p className="text-xs text-mutedAsh mt-0.5">
              Checking ingredient availability before preparation
            </p>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300 p-1">
            <X className="w-4 h-4" />
          </button>
        </div>

        {isLoading ? (
          <div className="py-8 text-center text-slate-400 text-sm">Validating recipes...</div>
        ) : (
          <div className="space-y-4">
            {/* Summary */}
            <div className={`flex items-center space-x-2 px-3 py-2 rounded-xl border text-xs font-bold ${
              canPrepareAll
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                : 'bg-red-500/10 border-red-500/20 text-red-400'
            }`}>
              {canPrepareAll ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>All ingredients available. Safe to proceed.</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-4 h-4" />
                  <span>{totalMissing} missing · {totalLow} low stock — Manager override required.</span>
                </>
              )}
            </div>

            {/* Per-item details */}
            {validations.map(v => (
              <div key={v.itemId} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-textPearl">{v.itemName}</span>
                  {v.batchAvailable !== undefined && (
                    <span className="text-[9px] font-bold text-violet-400 bg-violet-500/10 border border-violet-500/20 px-1.5 py-0.5 rounded">
                      {v.batchAvailable} batch portions
                    </span>
                  )}
                </div>

                {v.ingredients.length > 0 ? (
                  <div className="bg-slate-950/40 border border-slate-800 rounded-xl overflow-hidden">
                    {v.ingredients.map(ing => (
                      <div key={ing.ingredientId} className="flex items-center justify-between px-3 py-1.5 border-b border-slate-800/50 last:border-b-0 text-[10px]">
                        <div className="flex items-center space-x-2">
                          {statusIcon(ing.status)}
                          <span className="text-slate-300">{ing.ingredientName}</span>
                        </div>
                        <div className="flex items-center space-x-3">
                          <span className="text-slate-500">Need: {ing.requiredQty} {ing.unit}</span>
                          <span className={`font-bold ${
                            ing.status === 'available' ? 'text-emerald-400' :
                            ing.status === 'low' ? 'text-yellow-400' : 'text-red-400'
                          }`}>
                            Have: {ing.availableQty} {ing.unit}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-[10px] text-slate-500 italic px-1">No recipe defined — will proceed without validation</div>
                )}
              </div>
            ))}

            {/* Action Buttons */}
            <div className="flex gap-2 pt-2">
              {canPrepareAll ? (
                <button
                  onClick={() => onValidationComplete(true)}
                  className="flex-1 py-2.5 rounded-xl text-xs font-extrabold uppercase tracking-wider bg-emerald-600 hover:bg-emerald-700 text-white transition-all"
                >
                  ✓ Proceed — All Clear
                </button>
              ) : (
                <>
                  <button
                    onClick={() => onValidationComplete(true)}
                    className="flex-1 py-2.5 rounded-xl text-xs font-extrabold uppercase tracking-wider bg-amber-600 hover:bg-amber-700 text-white transition-all"
                  >
                    ⚠️ Manager Override
                  </button>
                  <button
                    onClick={() => onValidationComplete(false)}
                    className="px-4 py-2.5 rounded-xl text-xs font-extrabold uppercase tracking-wider border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all"
                  >
                    Cancel
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default RecipeValidationPanel;
