import React from 'react';

type Props = { data: Record<string, any>[]; columns: string[] };

const Table: React.FC<Props> = ({ data, columns }) => {
  return (
    <table className="table">
      <thead>
        <tr>{columns.map(c => <th key={c}>{c}</th>)}</tr>
      </thead>
      <tbody>
        {data.map((row, i) => (
          <tr key={row.id ?? i}>
            {columns.map(c => <td key={c}>{String(row[c] ?? '')}</td>)}
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default Table;