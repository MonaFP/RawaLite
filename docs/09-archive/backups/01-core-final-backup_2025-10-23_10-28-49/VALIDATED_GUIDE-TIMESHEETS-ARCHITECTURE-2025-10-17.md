# TimesheetsPage Architecture Documentation

**Version:** 1.0.13+  
**Letztes Update:** 5. Oktober 2025  
**Komponente:** `src/pages/TimesheetsPage.tsx`

## 📋 Übersicht

Die TimesheetsPage implementiert ein Zwei-Ebenen-System zur Verwaltung von Leistungsnachweisen:
1. **Leistungsnachweis-Ebene**: Container mit Grunddaten (Kunde, Titel, Zeitraum)
2. **Positions-Ebene**: Einzelne Arbeitseinträge (bis zu 31 pro Leistungsnachweis)

## 🏗️ Architektur

### Component Structure
```
TimesheetsPage
├── Header (Titel, Beschreibung, Action Button)
├── List Mode: Table mit allen Leistungsnachweisen
├── Create Mode: Grunddaten-Formular (tabellarisch)
└── Edit Mode: 
    ├── Grunddaten (read-only)
    ├── Positions-Management
    └── Add-Position Formular
```

### State Management
```typescript
// UI State
const [mode, setMode] = useState<"list" | "create" | "edit">("list");
const [current, setCurrent] = useState<Timesheet | null>(null);

// Form States
const [createFormData, setCreateFormData] = useState({
  customerId: '', title: '', startDate: '', endDate: ''
});

const [newPosition, setNewPosition] = useState({
  date: string, activityId: string, startTime: string,
  endTime: string, hours: number, hourlyRate: number
});
```

## 📊 Data Flow

### Create Workflow
```
User Input → createFormData → handleCreateTimesheet() → 
createTimesheet() → Database → UI Update → Success Message
```

### Edit Workflow
```
Table Edit Button → setCurrent() → setMode("edit") →
Position Management → handleAddPosition() → 
updateTimesheet() → UI Update → Success Message
```

### Position Management
```
Add: newPosition → TimesheetActivity → updateTimesheet()
Delete: filter activities → recalculate totals → updateTimesheet()
```

## 🎨 UI Patterns

### Grid-Based Tables
```typescript
// Standard Pattern für alle tabellen-ähnlichen Bereiche
<div style={{
  display: "grid",
  gridTemplateColumns: "120px 1fr 120px 120px 100px",
  backgroundColor: "var(--color-table-header)",
  padding: "12px 16px",
  fontWeight: "600"
}}>
  <div>Header 1</div>
  <div>Header 2</div>
  // ...
</div>
```

### Responsive Buttons
```typescript
// Action buttons mit Icon + Text pattern
<button className="responsive-btn btn btn-info">
  <span className="btn-icon">👁️</span>
  <span className="btn-text">Vorschau</span>
</button>
```

## 🔧 Core Functions

### `handleCreateTimesheet()`
**Zweck:** Erstellt neuen Leistungsnachweis mit Grunddaten  
**Validation:** Alle Felder required  
**Auto-Values:** timesheetNumber, initial totals (0), empty activities[]

### `handleAddPosition()`
**Zweck:** Fügt Position zu aktuellem Leistungsnachweis hinzu  
**Calculations:** hours × hourlyRate = total, recalculates subtotal/vat/total  
**Integration:** Verknüpft mit Activities aus Einstellungen

### `handleRemovePosition(activityId)`
**Zweck:** Entfernt Position und aktualisiert Summen  
**Side Effects:** Recalculates all totals, updates database

### `handleSaveTimesheet()`
**Zweck:** Final save des aktuellen Leistungsnachweises  
**Behavior:** Returns to list mode, shows success message

## 💾 Database Integration

### Tables Used
- `timesheets`: Hauptdaten der Leistungsnachweise
- `timesheet_activities`: Einzelne Positionen/Einträge
- `customers`: Kundenverknüpfung
- `activities`: Template-Tätigkeiten aus Einstellungen

### Field Mappings
```typescript
// Wichtige Mappings (JavaScript → SQL)
'startTime': 'start_time'
'endTime': 'end_time'
'isBreak': 'is_break'
'customerId': 'customer_id'
'activityId': 'activity_id'
```

## 🎯 Business Logic

### Calculation Rules
```typescript
// Position Total
position.total = position.hours × position.hourlyRate

// Timesheet Totals
subtotal = sum(all position.total where !isBreak)
vatAmount = subtotal × (vatRate / 100)
total = subtotal + vatAmount
```

### Validation Rules
- **Create**: customerId, title, startDate, endDate required
- **Add Position**: activityId, date required
- **Position Limit**: Max 31 positions (für Monats-Leistungsnachweise)
- **Time Logic**: endTime should be after startTime

### Auto-Generation
```typescript
// Leistungsnachweis-Nummer
timesheetNumber = `LN-${year}-${String(count + 1).padStart(3, '0')}`
// Beispiel: "LN-2025-001"
```

## 🔄 Integration Points

### Hooks Used
- `useTimesheets()`: CRUD operations
- `useCustomers()`: Customer dropdown data
- `useActivities()`: Activity templates
- `useUnifiedSettings()`: Company data, logo
- `useNotifications()`: Success/error messages

### Components Used
- `Table<Timesheet>`: Main data display
- Standard form controls (select, input, button)
- Custom grid layouts für table-like forms

## 📱 Responsive Design

### Grid Breakpoints
```typescript
// Standard Grid für Desktop
gridTemplateColumns: "120px 1fr 120px 120px 100px"

// Positions-Grid (mehr Spalten)
gridTemplateColumns: "100px 1fr 80px 80px 80px 100px 80px 100px"
```

### Mobile Considerations
- Responsive buttons mit Icon/Text pattern
- Scrollable tables für overflow
- Consistent spacing/padding across breakpoints

## 🧪 Testing Considerations

### Key Test Cases
1. **Create Flow**: Empty form → validation → successful creation
2. **Position Management**: Add → calculate → save → verify totals
3. **Error Handling**: Network errors, validation errors
4. **State Management**: Mode switching, form resets
5. **Database Sync**: CRUD operations reflect in UI

### Edge Cases
- Empty customer/activities lists
- Maximum positions (31)
- Decimal hour calculations
- Date range validations
- Concurrent user modifications

## 🚀 Performance Optimizations

### Implemented
- Controlled components mit useState
- Efficient re-renders through proper key props
- Local state für form data (avoid unnecessary API calls)

### Future Considerations
- Virtualization for large timesheet lists
- Debounced auto-save für positions
- Optimistic UI updates
- Caching frequently used customer/activity data

---

Diese Architektur ermöglicht eine klare Trennung zwischen Leistungsnachweis-Management und Detail-Positionen, mit konsistenter UI und robuster Datenverarbeitung.
