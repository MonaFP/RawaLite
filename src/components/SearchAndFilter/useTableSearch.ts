import { useState, useMemo } from 'react';

export interface FilterConfig {
  field: string;
  type: 'text' | 'select' | 'dateRange' | 'numberRange';
  options?: Array<{ value: any; label: string }> | string[];
  label: string;
  min?: number;
  max?: number;
  step?: number;
}

export interface FilterState {
  [key: string]: any;
}

export interface UseTableSearchResult<T> {
  filteredData: T[];
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  filters: FilterState;
  setFilter: (field: string, value: any) => void;
  clearFilters: () => void;
  clearAll: () => void;
  activeFilterCount: number;
}

export function useTableSearch<T extends Record<string, any>>(
  data: T[],
  searchFieldMapping: Record<string, string | ((item: T) => any)>
): UseTableSearchResult<T> {
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<FilterState>({});

  // Helper function to get nested property value
  const getNestedValue = (obj: any, path: string | ((item: T) => any)): any => {
    if (typeof path === 'function') {
      return path(obj);
    }
    return path.split('.').reduce((current, key) => {
      return current?.[key];
    }, obj);
  };

  // Helper function to normalize text for search
  const normalizeText = (text: string): string => {
    return text.toLowerCase().trim();
  };

  // Text search function
  const matchesSearch = (item: T, term: string): boolean => {
    if (!term) return true;
    
    const normalizedTerm = normalizeText(term);
    
    return Object.entries(searchFieldMapping).some(([key, fieldPath]) => {
      const value = getNestedValue(item, fieldPath);
      if (value == null) return false;
      
      const normalizedValue = normalizeText(String(value));
      return normalizedValue.includes(normalizedTerm);
    });
  };

  // Filter function
  const matchesFilters = (item: T): boolean => {
    return Object.entries(filters).every(([field, filterValue]) => {
      if (filterValue == null || filterValue === '' || filterValue === 'all') return true;
      
      const fieldPath = searchFieldMapping[field];
      if (!fieldPath) return true;
      
      const itemValue = getNestedValue(item, fieldPath);
      
      // Determine filter type based on filterValue structure
      if (typeof filterValue === 'object') {
        if (filterValue.from !== undefined || filterValue.to !== undefined) {
          // Date range filter
          if (!filterValue.from && !filterValue.to) return true;
          const itemDate = new Date(itemValue);
          const fromDate = filterValue.from ? new Date(filterValue.from) : null;
          const toDate = filterValue.to ? new Date(filterValue.to) : null;
          
          if (fromDate && itemDate < fromDate) return false;
          if (toDate && itemDate > toDate) return false;
          return true;
        } else if (filterValue.min !== undefined || filterValue.max !== undefined) {
          // Number range filter
          if (filterValue.min == null && filterValue.max == null) return true;
          const numValue = Number(itemValue);
          if (filterValue.min != null && numValue < filterValue.min) return false;
          if (filterValue.max != null && numValue > filterValue.max) return false;
          return true;
        }
      }
      
      // Simple value comparison for text/select filters
      return String(itemValue).toLowerCase() === String(filterValue).toLowerCase();
    });
  };

  // Memoized filtered data
  const filteredData = useMemo(() => {
    return data.filter(item =>
      matchesSearch(item, searchTerm) && matchesFilters(item)
    );
  }, [data, searchTerm, filters, searchFieldMapping]);

  // Set individual filter
  const setFilter = (field: string, value: any) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Clear all filters but keep search
  const clearFilters = () => {
    setFilters({});
  };

  // Clear search and filters
  const clearAll = () => {
    setSearchTerm('');
    setFilters({});
  };

  // Count active filters
  const activeFilterCount = useMemo(() => {
    return Object.values(filters).filter(value => 
      value != null && value !== '' && value !== 'all'
    ).length;
  }, [filters]);

  return {
    filteredData,
    searchTerm,
    setSearchTerm,
    filters,
    setFilter,
    clearFilters,
    clearAll,
    activeFilterCount
  };
}