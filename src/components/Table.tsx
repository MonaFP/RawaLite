import { useState, useMemo, Fragment, type ReactNode } from 'react';

export interface Column<T> {
  key: keyof T;
  header: string;
  render?: (row: T) => ReactNode;
  width?: string | number;
  sortable?: boolean;
  visible?: boolean;
}

export interface SortConfig {
  key: string;
  direction: 'asc' | 'desc';
}

export interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  emptyMessage?: string;
  expandableRows?: (row: T) => ReactNode;
  
  // Neue Props für erweiterte Funktionalität
  sortable?: boolean;
  sortConfig?: SortConfig | null;
  onSortChange?: (sortConfig: SortConfig | null) => void;
  
  visibleColumns?: string[];
  onVisibleColumnsChange?: (columns: string[]) => void;
  
  pageSize?: number;
  currentPage?: number;
  onPageChange?: (page: number) => void;
  showPagination?: boolean;
  
  // Spalten-Menü
  showColumnToggle?: boolean;
}

export function Table<T extends { id: number }>({ 
  columns, 
  data, 
  emptyMessage, 
  expandableRows,
  sortable = false,
  sortConfig,
  onSortChange,
  visibleColumns,
  onVisibleColumnsChange,
  pageSize = 25,
  currentPage = 1,
  onPageChange,
  showPagination = false,
  showColumnToggle = false
}: TableProps<T>) {
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const [showColumnMenu, setShowColumnMenu] = useState(false);

  const toggleRow = (id: number) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  // Visible columns logic
  const visibleColumnKeys = useMemo(() => {
    if (visibleColumns) {
      return visibleColumns;
    }
    return columns.map(col => String(col.key));
  }, [columns, visibleColumns]);

  const displayColumns = useMemo(() => {
    return columns.filter(col => 
      visibleColumnKeys.includes(String(col.key)) && 
      (col.visible !== false)
    );
  }, [columns, visibleColumnKeys]);

  // Sorting logic
  const sortedData = useMemo(() => {
    if (!sortConfig) return data;

    return [...data].sort((a, b) => {
      const aValue = a[sortConfig.key as keyof T];
      const bValue = b[sortConfig.key as keyof T];

      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;

      let comparison = 0;
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        comparison = aValue.toLowerCase().localeCompare(bValue.toLowerCase());
      } else if (typeof aValue === 'number' && typeof bValue === 'number') {
        comparison = aValue - bValue;
      } else {
        comparison = String(aValue).localeCompare(String(bValue));
      }

      return sortConfig.direction === 'desc' ? -comparison : comparison;
    });
  }, [data, sortConfig]);

  // Pagination logic
  const paginatedData = useMemo(() => {
    if (!showPagination) return sortedData;
    
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return sortedData.slice(startIndex, endIndex);
  }, [sortedData, currentPage, pageSize, showPagination]);

  const totalPages = Math.ceil(sortedData.length / pageSize);

  // Sorting handlers
  const handleSort = (columnKey: keyof T) => {
    if (!sortable || !onSortChange) return;

    const key = String(columnKey);
    let newSortConfig: SortConfig | null = { key, direction: 'asc' };

    if (sortConfig && sortConfig.key === key) {
      if (sortConfig.direction === 'asc') {
        newSortConfig = { key, direction: 'desc' };
      } else {
        newSortConfig = null; // Remove sorting
      }
    }

    onSortChange(newSortConfig);
  };

  // Column toggle handler
  const handleColumnToggle = (columnKey: string) => {
    if (!onVisibleColumnsChange) return;

    const newVisibleColumns = visibleColumnKeys.includes(columnKey)
      ? visibleColumnKeys.filter(key => key !== columnKey)
      : [...visibleColumnKeys, columnKey];

    onVisibleColumnsChange(newVisibleColumns);
  };

  const getSortIcon = (columnKey: keyof T) => {
    if (!sortConfig || sortConfig.key !== String(columnKey)) {
      return <span style={{ opacity: 0.3, marginLeft: '4px' }}>↕</span>;
    }
    
    return (
      <span style={{ marginLeft: '4px' }}>
        {sortConfig.direction === 'asc' ? '↑' : '↓'}
      </span>
    );
  };

  return (
    <div className="card">
      {/* Column Toggle Menu */}
      {showColumnToggle && (
        <div style={{ padding: '12px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ position: 'relative', display: 'inline-block' }}>
            <button
              onClick={() => setShowColumnMenu(!showColumnMenu)}
              style={{
                background: 'var(--sidebar-green)',
                color: 'white',
                border: 'none',
                padding: '6px 12px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              Filter ⚙️
            </button>
            
            {showColumnMenu && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                background: 'white',
                border: '1px solid #ddd',
                borderRadius: '6px',
                padding: '12px',
                zIndex: 1000,
                minWidth: '220px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                maxHeight: '300px',
                overflowY: 'auto'
              }}>
                {columns.map(col => (
                  <label key={String(col.key)} style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '6px 0',
                    cursor: 'pointer',
                    fontSize: '14px',
                    color: '#374151',
                    borderRadius: '4px',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                    <input
                      type="checkbox"
                      checked={visibleColumnKeys.includes(String(col.key))}
                      onChange={() => handleColumnToggle(String(col.key))}
                      style={{ 
                        marginRight: '8px',
                        accentColor: 'var(--primary)'
                      }}
                    />
                    <span style={{ color: '#374151', fontWeight: '500' }}>
                      {col.header}
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <table className="table">
        <thead>
          <tr>
            {expandableRows && <th style={{ width: "40px" }}></th>}
            {displayColumns.map(c => (
              <th 
                key={String(c.key)} 
                style={{
                  width: c.width,
                  cursor: sortable && c.sortable !== false ? 'pointer' : 'default',
                  userSelect: 'none'
                }}
                onClick={() => sortable && c.sortable !== false && handleSort(c.key)}
              >
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  {c.header}
                  {sortable && c.sortable !== false && getSortIcon(c.key)}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {paginatedData.length === 0 ? (
            <tr>
              <td colSpan={displayColumns.length + (expandableRows ? 1 : 0)} style={{opacity:.8, padding:"16px 8px"}}>
                {emptyMessage ?? "Keine Einträge vorhanden."}
              </td>
            </tr>
          ) : paginatedData.map((row, i) => (
            <Fragment key={i}>
              <tr>
                {expandableRows && (
                  <td>
                    <button
                      onClick={() => toggleRow(row.id)}
                      style={{
                        background: "none",
                        border: "none",
                        color: "var(--foreground)",
                        cursor: "pointer",
                        padding: "4px 8px",
                        fontSize: "14px",
                        borderRadius: "4px",
                        transition: "background-color 0.2s"
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.1)"}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                    >
                      {expandedRows.has(row.id) ? "▼" : "▶"}
                    </button>
                  </td>
                )}
                {displayColumns.map(c => (
                  <td key={String(c.key)}>
                    {c.render ? c.render(row) : String(row[c.key])}
                  </td>
                ))}
              </tr>
              {expandableRows && expandedRows.has(row.id) && (
                <tr>
                  <td colSpan={displayColumns.length + 1} style={{ padding: 0, border: "none" }}>
                    {expandableRows(row)}
                  </td>
                </tr>
              )}
            </Fragment>
          ))}
        </tbody>
      </table>

      {/* Pagination */}
      {showPagination && totalPages > 1 && (
        <div style={{ 
          padding: '12px', 
          borderTop: '1px solid var(--border)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ fontSize: '14px', opacity: 0.7 }}>
            {sortedData.length} Einträge, Seite {currentPage} von {totalPages}
          </div>
          
          <div style={{ display: 'flex', gap: '4px' }}>
            <button
              onClick={() => onPageChange?.(currentPage - 1)}
              disabled={currentPage === 1}
              style={{
                padding: '6px 12px',
                border: '1px solid var(--border)',
                background: currentPage === 1 ? 'var(--muted)' : 'var(--background)',
                color: 'var(--foreground)',
                cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                borderRadius: '4px'
              }}
            >
              ← Zurück
            </button>
            
            <button
              onClick={() => onPageChange?.(currentPage + 1)}
              disabled={currentPage === totalPages}
              style={{
                padding: '6px 12px',
                border: '1px solid var(--border)',
                background: currentPage === totalPages ? 'var(--muted)' : 'var(--background)',
                color: 'var(--foreground)',
                cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                borderRadius: '4px'
              }}
            >
              Weiter →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}


