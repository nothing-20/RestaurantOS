/**
 * KDS-specific types used across kitchen dashboard components.
 * These extend or compose the global types from src/types/index.ts.
 */
import { IOrder } from '../../types';

// ─── Tab Identifiers ──────────────────────────────────────────────────────────

export type TKdsTab = 'table' | 'category' | 'station' | 'item-queue' | 'queue';

// ─── Status & Priority ────────────────────────────────────────────────────────

export type TOrderStatus =
  | 'NEW' | 'PLACED' | 'ACCEPTED' | 'PREPARING' | 'PAUSED'
  | 'READY' | 'DELIVERED' | 'COMPLETED' | 'ARCHIVED' | 'CANCELLED';

export type TPriority = 'critical' | 'high' | 'normal' | 'low';

// ─── Extended Order (KDS view model) ─────────────────────────────────────────

export interface IKdsOrder extends IOrder {
  /** Firestore document ID (equals orderId in this schema) */
  id?: string;
  tableId?: string;
  /** Order-level special instructions */
  notes?: string;
  /** Override estimated prep time in minutes (default: items.length × 5) */
  estimatedPrepTime?: number;
}

// ─── Computed Kitchen Metrics (derived from orders, no extra reads) ────────────

export interface IKdsMetrics {
  activeOrders: number;
  preparingOrders: number;
  readyOrders: number;
  avgPrepTimeMinutes: number;       // mean ACCEPTED → READY for timeline-tracked orders
  delayedOrders: number;            // active orders exceeding threshold
  completedToday: number;           // DELIVERED or COMPLETED today
  kitchenEfficiencyPct: number;     // % completed within targetPrepMinutes
  peakQueueToday: number;           // max simultaneous active orders this session
  longestWaitingOrderId: string | null;
  longestWaitingMinutes: number;
  fastestCompletedMinutes: number;  // min(prep time of completed today)
  ordersOver15Min: number;
  bottleneckStation: string | null; // station with most pending items
  avgTicketTimeMinutes: number;     // mean total time (CREATED → DELIVERED)
}

// ─── Bulk Action Dialog ───────────────────────────────────────────────────────

export interface IBulkConfirmDialog {
  isOpen: boolean;
  action: string;           // human-readable label
  nextStatus: TOrderStatus; // target status
  count: number;
}
