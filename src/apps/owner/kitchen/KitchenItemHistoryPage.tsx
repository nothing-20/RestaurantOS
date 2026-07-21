import React from 'react';
import { useKitchenData } from './useKitchenData';
import ItemHistoryTab from './ItemHistoryTab';
import LoadingSpinner from '../../../components/ui/LoadingSpinner/LoadingSpinner';

export const KitchenItemHistoryPage: React.FC = () => {
  const { allOrders, menuItems, isLoading } = useKitchenData();

  return (
    <div className="space-y-5 text-left select-none pb-24">
      <div>
        <h1 className="text-2xl font-display font-extrabold text-textPearl">Item History</h1>
        <p className="text-xs text-mutedAsh font-semibold">
          Analyze peak hours, portions waste logs, and dish production trends
        </p>
      </div>

      {isLoading ? (
        <div className="h-64 flex items-center justify-center">
          <LoadingSpinner label="Loading item analytics..." />
        </div>
      ) : (
        <ItemHistoryTab orders={allOrders} menuItems={menuItems} />
      )}
    </div>
  );
};

export default KitchenItemHistoryPage;
