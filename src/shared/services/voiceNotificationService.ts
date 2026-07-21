/**
 * Voice Notification Service — Framework Only (Part 21)
 * 
 * Provides event queue infrastructure for kitchen voice notifications.
 * Actual speech synthesis is NOT implemented — this is the service architecture
 * for future integration with Web Speech API or third-party TTS.
 */
import { TVoiceEventType, IVoiceNotification, TPriority } from '../domain/orders/types';

type TVoiceHandler = (notification: IVoiceNotification) => void;

class VoiceNotificationService {
  private queue: IVoiceNotification[] = [];
  private handlers: Set<TVoiceHandler> = new Set();
  private enabled: boolean = true;
  private maxQueueSize: number = 50;

  /**
   * Queue a new voice notification event.
   * In the future, this would trigger actual TTS playback.
   */
  notify(type: TVoiceEventType, message: string, priority: TPriority = 'normal'): void {
    if (!this.enabled) return;

    const notification: IVoiceNotification = {
      id: `voice-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      type,
      message,
      priority,
      createdAt: new Date().toISOString(),
      acknowledged: false,
    };

    this.queue.push(notification);

    // Trim queue if too large
    if (this.queue.length > this.maxQueueSize) {
      this.queue = this.queue.slice(-this.maxQueueSize);
    }

    // Notify all subscribers
    this.handlers.forEach(handler => {
      try {
        handler(notification);
      } catch (err) {
        console.error('[VoiceNotificationService] Handler error:', err);
      }
    });

    // Log for debugging
    console.log(`[VoiceNotification] ${type}: ${message}`);
  }

  /**
   * Subscribe to voice notification events.
   * Returns an unsubscribe function.
   */
  subscribe(handler: TVoiceHandler): () => void {
    this.handlers.add(handler);
    return () => {
      this.handlers.delete(handler);
    };
  }

  /**
   * Get the current notification queue.
   */
  getQueue(): IVoiceNotification[] {
    return [...this.queue];
  }

  /**
   * Get unacknowledged notifications.
   */
  getUnacknowledged(): IVoiceNotification[] {
    return this.queue.filter(n => !n.acknowledged);
  }

  /**
   * Acknowledge a notification (mark as read/handled).
   */
  acknowledge(notificationId: string): void {
    const notification = this.queue.find(n => n.id === notificationId);
    if (notification) {
      notification.acknowledged = true;
    }
  }

  /**
   * Acknowledge all notifications.
   */
  acknowledgeAll(): void {
    this.queue.forEach(n => { n.acknowledged = true; });
  }

  /**
   * Clear the entire queue.
   */
  clearQueue(): void {
    this.queue = [];
  }

  /**
   * Enable or disable voice notifications.
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  /**
   * Check if voice notifications are enabled.
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  // ── Convenience Methods (Pre-built notification templates) ──────────────

  notifyNewOrder(orderId: string, tableNumber: string): void {
    this.notify('NEW_ORDER', `New order ${orderId} from Table ${tableNumber}`, 'normal');
  }

  notifyOrderReady(orderId: string, tableNumber: string): void {
    this.notify('ORDER_READY', `Order ${orderId} for Table ${tableNumber} is ready`, 'high');
  }

  notifyLowStock(itemName: string, remaining: number): void {
    this.notify('LOW_STOCK', `Low stock: ${itemName} — ${remaining} portions remaining`, 'high');
  }

  notifyPrepareBatch(itemName: string, quantity: number): void {
    this.notify('PREPARE_BATCH', `Prepare batch: ${quantity} portions of ${itemName}`, 'normal');
  }

  notifyRushOrder(orderId: string, tableNumber: string): void {
    this.notify('RUSH_ORDER', `Rush order! ${orderId} from Table ${tableNumber}`, 'critical');
  }

  notifyAnnouncement(message: string): void {
    this.notify('ANNOUNCEMENT', message, 'normal');
  }
}

// Singleton instance
export const voiceNotificationService = new VoiceNotificationService();
