import React, { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import { useAuth } from '../../../context/AuthContext';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { inventoryService } from '../../services/inventoryService';

export const useInventoryAutomation = () => {
  const { user } = useAuth();
  const tenantId = user?.tenantId;

  useEffect(() => {
    if (!tenantId) return;

    const ordersCol = collection(db, 'restaurants', tenantId, 'orders');

    // Listener for COMPLETED orders that need stock deductions
    const qCompleted = query(ordersCol, where('status', '==', 'COMPLETED'));
    const unsubCompleted = onSnapshot(qCompleted, (snap) => {
      snap.forEach(docSnap => {
        const orderData = docSnap.data();
        if (!orderData.inventoryDeducted) {
          inventoryService.deductStockForOrder(tenantId, docSnap.id).catch(err => {
            console.error('[InventoryAutomation] Deduction error:', err);
          });
        }
      });
    }, (err) => {
      console.error('[InventoryAutomation] Completed listener error:', err);
    });

    // Listener for CANCELLED orders that need stock restocks
    const qCancelled = query(ordersCol, where('status', '==', 'CANCELLED'));
    const unsubCancelled = onSnapshot(qCancelled, (snap) => {
      snap.forEach(docSnap => {
        const orderData = docSnap.data();
        if (orderData.inventoryDeducted && !orderData.inventoryRestocked) {
          inventoryService.restockStockForOrder(tenantId, docSnap.id, 'cancellation_restock').catch(err => {
            console.error('[InventoryAutomation] Restock error:', err);
          });
        }
      });
    }, (err) => {
      console.error('[InventoryAutomation] Cancelled listener error:', err);
    });

    return () => {
      unsubCompleted();
      unsubCancelled();
    };
  }, [tenantId]);
};

export const useAutomationEngine = () => {
  const { user } = useAuth();
  const tenantId = user?.tenantId;

  useEffect(() => {
    if (!tenantId) return;

    // Run scans initially
    import('../../services/automationService').then(({ automationService }) => {
      automationService.runScheduledJob(tenantId, 'low_stock_check', 'Background Low Stock Scan').catch(() => {});
      automationService.runScheduledJob(tenantId, 'expiry_check', 'Background Expiry Scan').catch(() => {});
    });

    // Set up check loop every 60 seconds
    const interval = setInterval(() => {
      import('../../services/automationService').then(({ automationService }) => {
        automationService.runScheduledJob(tenantId, 'low_stock_check', 'Background Low Stock Scan').catch(() => {});
        automationService.runScheduledJob(tenantId, 'expiry_check', 'Background Expiry Scan').catch(() => {});
      });
    }, 60000);

    return () => clearInterval(interval);
  }, [tenantId]);
};

export const DashboardLayout: React.FC = () => {
  // Mount background stock deduction listeners
  useInventoryAutomation();
  useAutomationEngine();

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-background p-6 relative">
          <div className="absolute top-[10%] right-[5%] w-[400px] h-[400px] rounded-full bg-primary/5 blur-[120px] pointer-events-none" />
          <div className="absolute bottom-[10%] left-[5%] w-[300px] h-[300px] rounded-full bg-accent/5 blur-[100px] pointer-events-none" />
          <div className="relative z-10 max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
export default DashboardLayout;
