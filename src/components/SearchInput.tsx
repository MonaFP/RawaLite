/**
 * RawaLite - Search Component
 * Debounced Suchfeld für Listen-Seiten
 */
import React, { useState, useEffect, useCallback } from 'react';

interface SearchProps {
  value?: string;
  onSearch: (query: string) => void;
  placeholder?: string;
  debounceMs?: number;
  disabled?: boolean;
}

export function SearchInput({ 
  value = '', 
  onSearch, 
  placeholder = 'Suchen...', 
  debounceMs = 250,
  disabled = false 
}: SearchProps) {
  const [localValue, setLocalValue] = useState(value);

  // Debounced search
  const debouncedSearch = useCallback(() => {
    const trimmed = localValue.trim();
    onSearch(trimmed);
  }, [localValue, onSearch]);

  useEffect(() => {
    const timer = setTimeout(debouncedSearch, debounceMs);
    return () => clearTimeout(timer);
  }, [debouncedSearch, debounceMs]);

  // Sync with external value changes
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleClear = () => {
    setLocalValue('');
    onSearch('');
  };

  return (
    <div style={{ 
      position: 'relative', 
      display: 'inline-block',
      minWidth: '300px' 
    }}>
      <input
        type="text"
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        style={{
          width: '100%',
          padding: '8px 36px 8px 12px',
          border: '1px solid var(--border)',
          borderRadius: '4px',
          fontSize: '14px',
          background: 'var(--background)',
          color: 'var(--foreground)',
          outline: 'none'
        }}
        onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
        onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
      />
      
      {/* Search Icon */}
      <div style={{
        position: 'absolute',
        right: '8px',
        top: '50%',
        transform: 'translateY(-50%)',
        pointerEvents: 'none',
        color: 'var(--muted-foreground)',
        fontSize: '16px'
      }}>
        🔍
      </div>

      {/* Clear Button */}
      {localValue && (
        <button
          onClick={handleClear}
          style={{
            position: 'absolute',
            right: '28px',
            top: '50%',
            transform: 'translateY(-50%)',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--muted-foreground)',
            fontSize: '16px',
            padding: '2px'
          }}
          title="Löschen"
        >
          ✕
        </button>
      )}
    </div>
  );
}