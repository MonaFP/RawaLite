import { FilterConfig, FilterState } from './useTableSearch';

export { default as SearchBar } from './SearchBar';
export { default as FilterDropdown } from './FilterDropdown';
export { default as SearchAndFilterBar } from './SearchAndFilterBar';
export { useTableSearch, type FilterConfig, type FilterState } from './useTableSearch';

// Helper types for component props
export interface SearchBarProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  placeholder?: string;
  className?: string;
}

export interface FilterDropdownProps {
  config: FilterConfig;
  value: any;
  onChange: (value: any) => void;
  className?: string;
}

export interface SearchAndFilterBarProps {
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