import React from 'react';
import { useKitchenData } from './useKitchenData';
import OrderHistoryTab from './OrderHistoryTab';
import LoadingSpinner from '../../../components/ui/LoadingSpinner/LoadingSpinner';

export const KitchenOrderHistoryPage: React.FC = () => {
  const { allOrders, employees, isLoading } = useKitchenData();

  return (
    <div className="space-y-6 text-left select-none pb-24 font-sans">
      <div className="bg-white border border-[#E3DED5] rounded-xl p-6 shadow-[0_1px_4px_rgba(30,30,20,0.05)]">
        <span className="text-[11px] font-bold uppercase tracking-widest text-[#6F746F]">
          KITCHEN AUDIT & LOGS
        </span>
        <h1 className="text-3xl font-serif font-bold text-[#18201D] tracking-tight mt-0.5">
          Order History
        </h1>
        <p className="text-xs text-[#6F746F] mt-1 font-normal">
          Search, filter, and audit all completed, delivered, and cancelled kitchen orders.
        </p>
      </div>

      {isLoading ? (
        <div className="h-64 flex items-center justify-center">
          <LoadingSpinner label="Loading order history database..." />
        </div>
      ) : (
        <OrderHistoryTab orders={allOrders} employees={employees} />
      )}
    </div>
  );
};

export default KitchenOrderHistoryPage;
