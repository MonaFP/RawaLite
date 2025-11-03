# 🎨 UI Patterns: Table-like Forms Reference

> **Erstellt:** 17.10.2025 | **Letzte Aktualisierung:** 03.11.2025 (Routine Header Update - KI-AUTO-DETECTION SYSTEM Integration)  
> **Status:** Reference | **Typ:** Session-Reference Documentation  
> **Schema:** `VALIDATED_REFERENCE-UI-PATTERNS-TABLE-FORMS_2025-10-17.md`

> **🤖 KI-AUTO-DETECTION SYSTEM:**
> - **AKTUELLER STATUS:** Reference (automatisch durch Dateiname und Inhalt erkannt)
> - **TEMPLATE-QUELLE:** 06-handbook Template
> - **AUTO-UPDATE:** Bei Änderung automatisch aktualisieren
> - **STATUS-KEYWORDS:** Erkannt durch "Reference", "VALIDATED", "06-handbook"

> **🤖 KI-VERHALTENSREGELN (AUTO-AKTIV basierend auf Status):**
> 
> **📚 STATUS = Reference:**
> - ✅ **Handbook-Reference** - Verlässliche Quelle für KI-Session-Durchführung
> - ✅ **Template-System** - Authoritative Dokumentation
> - 🎯 **AUTO-REFERENCE:** Bei relevanten Tasks automatisch referenzieren
> - 🔄 **AUTO-TRIGGER:** Bei entsprechenden Keywords automatisch aktivieren

> **Erstellt:** 15.10.2025 | **Letzte Aktualisierung:** 29.10.2025 (KI-AUTO-DETECTION SYSTEM Integration - CAVE-Trigger entfernt)
> **Status:** Reference | **Typ:** UI Patterns Documentation  
> **Schema:** `VALIDATED_REFERENCE-UI-PATTERNS-TABLE-FORMS_2025-10-17.md`

## 📋 **SCHEMA-ÜBERSICHT nach KI-PRÄFIX-ERKENNUNGSREGELN**

### **STATUS-PRÄFIX:** `VALIDATED_`
- **Bedeutung:** Validierte, stabile Dokumentation (verlässliche Quelle)
- **KI-Verhalten:** Behandelt als verlässliche Quelle für UI Patterns

### **TYP-KATEGORIE:** `REFERENCE-`
- **Verwendung:** UI patterns für table-like forms und grid layouts
- **Purpose:** Design patterns und CSS grid implementation für table-forms

> **🎨 UI PATTERNS OVERVIEW**  
> **Zweck:** Table-like forms patterns und grid layout implementation  
> **Usage:** Design patterns für flexible table-like forms mit CSS Grid

## 🗂️ **GRID LAYOUT PATTERNS**

### **Standard Table Form (4 Columns)**
```typescript
gridTemplateColumns: "1fr 120px 120px 100px"
// Flexible | Fixed | Fixed | Actions
```

### **Extended Form (8 Columns)** 
```typescript
gridTemplateColumns: "100px 1fr 80px 80px 80px 100px 80px 100px"
// Date | Description | Time | Time | Hours | Rate | Total | Actions
```

### **Compact Form (3 Columns)**
```typescript
gridTemplateColumns: "1fr 120px 100px"
// Main Content | Secondary | Actions
```

## 🎯 Usage Examples

### Create Form
```typescript
{mode === "create" && (
  <div style={{marginTop: "24px", paddingTop: "24px", borderTop: "1px solid rgba(0,0,0,.1)"}}>
    <div style={{marginBottom: "16px"}}>
      <h3>Neuer Eintrag</h3>
      <div style={{opacity: 0.7}}>Beschreibung des Formulars</div>
    </div>
    
    <TableFormLayout
      columns={["Kunde", "Titel", "Von", "Bis", "Aktionen"]}
      gridTemplate="120px 1fr 120px 120px 100px"
    >
      <FormControls />
    </TableFormLayout>
  </div>
)}
```

### Detail Management Form
```typescript
{mode === "edit" && (
  <>
    <ReadOnlyDataDisplay />
    
    <TableFormLayout
      columns={["Datum", "Tätigkeit", "Von", "Bis", "Stunden", "Rate", "Summe", "Aktionen"]}
      gridTemplate="100px 1fr 80px 80px 80px 100px 80px 100px"
    >
      {/* Existing items */}
      {items.map(item => <ItemRow key={item.id} data={item} />)}
      
      {/* Add new item row */}
      <AddItemRow />
    </TableFormLayout>
  </>
)}
```

## 🎨 CSS Variables Integration

### Theme Colors
```css
--color-border: rgba(0, 0, 0, 0.1)
--color-table-header: rgba(0, 0, 0, 0.05)
--color-bg-light: rgba(0, 0, 0, 0.02)
--color-bg-secondary: rgba(0, 0, 0, 0.03)
```

### Usage in Components
```typescript
<div style={{
  backgroundColor: "var(--color-table-header)",
  borderColor: "var(--color-border)"
}}>
```

## 📱 Responsive Considerations

### Mobile Adaptations
```typescript
// Für mobile: weniger Spalten, stacked layout
const isMobile = window.innerWidth < 768;

const gridColumns = isMobile 
  ? "1fr 80px" // Content + Actions only
  : "120px 1fr 120px 120px 100px"; // Full desktop layout
```

### Scrollable Tables
```typescript
<div style={{
  overflowX: "auto",
  border: "1px solid var(--color-border)",
  borderRadius: "8px"
}}>
  <div style={{
    minWidth: "800px", // Prevent squishing on mobile
    display: "grid",
    gridTemplateColumns: "120px 1fr 120px 120px 100px"
  }}>
    {/* Content */}
  </div>
</div>
```

## 🔧 Interactive Elements

### Form Controls Sizing
```typescript
// Consistent sizing für alle form elements
const controlStyle = {
  fontSize: "14px",
  padding: "4px 8px"
};

<input className="form-control" style={controlStyle} />
<select className="form-control" style={controlStyle} />
```

### Action Buttons
```typescript
// Kompakte buttons für Actions-Spalte
<button 
  className="btn btn-success" 
  style={{padding: "4px 8px", fontSize: "12px"}}
>
  Action
</button>
```

## ✅ Best Practices

### 1. Consistent Grid Templates
- Use same column widths für related forms
- Fixed widths für predictable content (dates, numbers)
- Flexible (`1fr`) für variable content (text, descriptions)
- Reserve last column für actions (100px meist ausreichend)

### 2. Header Styling
```typescript
// Standard header style
const headerStyle = {
  backgroundColor: "var(--color-table-header)",
  fontWeight: "600",
  borderBottom: "1px solid var(--color-border)"
};
```

### 3. Form Validation States
```typescript
// Error state styling
const inputErrorStyle = {
  borderColor: "var(--color-error, #ef4444)",
  backgroundColor: "var(--color-error-bg, rgba(239, 68, 68, 0.1))"
};
```

### 4. Loading States
```typescript
// Disabled während loading
<input 
  disabled={loading}
  style={{
    opacity: loading ? 0.6 : 1,
    cursor: loading ? "not-allowed" : "default"
  }}
/>
```

## 🚫 Anti-Patterns

### ❌ Avoid
- Inconsistent grid templates zwischen related forms
- Fixed widths für variable content
- Missing gap property (creates cramped appearance)
- Hardcoded colors instead of CSS variables
- Mixed table/form patterns in same view

### ✅ Instead
- Standardized grid templates
- Flexible columns für text content
- Proper gap spacing (8px recommended)
- Theme-aware CSS variables
- Consistent pattern throughout application

## 🔄 Reusable Component

### TableFormLayout Component
```typescript
interface TableFormLayoutProps {
  columns: string[];
  gridTemplate: string;
  children: React.ReactNode;
  className?: string;
}

export const TableFormLayout: React.FC<TableFormLayoutProps> = ({
  columns, gridTemplate, children, className = ""
}) => (
  <div className={`table-form-layout ${className}`} style={{
    border: "1px solid var(--color-border)",
    borderRadius: "8px",
    overflow: "hidden"
  }}>
    <div style={{
      display: "grid",
      gridTemplateColumns: gridTemplate,
      backgroundColor: "var(--color-table-header)",
      padding: "12px 16px",
      fontWeight: "600",
      borderBottom: "1px solid var(--color-border)"
    }}>
      {columns.map((col, index) => (
        <div key={index}>{col}</div>
      ))}
    </div>
    
    <div style={{
      display: "grid",
      gridTemplateColumns: gridTemplate,
      padding: "12px 16px",
      alignItems: "center",
      gap: "8px"
    }}>
      {children}
    </div>
  </div>
);
```

---

Dieses Pattern ermöglicht konsistente, professional aussehende Formulare die sich nahtlos in table-basierte UIs integrieren.
