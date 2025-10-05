import React from 'react';
import SearchBar from './SearchBar';
import FilterDropdown from './FilterDropdown';
import { FilterConfig, FilterState } from './useTableSearch';

interface SearchAndFilterBarProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  searchPlaceholder?: string;
  
  filters: FilterState;
  filterConfigs: FilterConfig[];
  onFilterChange: (field: string, value: any) => void;
  
  onClearFilters?: () => void;
  onClearAll?: () => void;
  
  activeFilterCount?: number;
  resultCount?: number;
  totalCount?: number;
  
  className?: string;
  sticky?: boolean;
}

export const SearchAndFilterBar: React.FC<SearchAndFilterBarProps> = ({
  searchTerm,
  onSearchChange,
  searchPlaceholder = "Suche...",
  
  filters,
  filterConfigs,
  onFilterChange,
  
  onClearFilters,
  onClearAll,
  
  activeFilterCount = 0,
  resultCount,
  totalCount,
  
  className = "",
  sticky = true
}) => {
  // Theme colors
  const primaryColor = '#b87ba2';
  const accentColor = '#735a65';
  const backgroundColor = '#fbf7f9';

  const hasActiveFilters = activeFilterCount > 0 || searchTerm.length > 0;

  return (
    <div 
      className={`search-and-filter-bar ${className}`}
      style={{
        position: sticky ? 'sticky' : 'relative',
        top: sticky ? '0' : 'auto',
        zIndex: 10,
        backgroundColor: backgroundColor,
        padding: '16px',
        borderBottom: `1px solid ${accentColor}20`,
        marginBottom: '16px'
      }}
    >
      {/* Main Controls Row */}
      <div 
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: '12px',
          marginBottom: hasActiveFilters ? '12px' : '0'
        }}
      >
        {/* Search Bar */}
        <SearchBar
          searchTerm={searchTerm}
          onSearchChange={onSearchChange}
          placeholder={searchPlaceholder}
          className="flex-1"
        />

        {/* Filter Dropdowns */}
        {filterConfigs.map((config) => (
          <FilterDropdown
            key={config.field}
            config={config}
            value={filters[config.field]}
            onChange={(value) => onFilterChange(config.field, value)}
          />
        ))}

        {/* Clear Buttons */}
        {hasActiveFilters && (
          <div style={{ display: 'flex', gap: '8px' }}>
            {onClearFilters && activeFilterCount > 0 && (
              <button
                onClick={onClearFilters}
                style={{
                  padding: '8px 12px',
                  border: `1px solid ${accentColor}30`,
                  borderRadius: '6px',
                  backgroundColor: 'white',
                  color: accentColor,
                  fontSize: '14px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = `${accentColor}10`;
                  e.currentTarget.style.borderColor = accentColor;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'white';
                  e.currentTarget.style.borderColor = `${accentColor}30`;
                }}
                title="Filter löschen"
              >
                🗑️ Filter
              </button>
            )}

            {onClearAll && (searchTerm || activeFilterCount > 0) && (
              <button
                onClick={onClearAll}
                style={{
                  padding: '8px 12px',
                  border: `1px solid ${primaryColor}30`,
                  borderRadius: '6px',
                  backgroundColor: 'white',
                  color: primaryColor,
                  fontSize: '14px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = `${primaryColor}10`;
                  e.currentTarget.style.borderColor = primaryColor;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'white';
                  e.currentTarget.style.borderColor = `${primaryColor}30`;
                }}
                title="Alles zurücksetzen"
              >
                ↻ Alle
              </button>
            )}
          </div>
        )}
      </div>

      {/* Status Row */}
      <div 
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '14px',
          color: accentColor
        }}
      >
        {/* Results Info */}
        <div>
          {resultCount != null && totalCount != null && (
            <span>
              {resultCount === totalCount 
                ? `${totalCount} Einträge`
                : `${resultCount} von ${totalCount} Einträgen`
              }
              {searchTerm && ` (Suche: "${searchTerm}")`}
            </span>
          )}
        </div>

        {/* Active Filters Info */}
        <div>
          {activeFilterCount > 0 && (
            <span 
              style={{
                padding: '4px 8px',
                backgroundColor: `${primaryColor}20`,
                color: primaryColor,
                borderRadius: '12px',
                fontSize: '12px',
                fontWeight: '500'
              }}
            >
              {activeFilterCount} Filter aktiv
            </span>
          )}
        </div>
      </div>

      {/* Responsive Styles */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @media (max-width: 768px) {
            .search-and-filter-bar {
              padding: 12px !important;
            }
            
            .search-and-filter-bar > div:first-child {
              flex-direction: column !important;
              align-items: stretch !important;
            }
            
            .search-and-filter-bar .flex-1 {
              order: -1;
              margin-bottom: 12px;
            }
          }
          
          @media (max-width: 480px) {
            .search-and-filter-bar > div:first-child > div:last-child {
              justify-content: center !important;
            }
          }
        `
      }} />
    </div>
  );
};

export default SearchAndFilterBar;