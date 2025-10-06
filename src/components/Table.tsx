import React from "react";

export interface Column<T>{
  key: keyof T;
  header: string;
  render?: (row: T) => React.ReactNode;
  width?: string | number;
}

export interface TableProps<T>{
  columns: Column<T>[];
  data: T[];
  emptyMessage?: string;
  getRowKey?: (row: T, index: number) => string | number;
  className?: string; // Support for custom CSS classes
  containerClassName?: string; // Support for custom container classes
}

export function Table<T>({ columns, data, emptyMessage, getRowKey, className = "table", containerClassName = "card" }: TableProps<T>){
  return (
    <div className={containerClassName}>
      <table className={className}>
        <thead>
          <tr>
            {columns.map(c => (
              <th key={String(c.key)} style={{width: c.width}}>{c.header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} style={{opacity:.8, padding:"16px 8px"}}>
                {emptyMessage ?? "Keine Einträge vorhanden."}
              </td>
            </tr>
          ) : data.map((row, i) => (
            <tr key={getRowKey ? getRowKey(row, i) : i}>
              {columns.map(c => (
                <td key={String(c.key)}>
                  {c.render ? c.render(row) : String(row[c.key])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
