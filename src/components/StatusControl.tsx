import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';

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
  // State management
  const [isOpen, setIsOpen] = useState(false);
  const [anchor, setAnchor] = useState<DOMRect | null>(null);
  const [currentStatus, setCurrentStatus] = useState<EntityStatus>(row.status);
  const [isUpdating, setIsUpdating] = useState(false);
  
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
    setIsOpen(false);
    
    // Skip if status unchanged
    if (newStatus === currentStatus) return;
    
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
      
      console.log(`✅ Status updated: ${kind}[${row.id}] ${row.status} → ${newStatus} (v${row.version} → v${result.version})`);
      
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
  
  // Open dropdown
  const openDropdown = useCallback(() => {
    if (disabled || isUpdating) return;
    
    const triggerElement = triggerRef.current;
    if (!triggerElement) return;
    
    const rect = triggerElement.getBoundingClientRect();
    setAnchor(rect);
    setIsOpen(true);
  }, [disabled, isUpdating]);
  
  // Get available statuses for current entity type
  const availableStatuses = validStatuses[kind];
  
  // Default styles (integrates with RawaLite design system)
  const defaultButtonStyle: React.CSSProperties = {
    ...buttonStyle
  };
  
  const defaultDropdownStyle: React.CSSProperties = {
    position: 'fixed',
    top: anchor ? anchor.bottom + 6 : 0,
    left: anchor ? anchor.left : 0,
    zIndex: 9999,
    minWidth: anchor ? anchor.width : 120,
    maxWidth: '200px',
    ...dropdownStyle
  };
  
  const getOptionStyle = (isSelected: boolean): React.CSSProperties => ({
    display: 'block',
    width: '100%',
    padding: '8px 12px',
    border: 'none',
    backgroundColor: isSelected ? 'var(--accent, #f0f0f0)' : 'transparent',
    color: isSelected ? 'var(--card-bg, #fff)' : 'var(--text-primary, inherit)',
    textAlign: 'left',
    cursor: 'pointer',
    fontSize: '12px',
    fontFamily: 'inherit',
    fontWeight: isSelected ? '600' : '400',
    borderRadius: '3px',
    margin: '1px 0',
    transition: 'all 0.15s ease'
  });
  
  // Render trigger button with integrated design
  const triggerButton = (
    <button
      ref={triggerRef}
      onClick={openDropdown}
      disabled={disabled || isUpdating}
      style={defaultButtonStyle}
      className={`status-control-button ${className || ''}`}
      aria-haspopup="listbox"
      aria-expanded={isOpen}
      title={isUpdating ? 'Status wird aktualisiert...' : `Status ändern (aktuell: ${statusLabels[currentStatus]})`}
    >
      <span>{statusLabels[currentStatus]}</span>
      {isUpdating ? (
        <span style={{ fontSize: '10px' }}>⏳</span>
      ) : (
        <span style={{ fontSize: '10px', color: 'var(--muted, #999)' }}>▼</span>
      )}
    </button>
  );
  
  // Render dropdown (portal-based)
  const dropdown = isOpen && anchor && (
    <div
      ref={dropdownRef}
      style={defaultDropdownStyle}
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