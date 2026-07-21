import React from 'react';
import { useKitchenData } from './useKitchenData';
import ChefPerformanceTab from './ChefPerformanceTab';
import LoadingSpinner from '../../../components/ui/LoadingSpinner/LoadingSpinner';

export const KitchenChefPerformancePage: React.FC = () => {
  const { allOrders, employees, isLoading } = useKitchenData();

  return (
    <div className="space-y-5 text-left select-none pb-24">
      <div>
        <h1 className="text-2xl font-display font-extrabold text-textPearl">Chef Performance</h1>
        <p className="text-xs text-mutedAsh font-semibold">
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
