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
}

export function Table<T>({ columns, data, emptyMessage, getRowKey }: TableProps<T>){
  return (
    <div className="card">
      <table className="table">
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
