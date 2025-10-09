/**
 * Global Event Bus für Hook-Invalidation
 * 
 * Löst das Problem: StatusControl updatet Database erfolgreich, aber andere
 * Hook-Instanzen (Sidebar, HeaderStatistics) bekommen keine Invalidation.
 * 
 * Pattern:
 * 1. StatusControl löst nach erfolgreichem Update ein Event aus
 * 2. Alle Hook-Instanzen hören auf Events und re-fetchen ihre Daten
 * 3. Respektiert FIX-009 vollständig - keine Änderung am Status-System
 */

type EventName = 'offer-updated' | 'invoice-updated' | 'timesheet-updated' | 'entity-status-changed';

interface EventPayload {
  entityType: 'offer' | 'invoice' | 'timesheet';
  entityId: number;
  oldStatus?: string;
  newStatus: string;
  version: number;
}

type EventListener = (payload: EventPayload) => void;

class HookEventBus {
  private listeners: Map<EventName, Set<EventListener>> = new Map();

  /**
   * Register an event listener
   */
  on(eventName: EventName, listener: EventListener): () => void {
    if (!this.listeners.has(eventName)) {
      this.listeners.set(eventName, new Set());
    }
    
    this.listeners.get(eventName)!.add(listener);
    
    // Return cleanup function
    return () => {
      this.listeners.get(eventName)?.delete(listener);
    };
  }

  /**
   * Emit an event to all listeners
   */
  emit(eventName: EventName, payload: EventPayload): void {
    const listeners = this.listeners.get(eventName);
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(payload);
        } catch (error) {
          console.error(`Error in event listener for ${eventName}:`, error);
        }
      });
    }

    // Also emit a generic status change event for broad invalidation
    if (eventName !== 'entity-status-changed') {
      this.emit('entity-status-changed', payload);
    }
  }

  /**
   * Emit an entity update event (convenience method)
   */
  emitEntityUpdate(entityType: 'offer' | 'invoice' | 'timesheet', entityId: number, data: any): void {
    const eventName = `${entityType}-updated` as EventName;
    
    this.emit(eventName, {
      entityType,
      entityId,
      oldStatus: data.oldStatus,
      newStatus: data.status,
      version: data.version
    });
  }

  /**
   * Get event bus statistics (for debugging)
   */
  getStats(): Record<EventName, number> {
    const stats: Partial<Record<EventName, number>> = {};
    
    this.listeners.forEach((listeners, eventName) => {
      stats[eventName] = listeners.size;
    });
    
    return stats as Record<EventName, number>;
  }
}

// Global singleton instance
export const hookEventBus = new HookEventBus();

/**
 * React hook for listening to hook invalidation events
 * 
 * Usage:
 * ```typescript
 * useHookInvalidation('offer-updated', (payload) => {
 *   // Re-fetch data when offers are updated
 *   loadOffers();
 * });
 * ```
 */
export function useHookInvalidation(
  eventName: EventName, 
  listener: EventListener
): void {
  React.useEffect(() => {
    const cleanup = hookEventBus.on(eventName, listener);
    return cleanup;
  }, [eventName, listener]);
}

// React import for the hook
import React from 'react';