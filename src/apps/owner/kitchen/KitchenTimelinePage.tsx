import React from 'react';
import { useKitchenData } from './useKitchenData';
import KitchenTimelineTab from './KitchenTimelineTab';
import LoadingSpinner from '../../../components/ui/LoadingSpinner/LoadingSpinner';

export const KitchenTimelinePage: React.FC = () => {
  const { allOrders, isLoading } = useKitchenData();

  return (
    <div className="space-y-6 text-left select-none pb-24 font-sans">
      <div className="bg-white border border-[#E3DED5] rounded-xl p-6 shadow-[0_1px_4px_rgba(30,30,20,0.05)]">
        <span className="text-[11px] font-bold uppercase tracking-widest text-[#5F6762]">
          AUDIT LOGS & EVENT TRACE
        </span>
        <h1 className="text-3xl md:text-4xl font-serif font-semibold text-[#18201D] tracking-tight mt-0.5">
          Kitchen Timeline
        </h1>
        <p className="text-sm text-[#5F6762] mt-1 font-normal">
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
