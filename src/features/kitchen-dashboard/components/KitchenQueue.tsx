/**
 * KitchenQueue — Main Kitchen Display System orchestrator.
 *
 * Architecture:
 * - Single Firestore onSnapshot listener for all orders (no duplicate reads)
 * - All metrics, filters, and groupings derived in-memory via useMemo
 * - Bulk writes use writeBatch (up to 500 docs per commit)
 * - Timeline events appended with arrayUnion (conflict-safe)
 * - 5 tab views share the same allOrders state (including Cooking Queue)
 */
import React, {
  useEffect,
  useState,
  useCallback,
  useMemo,
} from 'react';
import {
  collection,
  onSnapshot,
  doc,
  updateDoc,
  writeBatch,
  arrayUnion,
  query,
  where,
} from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { useAuth } from '../../../context/AuthContext';
import { logEvent } from '../../../services/eventEngine';


// Sub-components
import KitchenStatsBar from './KitchenStatsBar';
import KitchenInsightsPanel from './KitchenInsightsPanel';
import BulkActionsToolbar from './BulkActionsToolbar';
import KitchenTicket from './KitchenTicket';
import OrderTimeline from './OrderTimeline';

// UI Kit
import Card from '../../../components/ui/Card/Card';
import Select from '../../../components/ui/Select/Select';
import LoadingSpinner from '../../../components/ui/LoadingSpinner/LoadingSpinner';

import toast from 'react-hot-toast';
import {
  UtensilsCrossed,
  LayoutGrid,
  Layers,
  ListOrdered,
  CheckCircle2,
  Flame,
  Coffee,
  Pizza,
  IceCream,
  Package,
  Search,
  SlidersHorizontal,
  Check,
  ChefHat,
  Zap,
  AlertTriangle,
  X,
} from 'lucide-react';

// KDS-specific types & utilities
import {
  TKdsTab,
  TOrderStatus,
  TPriority,
  IKdsOrder,
  IBulkConfirmDialog,
} from '../types';
import {
  calcKitchenMetrics,
  ACTIVE_STATUSES,
  getElapsedMinutes,
  calculateSmartPriority,
} from '../utils/kitchenMetrics';
import { STATUS_CONFIG } from './KitchenTicket';

// ─── Constants ────────────────────────────────────────────────────────────────

const ALL_STATIONS = ['Grill', 'Main Kitchen', 'Pizza', 'Chinese', 'Drinks', 'Dessert', 'Packing'];

const STATION_ICONS: Record<string, React.ReactNode> = {
  'Grill':        <Flame className="w-4 h-4 text-orange-400" />,
  'Main Kitchen': <ChefHat className="w-4 h-4 text-yellow-400" />,
  'Pizza':        <Pizza className="w-4 h-4 text-red-400" />,
  'Chinese':      <UtensilsCrossed className="w-4 h-4 text-green-400" />,
  'Drinks':       <Coffee className="w-4 h-4 text-blue-400" />,
  'Dessert':      <IceCream className="w-4 h-4 text-pink-400" />,
  'Packing':      <Package className="w-4 h-4 text-slate-400" />,
};

/** Human-readable title for each status transition (used in timeline events) */
const TIMELINE_TITLES: Record<string, string> = {
  NEW:       'Order Created',
  PLACED:    'Order Placed',
  ACCEPTED:  'Kitchen Accepted',
  PREPARING: 'Preparation Started',
  READY:     'Marked Ready',
  DELIVERED: 'Delivered to Table',
  COMPLETED: 'Order Completed',
  ARCHIVED:  'Order Archived',
  CANCELLED: 'Order Cancelled',
  PAUSED:    'Cooking Paused',
  RESUMED:   'Cooking Resumed',
  RECALLED:  'Returned to Preparing',
};

/** Station inferred from menu category (fallback for legacy items without station field) */
const inferStation = (category: string): string => {
  const map: Record<string, string> = {
    Starters: 'Grill',
    'Main Course': 'Main Kitchen',
    Pizza: 'Pizza',
    Burgers: 'Grill',
    Beverages: 'Drinks',
    Desserts: 'Dessert',
  };
  return map[category] || 'Main Kitchen';
};

const normalizeStatus = (status: string): TOrderStatus => {
  if (status === 'PLACED') return 'NEW';
  return status as TOrderStatus;
};

// ─── Main Component ───────────────────────────────────────────────────────────

export const KitchenQueue: React.FC = () => {
  const { user } = useAuth();

  // ── Core Data State ───────────────────────────────────────────────────────
  const [allOrders, setAllOrders] = useState<IKdsOrder[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // ── View State ────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<TKdsTab>('table');
  const [showFilters, setShowFilters] = useState(false);
  const [showInsights, setShowInsights] = useState(false);

  // ── Filter State ──────────────────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('active');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [stationFilter, setStationFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('arrival');
  const [showDelayedOnly, setShowDelayedOnly] = useState(false);
  const [targetPrepMinutes, setTargetPrepMinutes] = useState(15);

  // ── Bulk Selection State ──────────────────────────────────────────────────
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDialog, setBulkDialog] = useState<IBulkConfirmDialog>({
    isOpen: false,
    action: '',
    nextStatus: 'ACCEPTED',
    count: 0,
  });

  // ── Peak Queue Tracking (session watermark) ───────────────────────────────
  const [peakQueue, setPeakQueue] = useState(0);

  // ── Single Firestore Listener for Orders ──────────────────────────────────
  useEffect(() => {
    if (!user?.tenantId) return;

    setIsLoading(true);
    const colRef = collection(db, 'restaurants', user.tenantId, 'orders');

    const unsubscribe = onSnapshot(
      colRef,
      (snapshot) => {
        const list: IKdsOrder[] = [];
        snapshot.forEach((docSnap) => {
          list.push({ id: docSnap.id, ...docSnap.data() } as IKdsOrder);
        });
        list.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        setAllOrders(list);
        // Update peak queue watermark
        const activeNow = list.filter(o => ACTIVE_STATUSES.includes(o.status as TOrderStatus)).length;
        setPeakQueue(prev => Math.max(prev, activeNow));
        setIsLoading(false);
      },
      (error) => {
        console.error('KDS onSnapshot error:', error);
        toast.error('Real-time order stream disconnected.');
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user?.tenantId]);

  // ── Realtime Listener for Restaurant Staff Employees ──────────────────────
  useEffect(() => {
    if (!user?.tenantId) return;

    const colRef = collection(db, 'employees');
    const q = query(
      colRef,
      where('tenantId', '==', user.tenantId),
      where('status', '==', 'active')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list: any[] = [];
        snapshot.forEach((docSnap) => {
          list.push({ id: docSnap.id, ...docSnap.data() });
        });
        setEmployees(list);
      },
      (error) => {
        console.error('Error fetching employees:', error);
      }
    );

    return () => unsubscribe();
  }, [user?.tenantId]);

  // ── Metrics (memoized — recalc only when orders or config change) ─────────
  const metrics = useMemo(
    () => calcKitchenMetrics(allOrders, targetPrepMinutes, targetPrepMinutes, peakQueue),
    [allOrders, targetPrepMinutes, peakQueue]
  );

  // ── Derived Category List (for filter dropdown) ───────────────────────────
  const allCategories = useMemo(
    () =>
      Array.from(
        new Set(allOrders.flatMap(o => o.items.map(i => (i as any).category || 'Uncategorized')))
      ).sort(),
    [allOrders]
  );

  // ── Filtered + Sorted Orders (memoized) ───────────────────────────────────
  const filteredOrders = useMemo((): IKdsOrder[] => {
    let filtered = [...allOrders];

    // Status filter
    if (statusFilter === 'active') {
      filtered = filtered.filter(o => ACTIVE_STATUSES.includes(o.status as TOrderStatus));
    } else if (statusFilter !== 'all') {
      filtered = filtered.filter(o => normalizeStatus(o.status) === statusFilter);
    }

    // Priority filter
    if (priorityFilter !== 'all') {
      filtered = filtered.filter(o => calculateSmartPriority(o) === priorityFilter);
    }

    // Delayed only
    if (showDelayedOnly) {
      filtered = filtered.filter(o => getElapsedMinutes(o.createdAt) > targetPrepMinutes);
    }

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(o =>
        o.tableNumber?.toLowerCase().includes(q) ||
        o.orderId?.toLowerCase().includes(q) ||
        o.customerName?.toLowerCase().includes(q) ||
        o.items.some(item => item.name.toLowerCase().includes(q))
      );
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'arrival':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'table':
          return a.tableNumber.localeCompare(b.tableNumber, undefined, { numeric: true });
        case 'prep':
          return (
            (a.estimatedPrepTime || a.items.length * 5) -
            (b.estimatedPrepTime || b.items.length * 5)
          );
        case 'priority': {
          const pOrder = { critical: 0, high: 1, normal: 2, low: 3 };
          return (
            pOrder[calculateSmartPriority(a)] -
            pOrder[calculateSmartPriority(b)]
          );
        }
        case 'elapsed':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        default:
          return 0;
      }
    });

    return filtered;
  }, [allOrders, statusFilter, priorityFilter, searchQuery, sortBy, showDelayedOnly, targetPrepMinutes]);

  // ── Cooking Queue Derivation ──────────────────────────────────────────────
  const queueOrders = useMemo((): IKdsOrder[] => {
    // Only active orders in progress are queued
    const activeQueue = allOrders.filter(o =>
      ['NEW', 'PLACED', 'ACCEPTED', 'PREPARING', 'PAUSED'].includes(o.status)
    );

    // Sort queue by queueOrder position, falling back to createdAt arrival
    activeQueue.sort((a, b) => {
      const aOrder = a.queueOrder !== undefined ? a.queueOrder : Number.MAX_SAFE_INTEGER;
      const bOrder = b.queueOrder !== undefined ? b.queueOrder : Number.MAX_SAFE_INTEGER;
      if (aOrder !== bOrder) return aOrder - bOrder;
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });

    return activeQueue;
  }, [allOrders]);

  // Sequentially calculate estimated windows for cooking queue tickets
  const queueWithTimings = useMemo(() => {
    let cumulativeMinutes = 0;
    const nowMs = Date.now();

    return queueOrders.map(order => {
      const prepMinutes = order.estimatedPrepTime || order.items.length * 5;
      const startMs = nowMs + cumulativeMinutes * 60000;
      const finishMs = startMs + prepMinutes * 60000;
      cumulativeMinutes += prepMinutes;

      return {
        ...order,
        estimatedStartStr: new Date(startMs).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }),
        estimatedFinishStr: new Date(finishMs).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }),
      };
    });
  }, [queueOrders]);

  // ── Selection Helpers ─────────────────────────────────────────────────────
  const toggleSelectOrder = useCallback((orderId: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(orderId)) next.delete(orderId);
      else next.add(orderId);
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    setSelectedIds(new Set(filteredOrders.map(o => o.orderId)));
  }, [filteredOrders]);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const allSelected = selectedIds.size === filteredOrders.length && filteredOrders.length > 0;

  // ── Single Status Update (with timeline append) ───────────────────────────
  const handleStatusUpdate = useCallback(
    async (orderId: string, nextStatus: string) => {
      if (!user?.tenantId) return;
      try {
        const docRef = doc(db, 'restaurants', user.tenantId, 'orders', orderId);
        const timelineEvent: ITimelineEvent = {
          type: nextStatus as ITimelineEvent['type'],
          title: TIMELINE_TITLES[nextStatus] || nextStatus,
          timestamp: new Date().toISOString(),
          performedBy: user?.displayName || 'Kitchen Staff',
        };
        await updateDoc(docRef, {
          status: nextStatus,
          updatedAt: new Date().toISOString(),
          timeline: arrayUnion(timelineEvent),
        });
        toast.success(`Order → ${TIMELINE_TITLES[nextStatus] || nextStatus}`, {
          id: `status-${orderId}`,
        });

        // Log Event
        const eventTypeMap: Record<string, string> = {
          'ACCEPTED': 'Kitchen Accepted',
          'PREPARING': 'Preparation Started',
          'READY': 'Order Ready',
          'DELIVERED': 'Order Delivered',
          'COMPLETED': 'Payment Completed',
        };
        const mappedType = eventTypeMap[nextStatus] || `Order ${nextStatus}`;
        logEvent(user.tenantId, {
          eventType: mappedType,
          eventCategory: nextStatus === 'COMPLETED' ? 'Payment' : 'Kitchen',
          performedBy: user?.displayName || 'Kitchen Staff',
          performedByRole: user?.role || 'kitchen',
          orderId,
          title: mappedType,
          description: `Order #${orderId.substring(0, 8)} status advanced to ${nextStatus}.`
        });
      } catch (e) {
        console.error('Status update failed:', e);
        toast.error('Failed to update order status. Check network connection.');
      }
    },
    [user?.tenantId, user?.displayName, user?.role]
  );

  // ── Bulk Status Update (writeBatch + arrayUnion) ──────────────────────────
  const handleBulkStatusUpdate = useCallback(
    async (nextStatus: string) => {
      if (!user?.tenantId || selectedIds.size === 0) return;

      setBulkDialog({ isOpen: false, action: '', nextStatus: 'ACCEPTED', count: 0 });

      const toastId = toast.loading(
        `Updating ${selectedIds.size} order${selectedIds.size > 1 ? 's' : ''}...`
      );
      try {
        const batch = writeBatch(db);
        const timestamp = new Date().toISOString();

        for (const orderId of Array.from(selectedIds)) {
          const ref = doc(db, 'restaurants', user.tenantId, 'orders', orderId);
          const timelineEvent: ITimelineEvent = {
            type: nextStatus as ITimelineEvent['type'],
            title: TIMELINE_TITLES[nextStatus] || nextStatus,
            timestamp,
            performedBy: `${user?.displayName || 'Kitchen Staff'} (Bulk)`,
            description: `Bulk operation — ${selectedIds.size} orders`,
          };
          batch.update(ref, {
            status: nextStatus,
            updatedAt: timestamp,
            timeline: arrayUnion(timelineEvent),
          });
        }

        await batch.commit();
        toast.success(
          `${selectedIds.size} orders → ${TIMELINE_TITLES[nextStatus] || nextStatus}`,
          { id: toastId }
        );

        // Log Events
        const eventTypeMap: Record<string, string> = {
          'ACCEPTED': 'Kitchen Accepted',
          'PREPARING': 'Preparation Started',
          'READY': 'Order Ready',
          'DELIVERED': 'Order Delivered',
          'COMPLETED': 'Payment Completed',
        };
        const mappedType = eventTypeMap[nextStatus] || `Order ${nextStatus}`;
        Array.from(selectedIds).forEach(orderId => {
          logEvent(user.tenantId || '', {
            eventType: mappedType,
            eventCategory: nextStatus === 'COMPLETED' ? 'Payment' : 'Kitchen',
            performedBy: `${user?.displayName || 'Kitchen Staff'} (Bulk)`,
            performedByRole: user?.role || 'kitchen',
            orderId,
            title: `Bulk ${mappedType}`,
            description: `Order #${orderId.substring(0, 8)} bulk-updated to ${nextStatus}.`
          });
        });

        setSelectedIds(new Set());
      } catch (e) {
        console.error('Batch update failed:', e);
        toast.error('Batch update failed. Please retry.', { id: toastId });
      }
    },
    [user?.tenantId, user?.displayName, user?.role, selectedIds]
  );

  // ── Chef Assignment Action handlers ──────────────────────────────────────
  const handleAssignChef = useCallback(
    async (orderId: string, chefId: string, chefName: string) => {
      if (!user?.tenantId) return;
      try {
        const docRef = doc(db, 'restaurants', user.tenantId, 'orders', orderId);
        const timelineEvent: ITimelineEvent = {
          type: 'ACCEPTED',
          title: 'Chef Assigned',
          description: `Assigned to ${chefName}`,
          performedBy: user?.displayName || 'Kitchen Manager',
          timestamp: new Date().toISOString(),
        };
        await updateDoc(docRef, {
          assignedChefId: chefId,
          assignedChefName: chefName,
          assignedAt: new Date().toISOString(),
          assignedBy: user?.displayName || 'Kitchen Manager',
          timeline: arrayUnion(timelineEvent),
        });
        toast.success(`Chef ${chefName} assigned to order.`);

        logEvent(user.tenantId, {
          eventType: 'Task Assigned',
          eventCategory: 'Kitchen',
          performedBy: user?.displayName || 'Kitchen Manager',
          performedByRole: user?.role || 'kitchen',
          orderId,
          title: 'Chef Assigned',
          description: `Order #${orderId.substring(0, 8)} assigned to chef ${chefName}.`
        });
      } catch (e) {
        console.error('Failed to assign chef:', e);
        toast.error('Failed to assign chef.');
      }
    },
    [user?.tenantId, user?.displayName, user?.role]
  );

  const handleUnassignChef = useCallback(
    async (orderId: string) => {
      if (!user?.tenantId) return;
      try {
        const docRef = doc(db, 'restaurants', user.tenantId, 'orders', orderId);
        await updateDoc(docRef, {
          assignedChefId: '',
          assignedChefName: '',
          assignedAt: '',
          assignedBy: '',
        });
        toast.success('Chef assignment cleared.');

        logEvent(user.tenantId, {
          eventType: 'Chef Unassigned',
          eventCategory: 'Kitchen',
          performedBy: user?.displayName || 'Kitchen Manager',
          performedByRole: user?.role || 'kitchen',
          orderId,
          title: 'Chef Unassigned',
          description: `Chef unassigned from order #${orderId.substring(0, 8)}.`
        });
      } catch (e) {
        console.error('Failed to unassign chef:', e);
        toast.error('Failed to clear chef.');
      }
    },
    [user?.tenantId, user?.displayName, user?.role]
  );

  // ── Pause / Resume Action handlers ───────────────────────────────────────
  const handlePauseOrder = useCallback(
    async (orderId: string, reason: string) => {
      if (!user?.tenantId) return;
      try {
        const docRef = doc(db, 'restaurants', user.tenantId, 'orders', orderId);
        const timestamp = new Date().toISOString();
        const timelineEvent: ITimelineEvent = {
          type: 'PAUSED',
          title: 'Cooking Paused',
          description: `Reason: ${reason}`,
          performedBy: user?.displayName || 'Kitchen Staff',
          timestamp,
        };
        await updateDoc(docRef, {
          status: 'PAUSED',
          pauseReason: reason,
          pausedAt: timestamp,
          pausedBy: user?.displayName || 'Kitchen Staff',
          timeline: arrayUnion(timelineEvent),
        });
        toast.success('Cooking paused.');

        logEvent(user.tenantId, {
          eventType: 'Preparation Paused',
          eventCategory: 'Kitchen',
          performedBy: user?.displayName || 'Kitchen Staff',
          performedByRole: user?.role || 'kitchen',
          orderId,
          title: 'Cooking Paused',
          description: `Order #${orderId.substring(0, 8)} preparation paused. Reason: ${reason}`
        });
      } catch (e) {
        console.error('Failed to pause order:', e);
        toast.error('Failed to pause order.');
      }
    },
    [user?.tenantId, user?.displayName, user?.role]
  );

  const handleResumeOrder = useCallback(
    async (orderId: string) => {
      if (!user?.tenantId) return;
      try {
        const docRef = doc(db, 'restaurants', user.tenantId, 'orders', orderId);
        const timestamp = new Date().toISOString();
        const timelineEvent: ITimelineEvent = {
          type: 'RESUMED',
          title: 'Cooking Resumed',
          performedBy: user?.displayName || 'Kitchen Staff',
          timestamp,
        };
        await updateDoc(docRef, {
          status: 'PREPARING',
          resumedAt: timestamp,
          timeline: arrayUnion(timelineEvent),
        });
        toast.success('Cooking resumed.');

        logEvent(user.tenantId, {
          eventType: 'Preparation Started',
          eventCategory: 'Kitchen',
          performedBy: user?.displayName || 'Kitchen Staff',
          performedByRole: user?.role || 'kitchen',
          orderId,
          title: 'Cooking Resumed',
          description: `Order #${orderId.substring(0, 8)} cooking resumed.`
        });
      } catch (e) {
        console.error('Failed to resume order:', e);
        toast.error('Failed to resume order.');
      }
    },
    [user?.tenantId, user?.displayName, user?.role]
  );

  // ── Recall Ready Order Action handler ────────────────────────────────────
  const handleRecallOrder = useCallback(
    async (orderId: string, reason: string) => {
      if (!user?.tenantId) return;
      try {
        const docRef = doc(db, 'restaurants', user.tenantId, 'orders', orderId);
        const timestamp = new Date().toISOString();
        const timelineEvent: ITimelineEvent = {
          type: 'RECALLED',
          title: 'Returned to Preparing',
          description: `Reason: ${reason}`,
          performedBy: user?.displayName || 'Kitchen Staff',
          timestamp,
        };
        await updateDoc(docRef, {
          status: 'PREPARING',
          recallReason: reason,
          recalledAt: timestamp,
          recalledBy: user?.displayName || 'Kitchen Staff',
          timeline: arrayUnion(timelineEvent),
        });
        toast.success('Order recalled back to Preparing state.');

        logEvent(user.tenantId, {
          eventType: 'Order Recalled',
          eventCategory: 'Kitchen',
          performedBy: user?.displayName || 'Kitchen Staff',
          performedByRole: user?.role || 'kitchen',
          orderId,
          title: 'Order Recalled',
          description: `Order #${orderId.substring(0, 8)} recalled to Preparing. Reason: ${reason}`
        });
      } catch (e) {
        console.error('Failed to recall order:', e);
        toast.error('Failed to recall order.');
      }
    },
    [user?.tenantId, user?.displayName, user?.role]
  );

  // ── Kitchen / Chef Notes Action handler ──────────────────────────────────
  const handleUpdateNotes = useCallback(
    async (orderId: string, noteType: 'kitchen' | 'chef', noteValue: string) => {
      if (!user?.tenantId) return;
      try {
        const docRef = doc(db, 'restaurants', user.tenantId, 'orders', orderId);
        const updateField = noteType === 'kitchen' ? { kitchenNotes: noteValue } : { chefNotes: noteValue };
        await updateDoc(docRef, updateField);
        toast.success('Note updated.');
      } catch (e) {
        console.error('Failed to update notes:', e);
        toast.error('Failed to update note.');
      }
    },
    [user?.tenantId]
  );

  // ── Manual Priority Override Action handler ──────────────────────────────
  const handleUpdatePriority = useCallback(
    async (orderId: string, priority: TPriority) => {
      if (!user?.tenantId) return;
      try {
        const docRef = doc(db, 'restaurants', user.tenantId, 'orders', orderId);
        await updateDoc(docRef, {
          priority,
          priorityOverride: true,
        });
        toast.success(`Priority set to ${priority}.`);
      } catch (e) {
        console.error('Failed to set priority:', e);
        toast.error('Failed to set priority.');
      }
    },
    [user?.tenantId]
  );

  // ── Reorder Queue Positions Action handler ────────────────────────────────
  const handleMoveQueue = useCallback(
    async (index: number, direction: 'up' | 'down') => {
      if (!user?.tenantId || queueOrders.length === 0) return;
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= queueOrders.length) return;

      try {
        const batch = writeBatch(db);
        // Write sequential positions and swap targets to avoid duplicate index issues
        queueOrders.forEach((order, idx) => {
          const ref = doc(db, 'restaurants', user.tenantId, 'orders', order.orderId);
          let finalPos = idx;
          if (idx === index) {
            finalPos = targetIndex;
          } else if (idx === targetIndex) {
            finalPos = index;
          }
          batch.update(ref, { queueOrder: finalPos });
        });
        await batch.commit();
        toast.success('Queue order re-arranged.');
      } catch (e) {
        console.error('Queue move error:', e);
        toast.error('Failed to change queue position.');
      }
    },
    [user?.tenantId, queueOrders]
  );

  // ── Auto-Sort Queue by priority weights ──────────────────────────────────
  const handleAutoSortQueue = useCallback(async () => {
    if (!user?.tenantId || queueOrders.length === 0) return;

    const toastId = toast.loading('Sorting queue by smart priority...');
    try {
      const sorted = [...queueOrders].sort((a, b) => {
        const aPrio = calculateSmartPriority(a);
        const bPrio = calculateSmartPriority(b);

        const weight = { critical: 0, high: 1, normal: 2, low: 3 };
        const aW = weight[aPrio];
        const bW = weight[bPrio];

        if (aW !== bW) return aW - bW;
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      });

      const batch = writeBatch(db);
      sorted.forEach((order, idx) => {
        const ref = doc(db, 'restaurants', user.tenantId, 'orders', order.orderId);
        batch.update(ref, { queueOrder: idx });
      });

      await batch.commit();
      toast.success('Queue sorted successfully!', { id: toastId });
    } catch (e) {
      console.error('Auto sort queue error:', e);
      toast.error('Auto-sort failed.', { id: toastId });
    }
  }, [user?.tenantId, queueOrders]);

  // ── Bulk Action Request (shows confirm dialog) ────────────────────────────
  const handleBulkActionRequest = useCallback(
    (nextStatus: string, label: string) => {
      if (selectedIds.size === 0) return;
      setBulkDialog({
        isOpen: true,
        action: label,
        nextStatus: nextStatus as TOrderStatus,
        count: selectedIds.size,
      });
    },
    [selectedIds]
  );

  // ── Tab Counts ────────────────────────────────────────────────────────────
  const newCount = useMemo(
    () => allOrders.filter(o => o.status === 'NEW' || o.status === 'PLACED').length,
    [allOrders]
  );
  const prepCount = useMemo(
    () => allOrders.filter(o => o.status === 'PREPARING').length,
    [allOrders]
  );
  const readyCount = useMemo(
    () => allOrders.filter(o => o.status === 'READY').length,
    [allOrders]
  );

  // ─── Tab View Renderers ─────────────────────────────────────────────────────

  const renderTableView = () => {
    const showBulkSelect = true;

    if (filteredOrders.length === 0) {
      return (
        <div className="h-64 flex flex-col items-center justify-center text-slate-500 border border-dashed border-slate-850 rounded-3xl">
          <CheckCircle2 className="w-10 h-10 text-slate-700 mb-3" />
          <p className="text-sm font-semibold">Kitchen is all clear. No active tickets.</p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {filteredOrders.map(order => (
          <KitchenTicket
            key={order.orderId}
            order={order}
            isSelected={selectedIds.has(order.orderId)}
            onToggleSelect={toggleSelectOrder}
            onStatusUpdate={handleStatusUpdate}
            showBulkSelect={showBulkSelect}
            employees={employees}
            onAssignChef={handleAssignChef}
            onUnassignChef={handleUnassignChef}
            onPauseOrder={handlePauseOrder}
            onResumeOrder={handleResumeOrder}
            onRecallOrder={handleRecallOrder}
            onUpdateNotes={handleUpdateNotes}
            onUpdatePriority={handleUpdatePriority}
          />
        ))}
      </div>
    );
  };

  const renderCategoryView = () => {
    const categoryMap: Record<
      string,
      Array<{ item: any; tableNumber: string; orderId: string }>
    > = {};

    filteredOrders.forEach(order => {
      order.items.forEach(item => {
        const cat = (item as any).category || 'Other';
        if (!categoryMap[cat]) categoryMap[cat] = [];
        categoryMap[cat].push({ item, tableNumber: order.tableNumber, orderId: order.orderId });
      });
    });

    const cats = Object.entries(categoryMap).filter(
      ([cat]) => categoryFilter === 'all' || cat === categoryFilter
    );

    if (cats.length === 0) {
      return (
        <div className="h-64 flex flex-col items-center justify-center text-slate-500 border border-dashed border-slate-850 rounded-3xl">
          <LayoutGrid className="w-10 h-10 text-slate-700 mb-3" />
          <p className="text-sm font-semibold">No items match the selected category filters.</p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {cats.map(([cat, entries]) => (
          <Card key={cat} className="p-0 border-slate-850 overflow-hidden rounded-2xl">
            <div className="px-4 py-3 bg-slate-900/50 border-b border-slate-850 flex items-center space-x-2">
              <UtensilsCrossed className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs font-extrabold text-textPearl uppercase tracking-wider">{cat}</span>
              <span className="ml-auto text-[10px] font-bold bg-slate-800 px-2 py-0.5 rounded-full text-slate-400">
                {entries.reduce((s, e) => s + e.item.count, 0)} items
              </span>
            </div>
            <div className="p-3 space-y-2">
              {entries.map((entry, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs bg-slate-900/40 px-3 py-2 rounded-xl">
                  <div>
                    <span className="font-bold text-slate-300">×{entry.item.count}</span>
                    <span className="ml-2 text-textPearl font-semibold">{entry.item.name}</span>
                    {entry.item.notes && (
                      <span className="ml-1.5 text-amber-400 italic text-[10px]">"{entry.item.notes}"</span>
                    )}
                  </div>
                  <span className="text-[10px] font-extrabold text-primary">T{entry.tableNumber}</span>
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>
    );
  };

  const renderStationView = () => {
    const stationMap: Record<
      string,
      Array<{ item: any; tableNumber: string; orderId: string; status: string }>
    > = {};

    filteredOrders.forEach(order => {
      order.items.forEach(item => {
        const rawItem = item as any;
        const station = rawItem.station || inferStation(rawItem.category || '');
        if (!stationMap[station]) stationMap[station] = [];
        stationMap[station].push({
          item,
          tableNumber: order.tableNumber,
          orderId: order.orderId,
          status: order.status,
        });
      });
    });

    const stationsToShow =
      stationFilter !== 'all'
        ? Object.entries(stationMap).filter(([s]) => s === stationFilter)
        : Object.entries(stationMap);

    if (stationsToShow.length === 0) {
      return (
        <div className="h-64 flex flex-col items-center justify-center text-slate-500 border border-dashed border-slate-850 rounded-3xl">
          <Layers className="w-10 h-10 text-slate-700 mb-3" />
          <p className="text-sm font-semibold">No items at the selected stations.</p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {stationsToShow.map(([station, entries]) => {
          const totalItems = entries.reduce((s, e) => s + e.item.count, 0);
          return (
            <Card key={station} className="p-0 border-slate-850 overflow-hidden rounded-2xl">
              <div className="px-4 py-3 bg-slate-900/50 border-b border-slate-850 flex items-center space-x-2">
                {STATION_ICONS[station] || <ChefHat className="w-4 h-4 text-slate-400" />}
                <span className="text-xs font-extrabold text-textPearl uppercase tracking-wider">{station}</span>
                <span className="ml-auto text-[10px] font-bold bg-slate-800 px-2 py-0.5 rounded-full text-slate-400">
                  {totalItems} total
                </span>
              </div>
              <div className="p-3 space-y-2">
                {entries.map((entry, idx) => {
                  const statusConf = STATUS_CONFIG[entry.status] || STATUS_CONFIG['NEW'];
                  return (
                    <div key={idx} className={`flex items-center justify-between text-xs px-3 py-2 rounded-xl border ${statusConf.color}`}>
                      <div className="flex items-center space-x-2">
                        <span className="font-extrabold">×{entry.item.count}</span>
                        <span className="font-semibold">{entry.item.name}</span>
                      </div>
                      <div className="flex items-center space-x-1.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${statusConf.dot}`} />
                        <span className="text-[9px] font-extrabold opacity-70">T{entry.tableNumber}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          );
        })}
      </div>
    );
  };

  const renderItemQueueView = () => {
    const queueMap: Record<
      string,
      { count: number; tables: string[]; orderId: string[]; firstCreatedAt: string }
    > = {};

    filteredOrders.forEach(order => {
      if (['READY', 'DELIVERED', 'COMPLETED', 'ARCHIVED'].includes(order.status)) return;
      order.items.forEach(item => {
        const key = item.name;
        if (!queueMap[key]) {
          queueMap[key] = { count: 0, tables: [], orderId: [], firstCreatedAt: order.createdAt };
        }
        queueMap[key].count += item.count;
        if (!queueMap[key].tables.includes(order.tableNumber)) queueMap[key].tables.push(order.tableNumber);
        if (!queueMap[key].orderId.includes(order.orderId)) queueMap[key].orderId.push(order.orderId);
      });
    });

    const queueEntries = Object.entries(queueMap).sort((a, b) => b[1].count - a[1].count);

    if (queueEntries.length === 0) {
      return (
        <div className="h-64 flex flex-col items-center justify-center text-slate-500 border border-dashed border-slate-850 rounded-3xl">
          <ListOrdered className="w-10 h-10 text-slate-700 mb-3" />
          <p className="text-sm font-semibold">No pending items to batch cook.</p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {queueEntries.map(([itemName, data]) => (
          <Card key={itemName} className="p-4 border-slate-850 bg-slate-900/30 rounded-2xl space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-extrabold text-base text-textPearl">{itemName}</h3>
                <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
                  {data.tables.length} table{data.tables.length > 1 ? 's' : ''} · {data.count} total
                </p>
              </div>
              <div className="text-right">
                <span className="text-3xl font-extrabold text-primary tabular-nums">{data.count}</span>
                <p className="text-[9px] text-slate-500 font-bold uppercase">Pending</p>
              </div>
            </div>
            <div>
              <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Tables</p>
              <div className="flex flex-wrap gap-1.5">
                {data.tables.map(t => (
                  <span key={t} className="text-[10px] font-extrabold bg-slate-800 text-slate-300 px-2 py-0.5 rounded-lg border border-slate-700">
                    T{t}
                  </span>
                ))}
              </div>
            </div>
            <button className="w-full py-2 rounded-xl text-xs font-extrabold uppercase tracking-wider border border-primary/30 bg-primary/10 text-primary hover:bg-primary/20 transition-all flex items-center justify-center space-x-1.5">
              <ChefHat className="w-3.5 h-3.5" />
              <span>Cook All Together</span>
            </button>
          </Card>
        ))}
      </div>
    );
  };

  const renderQueueView = () => {
    if (queueWithTimings.length === 0) {
      return (
        <div className="h-64 flex flex-col items-center justify-center text-slate-500 border border-dashed border-slate-850 rounded-3xl">
          <ListOrdered className="w-10 h-10 text-slate-700 mb-3" />
          <p className="text-sm font-semibold">No active cooking tickets in the queue.</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {/* Queue Timeline Header */}
        <div className="bg-slate-900/40 border border-slate-850 rounded-2xl p-4">
          <div className="flex items-center space-x-2 mb-3">
            <ListOrdered className="w-4 h-4 text-primary" />
            <h3 className="text-xs font-extrabold text-textPearl uppercase tracking-widest">
              Queue Timeline Flow
            </h3>
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
            {queueWithTimings.map((order, idx) => {
              const smartPrio = calculateSmartPriority(order);
              const statusConf = STATUS_CONFIG[order.status] || STATUS_CONFIG['NEW'];
              return (
                <div key={order.orderId} className="flex items-center shrink-0">
                  <div className="bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-left space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-extrabold text-slate-400 font-mono">#{idx + 1}</span>
                      <span className="text-[11px] font-bold text-textPearl">Table {order.tableNumber}</span>
                    </div>
                    <div className="text-[9px] text-slate-500">
                      Est. Start: <span className="text-slate-300 font-mono">{order.estimatedStartStr}</span>
                    </div>
                    <div className="flex items-center gap-1 text-[8px] uppercase tracking-wider text-slate-650">
                      <span className="font-semibold">{smartPrio}</span>
                      <span>·</span>
                      <span className="text-primary">{statusConf.label}</span>
                    </div>
                  </div>
                  {idx < queueWithTimings.length - 1 && (
                    <span className="text-slate-750 px-1 font-bold">→</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Action Button: Auto-Sort */}
        <div className="flex justify-end">
          <button
            onClick={handleAutoSortQueue}
            className="px-4 py-2 bg-primary/10 hover:bg-primary border border-primary/20 hover:border-primary text-primary hover:text-slate-950 text-xs font-extrabold rounded-xl transition-all uppercase tracking-wider"
          >
            ⚡ Auto-Sort Queue by Priority
          </button>
        </div>

        {/* Queue List Table */}
        <div className="bg-slate-900/20 border border-slate-850 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/50 border-b border-slate-850 text-slate-400 font-extrabold uppercase tracking-widest text-[9px]">
                <tr>
                  <th className="px-4 py-3 text-center w-12">Pos</th>
                  <th className="px-4 py-3">Order info</th>
                  <th className="px-4 py-3">Chef Assigned</th>
                  <th className="px-4 py-3">Smart Priority</th>
                  <th className="px-4 py-3 text-center">Prep Time</th>
                  <th className="px-4 py-3 text-center">Est. Window</th>
                  <th className="px-4 py-3 text-center w-28">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850">
                {queueWithTimings.map((order, idx) => {
                  const smartPrio = calculateSmartPriority(order);
                  const prepTime = order.estimatedPrepTime || order.items.length * 5;
                  
                  return (
                    <tr key={order.orderId} className="hover:bg-slate-900/40 transition-colors">
                      {/* Position */}
                      <td className="px-4 py-4 text-center font-mono font-extrabold text-slate-450 text-sm">
                        {idx + 1}
                      </td>
                      
                      {/* Order info */}
                      <td className="px-4 py-4">
                        <div className="font-bold text-textPearl text-sm">Table {order.tableNumber}</div>
                        <div className="text-[10px] text-slate-500 font-mono mt-0.5">#{order.orderId.substring(0, 8)}</div>
                        <div className="text-[10px] text-slate-400 mt-1">
                          {order.items.map(i => `${i.count}x ${i.name}`).join(', ')}
                        </div>
                      </td>

                      {/* Chef */}
                      <td className="px-4 py-4">
                        {order.assignedChefName ? (
                          <span className="bg-slate-950 px-2.5 py-1 rounded-lg text-slate-350 font-semibold border border-slate-850">
                            👨‍🍳 {order.assignedChefName}
                          </span>
                        ) : (
                          <span className="text-slate-650 italic">Unassigned</span>
                        )}
                      </td>

                      {/* Smart Priority */}
                      <td className="px-4 py-4">
                        <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded border ${
                          smartPrio === 'critical' ? 'bg-red-950/20 text-red-400 border-red-500/30' :
                          smartPrio === 'high' ? 'bg-orange-950/20 text-orange-400 border-orange-500/30' :
                          smartPrio === 'normal' ? 'bg-yellow-950/20 text-yellow-400 border-yellow-500/30' :
                          'bg-slate-850 text-slate-400 border-slate-700'
                        }`}>
                          {smartPrio}
                        </span>
                      </td>

                      {/* Prep time */}
                      <td className="px-4 py-4 text-center font-mono text-slate-350">
                        {prepTime}m
                      </td>

                      {/* Estimated Window */}
                      <td className="px-4 py-4 text-center font-mono">
                        <div className="text-textPearl font-bold text-[11px]">{order.estimatedStartStr} - {order.estimatedFinishStr}</div>
                        <div className="text-[9px] text-slate-500 mt-0.5">({prepTime}m duration)</div>
                      </td>

                      {/* Actions (Reorder) */}
                      <td className="px-4 py-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            disabled={idx === 0}
                            onClick={() => handleMoveQueue(idx, 'up')}
                            className="p-1.5 bg-slate-950 border border-slate-800 text-slate-400 hover:text-textPearl rounded-lg disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-900 transition-colors font-bold"
                            title="Move Up"
                          >
                            ▲
                          </button>
                          <button
                            disabled={idx === queueWithTimings.length - 1}
                            onClick={() => handleMoveQueue(idx, 'down')}
                            className="p-1.5 bg-slate-950 border border-slate-800 text-slate-400 hover:text-textPearl rounded-lg disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-900 transition-colors font-bold"
                            title="Move Down"
                          >
                            ▼
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5 text-left select-none pb-24">

      {/* ── Page Header ── */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-extrabold text-textPearl">Kitchen Display System</h1>
          <p className="text-xs text-mutedAsh font-semibold">
            Live order feed · Real-time metrics · Bulk operations
          </p>
        </div>

        {/* Status strip */}
        <div className="flex items-center space-x-2 text-xs font-bold flex-wrap gap-y-2">
          <div className="flex items-center space-x-1.5 bg-blue-950/20 border border-blue-500/20 px-3 py-1.5 rounded-xl">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
            <span className="text-blue-400">{newCount} New</span>
          </div>
          <div className="flex items-center space-x-1.5 bg-orange-950/20 border border-orange-500/20 px-3 py-1.5 rounded-xl">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
            <span className="text-orange-400">{prepCount} Cooking</span>
          </div>
          <div className="flex items-center space-x-1.5 bg-emerald-950/20 border border-emerald-500/20 px-3 py-1.5 rounded-xl">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span className="text-emerald-400">{readyCount} Ready</span>
          </div>
          {metrics.delayedOrders > 0 && (
            <div className="flex items-center space-x-1.5 bg-red-950/20 border border-red-500/30 px-3 py-1.5 rounded-xl animate-pulse">
              <AlertTriangle className="w-3 h-3 text-red-400" />
              <span className="text-red-400">{metrics.delayedOrders} Delayed</span>
            </div>
          )}
          <div className="flex items-center space-x-1 text-slate-500 bg-slate-900/40 border border-slate-850 px-2.5 py-1.5 rounded-xl">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] uppercase tracking-wider">Live</span>
          </div>
        </div>
      </div>

      {/* ── Performance Stats Bar ── */}
      {!isLoading && <KitchenStatsBar metrics={metrics} targetPrepMinutes={targetPrepMinutes} />}

      {/* ── Insights + Tabs Row ── */}
      <div className="flex flex-col xl:flex-row gap-4">

        {/* Insights Panel (collapsible on mobile, sidebar on xl) */}
        {showInsights && (
          <div className="xl:w-64 shrink-0">
            <KitchenInsightsPanel metrics={metrics} orders={allOrders} />
          </div>
        )}

        {/* Main Column */}
        <div className="flex-1 min-w-0 space-y-4">

          {/* ── Tab Navigation + Controls Row ── */}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            {/* Tabs */}
            <div className="flex items-center space-x-1 p-1 bg-slate-900/30 border border-slate-850 rounded-2xl flex-wrap gap-y-1">
              {([
                { id: 'table',      label: 'Table View',    Icon: LayoutGrid,      activeColor: 'bg-blue-500/10 border-blue-500/30 text-blue-300',    iconColor: 'text-blue-400' },
                { id: 'category',   label: 'Category View', Icon: UtensilsCrossed, activeColor: 'bg-green-500/10 border-green-500/30 text-green-300',  iconColor: 'text-green-400' },
                { id: 'station',    label: 'Station View',  Icon: Layers,          activeColor: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-300',iconColor: 'text-yellow-400' },
                { id: 'item-queue', label: 'Item Queue',    Icon: ListOrdered,     activeColor: 'bg-red-500/10 border-red-500/30 text-red-300',         iconColor: 'text-red-400' },
                { id: 'queue',      label: 'Cooking Queue', Icon: ListOrdered,     activeColor: 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300', iconColor: 'text-indigo-400' },
              ] as const).map(({ id, label, Icon, activeColor, iconColor }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all border outline-none ${
                    activeTab === id
                      ? `${activeColor} border`
                      : 'text-slate-400 border-transparent hover:text-textPearl hover:bg-slate-900/40'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${activeTab === id ? '' : iconColor}`} />
                  <span>{label}</span>
                </button>
              ))}
            </div>

            {/* Right controls */}
            <div className="flex items-center space-x-2">
              {/* Insights toggle */}
              <button
                onClick={() => setShowInsights(s => !s)}
                className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-extrabold border transition-all ${
                  showInsights
                    ? 'bg-primary/10 border-primary/30 text-primary'
                    : 'bg-slate-900/40 border-slate-850 text-slate-400 hover:text-textPearl'
                }`}
                title="Toggle insights panel"
              >
                <Zap className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Insights</span>
              </button>

              {/* Filters toggle */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-extrabold border transition-all ${
                  showFilters
                    ? 'bg-primary/10 border-primary/30 text-primary'
                    : 'bg-slate-900/40 border-slate-850 text-slate-400 hover:text-textPearl'
                }`}
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Filters</span>
              </button>
            </div>
          </div>

          {/* ── Filter Panel ── */}
          {showFilters && (
            <Card className="p-4 border-slate-850 bg-slate-900/20">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3">
                {/* Search */}
                <div className="col-span-2 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Search table, order, customer, dish..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 text-xs bg-slate-950/40 border border-slate-850 rounded-xl text-textPearl outline-none focus:border-primary/50"
                  />
                </div>
                {/* Status */}
                <Select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                  options={[
                    { value: 'active',    label: 'Active Orders' },
                    { value: 'all',       label: 'All Statuses' },
                    { value: 'NEW',       label: 'New' },
                    { value: 'ACCEPTED',  label: 'Accepted' },
                    { value: 'PREPARING', label: 'Preparing' },
                    { value: 'PAUSED',    label: 'Paused' },
                    { value: 'READY',     label: 'Ready' },
                    { value: 'DELIVERED', label: 'Delivered' },
                  ]}
                />
                {/* Priority */}
                <Select
                  value={priorityFilter}
                  onChange={e => setPriorityFilter(e.target.value)}
                  options={[
                    { value: 'all',      label: 'All Priorities' },
                    { value: 'critical', label: '💥 Critical' },
                    { value: 'high',     label: '🔴 High Priority' },
                    { value: 'normal',   label: '🟡 Normal' },
                    { value: 'low',      label: '⚪ Low Priority' },
                  ]}
                />
                {/* Category */}
                <Select
                  value={categoryFilter}
                  onChange={e => setCategoryFilter(e.target.value)}
                  options={[
                    { value: 'all', label: 'All Categories' },
                    ...allCategories.map(c => ({ value: c, label: c })),
                  ]}
                />
                {/* Station */}
                <Select
                  value={stationFilter}
                  onChange={e => setStationFilter(e.target.value)}
                  options={[
                    { value: 'all', label: 'All Stations' },
                    ...ALL_STATIONS.map(s => ({ value: s, label: s })),
                  ]}
                />
                {/* Sort */}
                <Select
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value)}
                  options={[
                    { value: 'arrival',  label: 'Sort: Arrival' },
                    { value: 'priority', label: 'Sort: Priority' },
                    { value: 'prep',     label: 'Sort: Prep Time' },
                    { value: 'table',    label: 'Sort: Table No.' },
                    { value: 'elapsed',  label: 'Sort: Elapsed' },
                  ]}
                />
              </div>

              {/* Additional toggles */}
              <div className="flex items-center flex-wrap gap-3 mt-3 pt-3 border-t border-slate-850">
                {/* Delayed only toggle */}
                <button
                  onClick={() => setShowDelayedOnly(d => !d)}
                  className={`flex items-center space-x-2 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                    showDelayedOnly
                      ? 'bg-red-500/10 border-red-500/30 text-red-400'
                      : 'bg-slate-900/40 border-slate-850 text-slate-400 hover:text-textPearl'
                  }`}
                >
                  <AlertTriangle className="w-3 h-3" />
                  <span>Delayed Only</span>
                </button>

                {/* Target time selector */}
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                    Target:
                  </span>
                  {[10, 15, 20, 30].map(m => (
                    <button
                      key={m}
                      onClick={() => setTargetPrepMinutes(m)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold border transition-all ${
                        targetPrepMinutes === m
                          ? 'bg-primary/10 border-primary/30 text-primary'
                          : 'bg-slate-900/40 border-slate-850 text-slate-400 hover:text-textPearl'
                      }`}
                    >
                      {m}m
                    </button>
                  ))}
                </div>

                {/* Result count */}
                <span className="ml-auto text-[10px] text-slate-500 font-bold">
                  {filteredOrders.length} orders shown
                </span>
              </div>
            </Card>
          )}

          {/* ── Tab Content ── */}
          {isLoading ? (
            <div className="h-64 flex items-center justify-center">
              <LoadingSpinner label="Connecting to kitchen order stream..." />
            </div>
          ) : (
            <div>
              {activeTab === 'table'      && renderTableView()}
              {activeTab === 'category'   && renderCategoryView()}
              {activeTab === 'station'    && renderStationView()}
              {activeTab === 'item-queue' && renderItemQueueView()}
              {activeTab === 'queue'      && renderQueueView()}
            </div>
          )}
        </div>
      </div>

      {/* ── Floating Bulk Actions Toolbar ── */}
      <BulkActionsToolbar
        selectedCount={selectedIds.size}
        totalVisible={filteredOrders.length}
        allSelected={allSelected}
        onSelectAll={selectAll}
        onClearSelection={clearSelection}
        onRequestAction={handleBulkActionRequest}
      />

      {/* ── Bulk Confirm Dialog ── */}
      {bulkDialog.isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 w-full max-w-sm mx-4 shadow-2xl">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-base font-extrabold text-textPearl">Confirm Bulk Action</h2>
                <p className="text-xs text-mutedAsh mt-0.5">This will update {bulkDialog.count} orders.</p>
              </div>
              <button
                onClick={() => setBulkDialog(d => ({ ...d, isOpen: false }))}
                className="p-1.5 rounded-lg text-slate-500 hover:text-textPearl hover:bg-slate-800 transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-slate-950/50 border border-slate-800 rounded-xl p-4 mb-5 space-y-1">
              <p className="text-xs text-slate-400 font-semibold">
                Action: <span className="text-textPearl font-extrabold">{bulkDialog.action}</span>
              </p>
              <p className="text-xs text-slate-400 font-semibold">
                New Status: <span className="text-primary font-extrabold">{bulkDialog.nextStatus}</span>
              </p>
              <p className="text-xs text-slate-400 font-semibold">
                Orders: <span className="text-textPearl font-extrabold">{bulkDialog.count} tickets</span>
              </p>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => setBulkDialog(d => ({ ...d, isOpen: false }))}
                className="flex-1 py-2.5 rounded-xl text-xs font-extrabold border border-slate-700 text-slate-400 hover:text-textPearl hover:bg-slate-800 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={() => handleBulkStatusUpdate(bulkDialog.nextStatus)}
                className="flex-1 py-2.5 rounded-xl text-xs font-extrabold bg-primary/10 border border-primary/30 text-primary hover:bg-primary/20 transition-all flex items-center justify-center space-x-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Confirm</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default KitchenQueue;
