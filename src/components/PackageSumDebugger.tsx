import React from 'react';
import { formatCurrency } from '../lib/discount-calculator';

/**
 * Spezielle Debug-Komponente für PackageForm Summe
 */
export function PackageSumDebugger() {
  // Simuliere verschiedene total-Werte wie in PackageForm
  const scenarios = [
    { name: "Number 270", total: 270 },
    { name: "String '270'", total: "270" as any },
    { name: "Float 270.0", total: 270.0 },
    { name: "Calculation result", total: 1 * 270 + 0 },
    { name: "Reduce result", total: [{ qty: 1, price: 270 }].reduce((sum, item) => sum + (item.qty * item.price), 0) }
  ];
  
  return (
    <div style={{ 
      position: 'fixed', 
      top: '200px', 
      right: '10px', 
      background: 'lightblue', 
      padding: '10px',
      border: '2px solid blue',
      zIndex: 9998,
      fontSize: '10px',
      fontFamily: 'monospace',
      maxWidth: '400px'
    }}>
      <div><strong>Package Sum Debug:</strong></div>
      {scenarios.map((scenario, i) => {
        const formatted = formatCurrency(scenario.total);
        return (
          <div key={i} style={{ marginBottom: '5px', borderBottom: '1px solid #ccc', paddingBottom: '2px' }}>
            <div><strong>{scenario.name}:</strong></div>
            <div>Input: {scenario.total} (type: {typeof scenario.total})</div>
            <div>Output: "{formatted}" (len: {formatted.length})</div>
            <div>As JSX: <span>Summe: {formatted}</span></div>
          </div>
        );
      })}
    </div>
  );
}