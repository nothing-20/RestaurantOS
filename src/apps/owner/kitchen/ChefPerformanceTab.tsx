import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../../../config/firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import { useAuth } from '../../../context/AuthContext';
import Card from '../../../components/ui/Card/Card';
import { ChefHat, Star, TrendingUp, Clock, AlertCircle } from 'lucide-react';

interface IChefPerformanceTabProps {
  orders: any[];
  employees: any[];
}

export const ChefPerformanceTab: React.FC<IChefPerformanceTabProps> = ({ orders, employees }) => {
  const { user } = useAuth();
  const [ratingsList, setRatingsList] = useState<any[]>([]);

  // Real-time listener for satisfaction ratings
  useEffect(() => {
    if (!user?.tenantId) return;

    const colRef = collection(db, 'restaurants', user.tenantId, 'satisfactionRatings');
    const unsub = onSnapshot(colRef, (snap) => {
      const list: any[] = [];
      snap.forEach(doc => {
        list.push({ id: doc.id, ...doc.data() });
      });
      setRatingsList(list);
    }, (err) => {
      console.error('Ratings load error:', err);
    });

    return () => unsub();
  }, [user?.tenantId]);

  // Derive chef list (employees with role chef/kitchen_staff)
  const chefs = useMemo(() => {
    const list = employees.filter(
      emp => emp.role === 'chef' || emp.role === 'kitchen_staff' || emp.role === 'kitchen'
    );
    // Fallback: collect from assigned chef names in orders if employees is empty
    if (list.length === 0) {
      const names = new Set<string>();
      orders.forEach(o => { if (o.assignedChefName) names.add(o.assignedChefName); });
      return Array.from(names).map(name => ({ id: name, fullName: name }));
    }
    return list;
  }, [employees, orders]);

  // Calculate metrics per chef
  const chefMetrics = useMemo(() => {
    // Current shift determination
    const hr = new Date().getHours();
    const currentShift = hr >= 6 && hr < 14 ? 'Morning Shift' : hr >= 14 && hr < 22 ? 'Evening Shift' : 'Night Shift';

    return chefs.map(chef => {
      let completed = 0;
      let delayed = 0;
      let totalCookTime = 0;
      let cookTimeCount = 0;
      let fastest = Infinity;
      let slowest = 0;
      let active = 0;
      
      const chefOrders = orders.filter(
        o => o.assignedChefName === chef.fullName || o.assignedChefId === chef.id
      );

      chefOrders.forEach(order => {
        const isCompletedState = ['READY', 'DELIVERED', 'COMPLETED', 'ARCHIVED'].includes(order.status);
        
        if (isCompletedState) {
          completed += 1;

          // Cook time calculation (cookingStartedAt to readyAt)
          if (order.cookingStartedAt && order.readyAt) {
            const cookTime = (new Date(order.readyAt).getTime() - new Date(order.cookingStartedAt).getTime()) / 60000;
            if (cookTime > 0) {
              totalCookTime += cookTime;
              cookTimeCount += 1;
              if (cookTime < fastest) fastest = cookTime;
              if (cookTime > slowest) slowest = cookTime;

              // Check if delay occurred relative to estimated prep time
              const estTime = order.estimatedPrepTime || order.items?.length * 5 || 15;
              if (cookTime > estTime) {
                delayed += 1;
              }
            }
          }
        } else if (order.status !== 'CANCELLED') {
          active += 1;
        }
      });

      const avgCookTime = cookTimeCount > 0 ? (totalCookTime / cookTimeCount) : 0;
      const efficiency = completed > 0 ? Math.round(((completed - delayed) / completed) * 100) : 100;

      // Average rating from satisfaction ratings
      const chefRatings = ratingsList.filter(r => 
        chefOrders.some(o => o.orderId === r.orderId)
      );
      const avgRating = chefRatings.length > 0
        ? (chefRatings.reduce((acc, r) => acc + (r.rating || 0), 0) / chefRatings.length).toFixed(1)
        : '—';

      return {
        id: chef.id,
        name: chef.fullName,
        completed,
        delayed,
        avgCookTime,
        fastest: fastest === Infinity ? 0 : fastest,
        slowest,
        shift: currentShift,
        active,
        efficiency,
        rating: avgRating
      };
    });
  }, [chefs, orders, ratingsList]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 text-left select-none">
      {chefMetrics.map(chef => (
        <Card key={chef.id} className="p-4 border-slate-850 bg-slate-900/30 rounded-2xl flex flex-col justify-between space-y-4">
          <div>
            {/* Chef Identity */}
            <div className="flex items-center space-x-2.5">
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 shrink-0">
                <ChefHat className="w-5 h-5 text-primary" />
              </div>
              <div className="min-w-0">
                <h4 className="font-extrabold text-sm text-textPearl truncate">{chef.name}</h4>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{chef.shift}</p>
              </div>
            </div>

            {/* Core Stats Row */}
            <div className="grid grid-cols-3 gap-2 mt-4 text-center">
              <div className="bg-slate-950/40 p-2 rounded-xl border border-slate-850/50">
                <span className="text-lg font-black font-mono text-slate-200">{chef.completed}</span>
                <p className="text-[8px] font-bold text-slate-500 uppercase tracking-wider mt-0.5">Completed</p>
              </div>
              <div className="bg-slate-950/40 p-2 rounded-xl border border-slate-850/50">
                <span className={`text-lg font-black font-mono ${chef.delayed > 0 ? 'text-orange-400' : 'text-slate-400'}`}>
                  {chef.delayed}
                </span>
                <p className="text-[8px] font-bold text-slate-500 uppercase tracking-wider mt-0.5">Delayed</p>
              </div>
              <div className="bg-slate-950/40 p-2 rounded-xl border border-slate-850/50">
                <span className="text-lg font-black font-mono text-primary">{chef.efficiency}%</span>
                <p className="text-[8px] font-bold text-slate-500 uppercase tracking-wider mt-0.5">Efficiency</p>
              </div>
            </div>

            {/* Performance Parameters */}
            <div className="mt-4 space-y-2 text-xs">
              <div className="flex justify-between items-center py-1 border-b border-slate-850/50">
                <span className="text-slate-500 flex items-center space-x-1">
                  <Clock className="w-3 h-3 text-slate-500" />
                  <span>Avg Cook Time:</span>
                </span>
                <span className="font-mono font-bold text-slate-300">
                  {chef.avgCookTime > 0 ? `${chef.avgCookTime.toFixed(1)}m` : '—'}
                </span>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-slate-850/50">
                <span className="text-slate-555">Fastest Order:</span>
                <span className="font-mono font-bold text-emerald-450">
                  {chef.fastest > 0 ? `${chef.fastest.toFixed(1)}m` : '—'}
                </span>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-slate-850/50">
                <span className="text-slate-555">Slowest Order:</span>
                <span className="font-mono font-bold text-rose-500">
                  {chef.slowest > 0 ? `${chef.slowest.toFixed(1)}m` : '—'}
                </span>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-slate-850/50">
                <span className="text-slate-555">Active Load:</span>
                <span className="font-mono font-extrabold text-blue-400">
                  {chef.active} tickets
                </span>
              </div>

              <div className="flex justify-between items-center py-1">
                <span className="text-slate-500 flex items-center space-x-1">
                  <Star className="w-3 h-3 text-yellow-500" />
                  <span>Chef Rating:</span>
                </span>
                <span className="font-bold text-yellow-500 flex items-center space-x-0.5">
                  <span>{chef.rating}</span>
                  {chef.rating !== '—' && <Star className="w-3 h-3 fill-current" />}
                </span>
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};
export default ChefPerformanceTab;
