import React, { useState, useRef, useEffect } from 'react';
import { FilterConfig } from './useTableSearch';

interface FilterDropdownProps {
  config: FilterConfig;
  value: any;
  onChange: (value: any) => void;
  className?: string;
}

export const FilterDropdown: React.FC<FilterDropdownProps> = ({
  config,
  value,
  onChange,
  className = ""
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [tempValue, setTempValue] = useState(value);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Theme colors
  const primaryColor = '#b87ba2';
  const accentColor = '#735a65';
  const backgroundColor = '#ffffff';

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  const handleSelectOption = (option: string) => {
    onChange(option);
    setIsOpen(false);
  };

  const handleDateRangeChange = (field: 'from' | 'to', dateValue: string) => {
    const newValue = {
      ...tempValue,
      [field]: dateValue
    };
    setTempValue(newValue);
    onChange(newValue);
  };

  const handleNumberRangeChange = (field: 'min' | 'max', numValue: string) => {
    const newValue = {
      ...tempValue,
      [field]: numValue ? Number(numValue) : null
    };
    setTempValue(newValue);
    onChange(newValue);
  };

  const getDisplayValue = () => {
    switch (config.type) {
      case 'select':
        if (!value || value === 'all') return 'Alle';
        return config.options?.find(opt => opt === value) || value;
        
      case 'dateRange':
        if (!value?.from && !value?.to) return 'Zeitraum';
        const from = value?.from ? new Date(value.from).toLocaleDateString('de-DE') : '';
        const to = value?.to ? new Date(value.to).toLocaleDateString('de-DE') : '';
        if (from && to) return `${from} - ${to}`;
        if (from) return `ab ${from}`;
        if (to) return `bis ${to}`;
        return 'Zeitraum';
        
      case 'numberRange':
        if (!value?.min && !value?.max) return 'Betrag';
        const min = value?.min ? `${value.min}€` : '';
        const max = value?.max ? `${value.max}€` : '';
        if (min && max) return `${min} - ${max}`;
        if (min) return `ab ${min}`;
        if (max) return `bis ${max}`;
        return 'Betrag';
        
      default:
        return value || config.label;
    }
  };

  const hasValue = () => {
    switch (config.type) {
      case 'select':
        return value && value !== 'all';
      case 'dateRange':
        return value?.from || value?.to;
      case 'numberRange':
        return value?.min != null || value?.max != null;
      default:
        return !!value;
    }
  };

  return (
    <div ref={dropdownRef} className={`filter-dropdown ${className}`} style={{ position: 'relative' }}>
      <button
        onClick={handleToggle}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 12px',
          border: `2px solid ${hasValue() ? primaryColor : accentColor}20`,
          borderRadius: '6px',
          backgroundColor: hasValue() ? `${primaryColor}10` : backgroundColor,
          color: hasValue() ? primaryColor : '#333',
          fontSize: '14px',
          fontWeight: hasValue() ? '500' : 'normal',
          cursor: 'pointer',
          minWidth: '140px',
          height: '38px',
          transition: 'all 0.2s ease'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = `${primaryColor}40`;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = hasValue() ? primaryColor : `${accentColor}20`;
        }}
      >
        <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
          {getDisplayValue()}
        </span>
        <span style={{ 
          marginLeft: '8px', 
          fontSize: '12px',
          transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
          transition: 'transform 0.2s ease'
        }}>
          ▼
        </span>
      </button>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            marginTop: '4px',
            backgroundColor: backgroundColor,
            border: `1px solid ${accentColor}30`,
            borderRadius: '6px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            zIndex: 1000,
            maxHeight: '300px',
            overflowY: 'auto'
          }}
        >
          {config.type === 'select' && (
            <div>
              <div
                onClick={() => handleSelectOption('all')}
                style={{
                  padding: '10px 12px',
                  cursor: 'pointer',
                  borderBottom: `1px solid ${accentColor}20`,
                  backgroundColor: (!value || value === 'all') ? `${primaryColor}20` : 'transparent',
                  transition: 'background-color 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  if (value !== 'all') e.currentTarget.style.backgroundColor = `${accentColor}10`;
                }}
                onMouseLeave={(e) => {
                  if (value !== 'all') e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                Alle
              </div>
              {config.options?.map((option, index) => {
                // Handle both string options and object options {value, label}
                const optionValue = typeof option === 'string' ? option : option.value;
                const optionLabel = typeof option === 'string' ? option : option.label;
                
                return (
                  <div
                    key={index}
                    onClick={() => handleSelectOption(optionValue)}
                    style={{
                      padding: '10px 12px',
                      cursor: 'pointer',
                      backgroundColor: value === optionValue ? `${primaryColor}20` : 'transparent',
                      transition: 'background-color 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      if (value !== optionValue) e.currentTarget.style.backgroundColor = `${accentColor}10`;
                    }}
                    onMouseLeave={(e) => {
                      if (value !== optionValue) e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    {optionLabel}
                  </div>
                );
              })}
            </div>
          )}

          {config.type === 'dateRange' && (
            <div style={{ padding: '12px' }}>
              <div style={{ marginBottom: '8px' }}>
                <label style={{ display: 'block', fontSize: '12px', color: accentColor, marginBottom: '4px' }}>
                  Von:
                </label>
                <input
                  type="date"
                  value={tempValue?.from || ''}
                  onChange={(e) => handleDateRangeChange('from', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '6px 8px',
                    border: `1px solid ${accentColor}30`,
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: accentColor, marginBottom: '4px' }}>
                  Bis:
                </label>
                <input
                  type="date"
                  value={tempValue?.to || ''}
                  onChange={(e) => handleDateRangeChange('to', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '6px 8px',
                    border: `1px solid ${accentColor}30`,
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}
                />
              </div>
            </div>
          )}

          {config.type === 'numberRange' && (
            <div style={{ padding: '12px' }}>
              <div style={{ marginBottom: '8px' }}>
                <label style={{ display: 'block', fontSize: '12px', color: accentColor, marginBottom: '4px' }}>
                  Min €:
                </label>
                <input
                  type="number"
                  placeholder="0"
                  value={tempValue?.min || ''}
                  onChange={(e) => handleNumberRangeChange('min', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '6px 8px',
                    border: `1px solid ${accentColor}30`,
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: accentColor, marginBottom: '4px' }}>
                  Max €:
                </label>
                <input
                  type="number"
                  placeholder="∞"
                  value={tempValue?.max || ''}
                  onChange={(e) => handleNumberRangeChange('max', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '6px 8px',
                    border: `1px solid ${accentColor}30`,
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FilterDropdown;