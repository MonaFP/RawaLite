import React from 'react';
import { formatCurrency } from '../lib/discount-calculator';

/**
 * Debug-Komponente um formatCurrency Rendering-Probleme zu analysieren
 */
export function CurrencyDebugger() {
  const testAmount = 270;
  const formatted = formatCurrency(testAmount);
  
  // Test verschiedene Eingabetypen
  const testString = formatCurrency("270" as any);
  const testNull = formatCurrency(null as any);
  const testUndefined = formatCurrency(undefined as any);
  
  return (
    <div style={{ 
      position: 'fixed', 
      top: '10px', 
      right: '10px', 
      background: 'yellow', 
      padding: '10px',
      border: '2px solid red',
      zIndex: 9999,
      fontSize: '10px',
      fontFamily: 'monospace',
      maxWidth: '300px'
    }}>
      <div><strong>Currency Debug:</strong></div>
      <div>Number(270): "{formatted}" (len: {formatted.length})</div>
      <div>String("270"): "{testString}" (len: {testString.length})</div>
      <div>Null: "{testNull}" (len: {testNull.length})</div>
      <div>Undefined: "{testUndefined}" (len: {testUndefined.length})</div>
      <div>CharCodes: {formatted.split('').map(c => c.charCodeAt(0)).join(',')}</div>
      <div>JSON: {JSON.stringify(formatted)}</div>
      <div><strong>Test Total Concatenation:</strong></div>
      <div>Direct: Summe: {formatted}</div>
      <div>Template: {`Summe: ${formatted}`}</div>
    </div>
  );
}