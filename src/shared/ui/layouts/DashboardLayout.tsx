import React, { useEffect, useState } from 'react';
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
        if (!orderData.batchServingsDeducted) {
          inventoryService.deductBatchServings(tenantId, docSnap.id).catch(err => {
            console.error('[InventoryAutomation] Batch servings deduction error:', err);
          });
        }
      });
    }, (err) => {
      console.error('[InventoryAutomation] Completed listener error:', err);
    });

    // Listener for PREPARING orders that need batch portion deductions early
    const qPreparing = query(ordersCol, where('status', '==', 'PREPARING'));
    const unsubPreparing = onSnapshot(qPreparing, (snap) => {
      snap.forEach(docSnap => {
        const orderData = docSnap.data();
        if (!orderData.batchServingsDeducted) {
          inventoryService.deductBatchServings(tenantId, docSnap.id).catch(err => {
            console.error('[InventoryAutomation] Batch servings deduction error (PREPARING):', err);
          });
        }
      });
    }, (err) => {
      console.error('[InventoryAutomation] Preparing listener error:', err);
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
        if (orderData.batchServingsDeducted && !orderData.batchServingsRestocked) {
          inventoryService.restockBatchServings(tenantId, docSnap.id, 'cancellation_restock').catch(err => {
            console.error('[InventoryAutomation] Batch servings restock error:', err);
          });
        }
      });
    }, (err) => {
      console.error('[InventoryAutomation] Cancelled listener error:', err);
    });

    // Listener for REFUNDED orders that need batch portion restocks
    const qRefunded = query(ordersCol, where('paymentStatus', '==', 'refunded'));
    const unsubRefunded = onSnapshot(qRefunded, (snap) => {
      snap.forEach(docSnap => {
        const orderData = docSnap.data();
        if (orderData.batchServingsDeducted && !orderData.batchServingsRestocked) {
          inventoryService.restockBatchServings(tenantId, docSnap.id, 'refund_restock').catch(err => {
            console.error('[InventoryAutomation] Batch servings refund restock error:', err);
          });
        }
      });
    }, (err) => {
      console.error('[InventoryAutomation] Refunded listener error:', err);
    });

    return () => {
      unsubCompleted();
      unsubPreparing();
      unsubCancelled();
      unsubRefunded();
    };
  }, [tenantId]);
};

export const useAutomationEngine = () => {
  const { user } = useAuth();
  const tenantId = user?.tenantId;

  useEffect(() => {
    if (!tenantId) return;

    let active = true;
    let localSchedules: any[] = [];
    let isSubscribed = false;
    let unsubscribeSnapshot: (() => void) | null = null;

    // Seed defaults and subscribe to updates
    import('../../services/automationService').then(({ automationService }) => {
      if (!active) return;
      const initSchedules = async () => {
        try {
          const { collection, getDocs } = await import('firebase/firestore');
          const { db } = await import('../../firebase/config');
          const snap = await getDocs(collection(db, 'restaurants', tenantId, 'automationSchedules'));
          if (snap.empty && active) {
            await automationService.seedDefaultSchedules(tenantId);
          }
        } catch (e) {
          console.error(e);
        }
      };

      initSchedules().then(() => {
        if (!active) return;
        import('firebase/firestore').then(({ collection, onSnapshot }) => {
          import('../../firebase/config').then(({ db }) => {
            if (!active) return;
            unsubscribeSnapshot = onSnapshot(collection(db, 'restaurants', tenantId, 'automationSchedules'), (snap) => {
              const list: any[] = [];
              snap.forEach(d => list.push({ id: d.id, ...d.data() }));
              localSchedules = list;
              isSubscribed = true;
            });
          });
        });
      });
    });

    // Check loop every 15 seconds in memory
    const interval = setInterval(() => {
      if (!isSubscribed || localSchedules.length === 0 || !active) return;
      const now = new Date();

      localSchedules.forEach(schedule => {
        if (!schedule.enabled) return;

        const nextRun = schedule.nextExecutionTime ? new Date(schedule.nextExecutionTime) : null;
        if (nextRun && now >= nextRun && schedule.executionStatus !== 'running') {
          import('../../services/automationService').then(({ automationService }) => {
            if (active) {
              automationService.runScheduledJob(tenantId, schedule.id, schedule.name).catch(console.error);
            }
          });
        }
      });
    }, 15000);

    return () => {
      active = false;
      clearInterval(interval);
      if (unsubscribeSnapshot) {
        unsubscribeSnapshot();
      }
    };
  }, [tenantId]);
};

export const DashboardLayout: React.FC = () => {
  // Mount background stock deduction listeners
  useInventoryAutomation();
  useAutomationEngine();

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar Backdrop Overlay on Mobile/Tablet */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar (drawer behavior below lg breakpoint) */}
      <div className={`
        fixed inset-y-0 left-0 w-64 bg-slate-950 border-r border-slate-900 z-40 flex flex-col transition-transform duration-300 ease-in-out
        lg:static lg:translate-x-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <Sidebar onClose={() => setIsSidebarOpen(false)} />
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar onMenuClick={() => setIsSidebarOpen(true)} />
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
