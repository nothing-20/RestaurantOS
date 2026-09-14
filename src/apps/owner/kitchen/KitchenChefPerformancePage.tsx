import React from 'react';
import { useKitchenData } from './useKitchenData';
import ChefPerformanceTab from './ChefPerformanceTab';
import LoadingSpinner from '../../../components/ui/LoadingSpinner/LoadingSpinner';

export const KitchenChefPerformancePage: React.FC = () => {
  const { allOrders, employees, isLoading } = useKitchenData();

  return (
    <div className="space-y-6 text-left select-none pb-24 font-sans">
      <div className="bg-white border border-[#E3DED5] rounded-xl p-6 shadow-[0_1px_4px_rgba(30,30,20,0.05)]">
        <span className="text-[11px] font-bold uppercase tracking-widest text-[#5F6762]">
          STAFF METRICS & SHIFTS
        </span>
        <h1 className="text-3xl md:text-4xl font-serif font-semibold text-[#18201D] tracking-tight mt-0.5">
          Chef Performance
        </h1>
        <p className="text-sm text-[#5F6762] mt-1 font-normal">
          Monitor chef workloads, shifts, ratings, and execution efficiency
        </p>
      </div>

      {isLoading ? (
        <div className="h-64 flex items-center justify-center">
          <LoadingSpinner label="Loading staff logs..." />
        </div>
      ) : (
        <ChefPerformanceTab orders={allOrders} employees={employees} />
      )}
    </div>
  );
};

export default KitchenChefPerformancePage;
