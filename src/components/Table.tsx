import React, { useState } from "react";

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
  expandableRows?: (row: T) => React.ReactNode;
}

export function Table<T extends { id: number }>({ columns, data, emptyMessage, expandableRows }: TableProps<T>){
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

  const toggleRow = (id: number) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  return (
    <div className="card">
      <table className="table">
        <thead>
          <tr>
            {expandableRows && <th style={{ width: "40px" }}></th>}
            {columns.map(c => (
              <th key={String(c.key)} style={{width: c.width}}>{c.header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length + (expandableRows ? 1 : 0)} style={{opacity:.8, padding:"16px 8px"}}>
                {emptyMessage ?? "Keine Einträge vorhanden."}
              </td>
            </tr>
          ) : data.map((row, i) => (
            <React.Fragment key={i}>
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
                {columns.map(c => (
                  <td key={String(c.key)}>
                    {c.render ? c.render(row) : String(row[c.key])}
                  </td>
                ))}
              </tr>
              {expandableRows && expandedRows.has(row.id) && (
                <tr>
                  <td colSpan={columns.length + 1} style={{ padding: 0, border: "none" }}>
                    {expandableRows(row)}
                  </td>
                </tr>
              )}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}
