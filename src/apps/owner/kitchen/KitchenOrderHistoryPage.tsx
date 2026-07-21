import React from 'react';
import { useKitchenData } from './useKitchenData';
import OrderHistoryTab from './OrderHistoryTab';
import LoadingSpinner from '../../../components/ui/LoadingSpinner/LoadingSpinner';

export const KitchenOrderHistoryPage: React.FC = () => {
  const { allOrders, employees, isLoading } = useKitchenData();

  return (
    <div className="space-y-5 text-left select-none pb-24">
      <div>
        <h1 className="text-2xl font-display font-extrabold text-textPearl">Order History</h1>
        <p className="text-xs text-mutedAsh font-semibold">
          Search and audit all completed, delivered, and cancelled orders
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
