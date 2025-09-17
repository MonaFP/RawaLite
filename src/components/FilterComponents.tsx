/**
 * RawaLite - Filter Components
 * Wiederverwendbare Filter-Komponenten für Listen
 */
import React, { useState } from 'react';

// Base Filter Chip Component
export interface FilterChip {
  key: string;
  label: string;
  value: any;
  removable?: boolean;
}

interface FilterChipsProps {
  filters: FilterChip[];
  onRemove: (filterKey: string) => void;
  onClearAll?: () => void;
}

export function FilterChips({ filters, onRemove, onClearAll }: FilterChipsProps) {
  if (filters.length === 0) return null;

  return (
    <div style={{ 
      display: 'flex', 
      flexWrap: 'wrap', 
      gap: '8px', 
      alignItems: 'center',
      margin: '8px 0' 
    }}>
      <span style={{ fontSize: '14px', opacity: 0.7, marginRight: '4px' }}>
        Filter:
      </span>
      
      {filters.map(filter => (
        <div
          key={filter.key}
          style={{
            display: 'flex',
            alignItems: 'center',
            background: 'var(--primary)',
            color: 'white',
            padding: '4px 8px',
            borderRadius: '12px',
            fontSize: '12px',
            gap: '6px'
          }}
        >
          <span>{filter.label}</span>
          {filter.removable !== false && (
            <button
              onClick={() => onRemove(filter.key)}
              style={{
                background: 'none',
                border: 'none',
                color: 'white',
                cursor: 'pointer',
                fontSize: '10px',
                padding: '0 2px',
                borderRadius: '50%'
              }}
              title={`${filter.label} entfernen`}
            >
              ✕
            </button>
          )}
        </div>
      ))}
      
      {onClearAll && filters.length > 1 && (
        <button
          onClick={onClearAll}
          style={{
            background: 'none',
            border: '1px solid var(--border)',
            color: 'var(--foreground)',
            padding: '4px 8px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px'
          }}
        >
          Alle entfernen
        </button>
      )}
    </div>
  );
}

// Multi-Select Dropdown
export interface MultiSelectOption {
  value: string;
  label: string;
  count?: number; // Optional: Anzahl der Einträge
}

interface MultiSelectProps {
  options: MultiSelectOption[];
  selected: string[];
  onSelectionChange: (selected: string[]) => void;
  label: string;
  disabled?: boolean;
  maxHeight?: number;
}

export function MultiSelect({ 
  options, 
  selected, 
  onSelectionChange, 
  label, 
  disabled = false,
  maxHeight = 200 
}: MultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleToggleOption = (value: string) => {
    const newSelected = selected.includes(value)
      ? selected.filter(v => v !== value)
      : [...selected, value];
    
    onSelectionChange(newSelected);
  };

  const selectedLabels = selected
    .map(value => options.find(opt => opt.value === value)?.label)
    .filter(Boolean)
    .join(', ');

  return (
    <div style={{ position: 'relative', display: 'inline-block', minWidth: '150px' }}>
      <button
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        style={{
          width: '100%',
          padding: '8px 12px',
          border: '1px solid var(--border)',
          borderRadius: '4px',
          background: 'var(--background)',
          color: 'var(--foreground)',
          cursor: disabled ? 'not-allowed' : 'pointer',
          textAlign: 'left',
          fontSize: '14px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <span style={{ 
          overflow: 'hidden', 
          textOverflow: 'ellipsis', 
          whiteSpace: 'nowrap' 
        }}>
          {selected.length > 0 ? selectedLabels : label}
        </span>
        <span style={{ marginLeft: '8px', fontSize: '12px' }}>
          {selected.length > 0 && `(${selected.length})`} ▼
        </span>
      </button>

      {isOpen && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          background: 'var(--background)',
          border: '1px solid var(--border)',
          borderRadius: '4px',
          zIndex: 1000,
          maxHeight: `${maxHeight}px`,
          overflowY: 'auto',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          {options.map(option => (
            <label
              key={option.value}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '8px 12px',
                cursor: 'pointer',
                fontSize: '14px',
                borderBottom: '1px solid var(--border)'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--muted)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <input
                type="checkbox"
                checked={selected.includes(option.value)}
                onChange={() => handleToggleOption(option.value)}
                style={{ marginRight: '8px' }}
              />
              <span style={{ flex: 1 }}>{option.label}</span>
              {option.count !== undefined && (
                <span style={{ 
                  fontSize: '12px', 
                  opacity: 0.7, 
                  marginLeft: '8px' 
                }}>
                  ({option.count})
                </span>
              )}
            </label>
          ))}
          
          {options.length === 0 && (
            <div style={{ 
              padding: '12px', 
              fontSize: '14px', 
              opacity: 0.7, 
              textAlign: 'center' 
            }}>
              Keine Optionen verfügbar
            </div>
          )}
        </div>
      )}

      {/* Close dropdown when clicking outside */}
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 999
          }}
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}

// Date Range Filter
interface DateRangeProps {
  from?: string;
  to?: string;
  onChange: (from?: string, to?: string) => void;
  label: string;
}

export function DateRangeFilter({ from, to, onChange, label }: DateRangeProps) {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
      <label style={{ fontSize: '14px', minWidth: '80px' }}>{label}:</label>
      
      <input
        type="date"
        value={from || ''}
        onChange={(e) => onChange(e.target.value || undefined, to)}
        style={{
          padding: '6px 8px',
          border: '1px solid var(--border)',
          borderRadius: '4px',
          fontSize: '12px',
          background: 'var(--background)',
          color: 'var(--foreground)'
        }}
      />
      
      <span style={{ fontSize: '14px' }}>bis</span>
      
      <input
        type="date"
        value={to || ''}
        onChange={(e) => onChange(from, e.target.value || undefined)}
        style={{
          padding: '6px 8px',
          border: '1px solid var(--border)',
          borderRadius: '4px',
          fontSize: '12px',
          background: 'var(--background)',
          color: 'var(--foreground)'
        }}
      />
      
      {(from || to) && (
        <button
          onClick={() => onChange(undefined, undefined)}
          style={{
            background: 'none',
            border: '1px solid var(--border)',
            padding: '4px 8px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px',
            color: 'var(--foreground)'
          }}
          title="Zeitraum zurücksetzen"
        >
          ✕
        </button>
      )}
    </div>
  );
}