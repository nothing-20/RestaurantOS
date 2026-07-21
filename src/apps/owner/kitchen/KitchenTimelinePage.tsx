import React from 'react';
import { useKitchenData } from './useKitchenData';
import KitchenTimelineTab from './KitchenTimelineTab';
import LoadingSpinner from '../../../components/ui/LoadingSpinner/LoadingSpinner';

export const KitchenTimelinePage: React.FC = () => {
  const { allOrders, isLoading } = useKitchenData();

  return (
    <div className="space-y-5 text-left select-none pb-24">
      <div>
        <h1 className="text-2xl font-display font-extrabold text-textPearl">Kitchen Timeline</h1>
        <p className="text-xs text-mutedAsh font-semibold">
          Chronological audit of KDS updates, state shifts, and prepared inventories
        </p>
      </div>

      {isLoading ? (
        <div className="h-64 flex items-center justify-center">
          <LoadingSpinner label="Loading timeline logs..." />
        </div>
      ) : (
        <KitchenTimelineTab orders={allOrders} />
      )}
    </div>
  );
};

export default KitchenTimelinePage;
