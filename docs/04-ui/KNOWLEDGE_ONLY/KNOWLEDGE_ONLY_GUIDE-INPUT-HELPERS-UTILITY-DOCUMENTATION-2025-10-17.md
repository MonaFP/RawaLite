# 🎯 Input-Helper Utility Documentation
CAVE:  **🤖 KI-AUTO-DETECTION SYSTEM NEEDED. KI HAS TO READ HANDBOOK FIRST**
## Overview
Die `input-helpers.ts` Utility bietet konsistente Funktionen für benutzerfreundliche numerische Eingabefelder in RawaLite.

## Functions

### `formatNumberInputValue(value)`
**Zweck:** Formatiert Zahlenwerte für die Anzeige in Eingabefeldern
```typescript
formatNumberInputValue(value: number | string | undefined): string
```

**Verhalten:**
- `0`, `"0"`, `undefined`, `null` → `""` (leeres Feld)
- Alle anderen Werte → `String(value)`

**Beispiele:**
```typescript
formatNumberInputValue(0)        // ""
formatNumberInputValue(42.50)    // "42.5"
formatNumberInputValue(undefined) // ""
```

### `parseNumberInput(value)`
**Zweck:** Parst Benutzereingaben mit deutscher Lokalisierung
```typescript
parseNumberInput(value: string): number
```

**Features:**
- Akzeptiert Komma und Punkt als Dezimaltrennzeichen
- Leere Strings werden zu 0
- Ungültige Eingaben werden zu 0

**Beispiele:**
```typescript
parseNumberInput("42,50")  // 42.5
parseNumberInput("42.50")  // 42.5
parseNumberInput("")       // 0
parseNumberInput("abc")    // 0
```

### `getNumberInputStyles()`
**Zweck:** CSS-Styles zum Entfernen der Browser-Spinner
```typescript
getNumberInputStyles(): React.CSSProperties
```

**Rückgabe:**
```typescript
{
  WebkitAppearance: 'none',
  MozAppearance: 'textfield'
}
```

## Usage Pattern

### Standard Implementierung
```typescript
import { formatNumberInputValue, parseNumberInput, getNumberInputStyles } from '../lib/input-helpers';

// In Component:
<input
  type="number"
  value={formatNumberInputValue(item.unitPrice)}
  onChange={(e) => {
    const newValue = parseNumberInput(e.target.value);
    updateItem(index, 'unitPrice', newValue);
  }}
  style={getNumberInputStyles()}
  placeholder="0,00"
  className="form-control"
/>
```

### Vollständiges Beispiel
```typescript
// Vorher (problematisch):
<input
  type="number"
  step="0.01"
  value={item.unitPrice || 0}
  onChange={(e) => updateItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
/>

// Nachher (verbessert):
<input
  type="number"
  value={formatNumberInputValue(item.unitPrice)}
  onChange={(e) => updateItem(index, 'unitPrice', parseNumberInput(e.target.value))}
  style={getNumberInputStyles()}
  placeholder="0,00"
/>
```

## Browser Compatibility

### Spinner Removal
- **Chrome/Safari:** `WebkitAppearance: 'none'`
- **Firefox:** `MozAppearance: 'textfield'`
- **Edge:** Erbt Chrome-Verhalten

### Decimal Separator Support
- **Alle Browser:** Normalisierung von `,` zu `.` vor `parseFloat()`
- **Deutsche Tastatur:** Komma wird automatisch akzeptiert

## Integration Guide

### 1. Import hinzufügen
```typescript
import { 
  formatNumberInputValue, 
  parseNumberInput, 
  getNumberInputStyles 
} from '../lib/input-helpers';
```

### 2. Input-Attribut ersetzen
```typescript
// ALT:
value={item.unitPrice || 0}

// NEU:
value={formatNumberInputValue(item.unitPrice)}
```

### 3. onChange-Handler aktualisieren
```typescript
// ALT:
onChange={(e) => setValue(parseFloat(e.target.value) || 0)}

// NEU:
onChange={(e) => setValue(parseNumberInput(e.target.value))}
```

### 4. Styles hinzufügen
```typescript
// NEU:
style={getNumberInputStyles()}
```

### 5. Step-Attribut entfernen
```typescript
// ALT:
<input type="number" step="0.01" />

// NEU:
<input type="number" />
```

## Benefits

### UX Improvements
- ✅ Keine störenden Spinner/Pfeiltasten
- ✅ Leere Felder statt "0" bei Initialisierung
- ✅ Deutsche Komma-Eingabe möglich
- ✅ Kein ungewolltes Step-Verhalten

### Developer Experience
- ✅ Konsistente API für alle numerischen Inputs
- ✅ Type-safe TypeScript Interfaces
- ✅ Einfache Integration in bestehende Komponenten
- ✅ Zentrale Stelle für Input-Verhalten

### Performance
- ✅ Minimal Overhead (nur pure Functions)
- ✅ Keine zusätzlichen Dependencies
- ✅ Optimierte CSS-Styles ohne Layout-Recalculation

## Testing

### Unit Tests (Recommended)
```typescript
describe('input-helpers', () => {
  test('formatNumberInputValue shows empty for zero', () => {
    expect(formatNumberInputValue(0)).toBe('');
    expect(formatNumberInputValue('0')).toBe('');
  });
  
  test('parseNumberInput handles comma separator', () => {
    expect(parseNumberInput('42,50')).toBe(42.5);
    expect(parseNumberInput('42.50')).toBe(42.5);
  });
});
```

### Manual Testing
1. **Leere Felder:** Neue Einträge sollten leere numerische Felder zeigen
2. **Komma-Eingabe:** `42,50` sollte als `42.50` gespeichert werden
3. **Spinner-Test:** Keine Pfeiltasten an numerischen Feldern sichtbar
4. **Step-Test:** Freie Eingabe ohne Sprungverhalten möglich

## Version History
- **v1.0.42.2:** Erste Implementierung der Input-Helper Utility
- **Integration:** OfferForm, InvoiceForm, TimesheetForm, PackageForm
