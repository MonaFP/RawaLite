import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { hookEventBus } from '../hooks/useHookEventBus';

// Type definitions for different entity statuses
type OfferStatus = 'draft' | 'sent' | 'accepted' | 'rejected';
type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
type TimesheetStatus = 'draft' | 'sent' | 'accepted' | 'rejected';

type EntityStatus = OfferStatus | InvoiceStatus | TimesheetStatus;
type EntityKind = 'offer' | 'invoice' | 'timesheet';

// Status labels mapping
const statusLabels: Record<EntityStatus, string> = {
  // Common statuses
  draft: 'Entwurf',
  sent: 'Gesendet',
  accepted: 'Angenommen',
  rejected: 'Abgelehnt',
  
  // Invoice-specific statuses
  paid: 'Bezahlt',
  overdue: 'Überfällig',
  cancelled: 'Storniert'
};

// Valid statuses for each entity type
const validStatuses: Record<EntityKind, EntityStatus[]> = {
  offer: ['draft', 'sent', 'accepted', 'rejected'],
  invoice: ['draft', 'sent', 'paid', 'overdue', 'cancelled'],
  timesheet: ['draft', 'sent', 'accepted', 'rejected']
};

// Props for the StatusControl component
interface StatusControlProps {
  /** Entity data with id, status, and version for optimistic locking */
  row: {
    id: number;
    status: EntityStatus;
    version: number;
  };
  /** Entity type - determines available statuses and IPC channel */
  kind: EntityKind;
  /** Callback when status is successfully updated */
  onUpdated: (updatedEntity: any) => void;
  /** Optional callback for error handling */
  onError?: (error: Error) => void;
  /** Optional custom styling for the trigger button */
  buttonStyle?: React.CSSProperties;
  /** Optional custom styling for the dropdown */
  dropdownStyle?: React.CSSProperties;
  /** Optional CSS classes for customization */
  className?: string;
  /** Disable the control */
  disabled?: boolean;
}

/**
 * StatusControl - Headless popover component for entity status changes
 * 
 * Features:
 * - CSS-free design (fully customizable via props)
 * - Portal-based dropdown (avoids CSS conflicts)
 * - Optimistic locking with conflict resolution
 * - Type-safe status validation per entity type
 * - Automatic cleanup and keyboard support
 * - Error handling with rollback
 */
export function StatusControl({
  row,
  kind,
  onUpdated,
  onError,
  buttonStyle,
  dropdownStyle,
  className,
  disabled = false
}: StatusControlProps) {
  console.log('🏗️ StatusControl MOUNTED:', {
    kind,
    entityId: row.id,
    status: row.status,
    version: row.version,
    disabled,
    timestamp: Date.now()
  });
  
  // State management
  const [isOpen, setIsOpen] = useState(false);
  const [anchor, setAnchor] = useState<DOMRect | null>(null);
  const [currentStatus, setCurrentStatus] = useState<EntityStatus>(row.status);
  const [isUpdating, setIsUpdating] = useState(false);
  
  // Debug logging removed for clean UI
  
  // Refs
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Sync status with row prop changes
  useEffect(() => {
    setCurrentStatus(row.status);
  }, [row.status]);
  
  // Close dropdown on outside click or escape key
  useEffect(() => {
    if (!isOpen) return;
    
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);
  
  // Handle status selection
  const handleStatusSelect = useCallback(async (newStatus: EntityStatus) => {
    console.log('🔍 StatusControl handleStatusSelect called:', {
      kind,
      entityId: row.id,
      oldStatus: currentStatus,
      newStatus,
      unchanged: newStatus === currentStatus
    });
    
    setIsOpen(false);
    
    // Skip if status unchanged
    if (newStatus === currentStatus) {
      console.log('⚠️ StatusControl skipping - status unchanged');
      return;
    }
    
    // Optimistic update
    setCurrentStatus(newStatus);
    setIsUpdating(true);
    
    try {
      // Call appropriate IPC method based on entity kind
      let result;
      const params = {
        id: row.id,
        status: newStatus,
        expectedVersion: row.version
      };
      
      switch (kind) {
        case 'offer':
          result = await (window as any).rawalite.status.updateOfferStatus(params);
          break;
        case 'invoice':
          result = await (window as any).rawalite.status.updateInvoiceStatus(params);
          break;
        case 'timesheet':
          result = await (window as any).rawalite.status.updateTimesheetStatus(params);
          break;
        default:
          throw new Error(`Unknown entity kind: ${kind}`);
      }
      
      // Success - notify parent with updated data
      onUpdated(result);
      
      // 🔥 NEW: Emit event for hook invalidation (keeps FIX-009 intact)
      hookEventBus.emitEntityUpdate(kind, row.id, {
        oldStatus: currentStatus,
        status: newStatus,
        version: result.version
      });
      
      console.log(`✅ Status updated: ${kind}[${row.id}] ${row.status} → ${newStatus} (v${row.version} → v${result.version})`);
      console.log(`📡 Event emitted for hook invalidation: ${kind}-updated`);
      
    } catch (error) {
      // Rollback optimistic update
      setCurrentStatus(row.status);
      
      console.error('Status update failed:', error);
      
      // Handle different error types
      let errorMessage = 'Status-Änderung fehlgeschlagen';
      
      if (error instanceof Error) {
        if (error.message.includes('conflict')) {
          errorMessage = 'Konflikt: Die Daten wurden von einem anderen Benutzer geändert. Bitte laden Sie die Seite neu.';
        } else if (error.message.includes('not found')) {
          errorMessage = 'Eintrag nicht gefunden. Bitte laden Sie die Seite neu.';
        } else {
          errorMessage = `Fehler: ${error.message}`;
        }
      }
      
      // Call error handler or show default error
      if (onError) {
        onError(new Error(errorMessage));
      } else {
        // Fallback: show browser alert (can be replaced with toast system)
        alert(errorMessage);
      }
    } finally {
      setIsUpdating(false);
    }
  }, [currentStatus, row, kind, onUpdated, onError]);
  
  // Toggle dropdown (open/close)
  const toggleDropdown = useCallback(() => {
    console.log('🔍 StatusControl toggleDropdown called:', {
      kind,
      entityId: row.id,
      disabled,
      isUpdating,
      currentIsOpen: isOpen,
      triggerExists: !!triggerRef.current
    });
    
    if (disabled || isUpdating) {
      console.log('⚠️ StatusControl toggleDropdown blocked:', { disabled, isUpdating });
      return;
    }
    
    // If already open, close it
    if (isOpen) {
      console.log('✅ StatusControl closing dropdown:', { kind, entityId: row.id });
      setIsOpen(false);
      setAnchor(null);
      return;
    }
    
    // If closed, open it
    const triggerElement = triggerRef.current;
    if (!triggerElement) {
      console.log('❌ StatusControl toggleDropdown - no trigger element');
      return;
    }
    
    const rect = triggerElement.getBoundingClientRect();
    console.log('✅ StatusControl opening dropdown:', { rect, kind, entityId: row.id });
    setAnchor(rect);
    setIsOpen(true);
  }, [disabled, isUpdating, kind, row.id, isOpen]);
  
  // Get available statuses for current entity type
  const availableStatuses = validStatuses[kind];
  
  // 🎨 CSS Variables: Nutze dezente Pastel-Farben aus status-core.css
  const getStatusCSSVariable = (status: string) => {
    return `var(--status-${status}-color, #6b7280)`;
  };
  
  const statusBgColor = getStatusCSSVariable(currentStatus);
  
  // Minimale Inline Styles nur für dynamische Werte
  const dynamicButtonStyle: React.CSSProperties = {
    backgroundColor: statusBgColor,
    opacity: disabled ? 0.6 : 1,
    ...buttonStyle  // Allow external overrides
  };
  
  // Minimale Dropdown Styles nur für dynamische Positionierung
  const dynamicDropdownStyle: React.CSSProperties = {
    position: 'fixed',
    top: anchor ? anchor.bottom + 4 : 0,
    left: anchor ? anchor.left : 0,
    minWidth: anchor ? anchor.width : 120,
    maxWidth: '220px',
    ...dropdownStyle  // Allow external overrides
  };
  
  // Keine getOptionStyle Funktion mehr nötig - verwende CSS-Klassen
  
  // Render trigger button with integrated design + EMERGENCY CSS OVERRIDE
  const triggerButton = (
    <button
      ref={triggerRef}
      onClick={toggleDropdown}
      disabled={disabled || isUpdating}
      style={dynamicButtonStyle}
      className={`status-control-button ${className || ''}`}
      aria-haspopup="listbox"
      aria-expanded={isOpen}
      title={isUpdating ? 'Status wird aktualisiert...' : `Status ändern (aktuell: ${statusLabels[currentStatus]})`}
    >
      <span style={{ flex: 1, textAlign: 'left' }}>{statusLabels[currentStatus]}</span>
      {isUpdating ? (
        <span style={{ fontSize: '11px', opacity: 0.8 }}>⏳</span>
      ) : (
        <span style={{ 
          fontSize: '10px', 
          color: 'rgba(255, 255, 255, 0.7)', 
          transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
          transition: 'transform 0.2s ease'
        }}>▼</span>
      )}
    </button>
  );
  
  // Render dropdown (portal-based)
  const dropdown = isOpen && anchor && (
    <div
      ref={dropdownRef}
      style={dynamicDropdownStyle}
      className="status-control-dropdown"
      role="listbox"
      aria-label="Status auswählen"
    >
      {availableStatuses.map((status) => (
        <button
          key={status}
          onClick={() => handleStatusSelect(status)}

          className={`status-control-option ${status === currentStatus ? 'selected' : ''}`}
          role="option"
          aria-selected={status === currentStatus}
        >
          {statusLabels[status]}
          {status === currentStatus && (
            <span style={{ marginLeft: '8px', fontSize: '10px' }}>✓</span>
          )}
        </button>
      ))}
    </div>
  );
  
  return (
    <>
      {triggerButton}
      {dropdown && createPortal(dropdown, document.body)}
    </>
  );
}