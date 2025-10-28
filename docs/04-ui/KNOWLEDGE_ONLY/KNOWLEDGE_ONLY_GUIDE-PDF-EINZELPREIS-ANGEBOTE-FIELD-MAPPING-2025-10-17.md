# 🐞 SOLVED: PDF Einzelpreis-Problem bei Angeboten
CAVE:  **🤖 KI-AUTO-DETECTION SYSTEM NEEDED. KI HAS TO READ HANDBOOK FIRST**
## Problem Description
Bei PDF-Export von **Angeboten** wurden die Einzelpreise als "€0,00" angezeigt, während bei **Rechnungen** die korrekten Einzelpreise angezeigt wurden.

## Root Cause Analysis

### Das Problem: Field-Mapping Inkonsistenz
1. **Datenbank speichert:** `unit_price` (snake_case)
2. **PDF-Template erwartet:** `unitPrice` (camelCase)
3. **Rechnungen:** Verwendeten bereits korrekte camelCase-Daten
4. **Angebote:** `loadOfferWithAttachments()` lud `unit_price` ohne Field-Mapping

### Code-Vergleich

#### ❌ VORHER: Angebote (ohne Field-Mapping)
```typescript
// AngebotePage.tsx - loadOfferWithAttachments()
const lineItemRows = await window.rawalite.db.query(
  'SELECT id, title, description, quantity, unit_price, total, parent_item_id, item_type, source_package_id FROM offer_line_items WHERE offer_id = ? ORDER BY id', 
  [offerId]
);
// unit_price blieb snake_case -> PDF-Template fand keine unitPrice
```

#### ✅ NACHHER: Angebote (mit Field-Mapping)
```typescript
// AngebotePage.tsx - loadOfferWithAttachments()
for (const lineItem of lineItemRows) {
  // 3a. Feldmappings für Line Items (snake_case -> camelCase)
  lineItem.unitPrice = lineItem.unit_price;
  lineItem.parentItemId = lineItem.parent_item_id;
  lineItem.itemType = lineItem.item_type;
  lineItem.sourcePackageId = lineItem.source_package_id;
  
  console.log(`🔍 [PDF DEBUG] Line Item ${lineItem.id} field mapping:`, {
    originalUnitPrice: lineItem.unit_price,
    mappedUnitPrice: lineItem.unitPrice,
    quantity: lineItem.quantity,
    total: lineItem.total
  });
```

## Solution Implementation

### 1. Field-Mapping in loadOfferWithAttachments
**Datei:** `src/pages/AngebotePage.tsx`

```typescript
// Explizite Field-Mappings hinzugefügt
lineItem.unitPrice = lineItem.unit_price;          // Für PDF-Template
lineItem.parentItemId = lineItem.parent_item_id;   // Für Hierarchie
lineItem.itemType = lineItem.item_type;            // Für Typ-Erkennung
lineItem.sourcePackageId = lineItem.source_package_id; // Für Package-Refs
```

### 2. Debug-Logging erweitert
**Datei:** `electron/main.ts`

```typescript
// Debug-Ausgaben für Invoice-Vergleich hinzugefügt
if (templateType === 'invoice' && entity.lineItems) {
  console.log('🔍 [PDF DEBUG] Invoice line items received:', entity.lineItems.length);
  entity.lineItems.forEach((item: any, index: number) => {
    console.log(`🔍 [PDF DEBUG] Invoice Item ${index + 1}: ${item.title}`);
    console.log(`🔍 [PDF DEBUG] - Invoice Pricing: quantity=${item.quantity}, unitPrice=${item.unitPrice}, total=${item.total}`);
  });
}
```

## Impact Analysis

### Before Fix
- **Angebote PDF:** Einzelpreis = "€0,00" ❌
- **Rechnungen PDF:** Einzelpreis = korrekt ✅

### After Fix  
- **Angebote PDF:** Einzelpreis = korrekt ✅
- **Rechnungen PDF:** Einzelpreis = korrekt ✅

## Technical Details

### Database Schema Consistency
```sql
-- Beide Tabellen haben identische Struktur
CREATE TABLE offer_line_items (
  id INTEGER PRIMARY KEY,
  offer_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  quantity REAL DEFAULT 1,
  unit_price REAL DEFAULT 0,  -- snake_case in DB
  total REAL DEFAULT 0,
  parent_item_id INTEGER,
  item_type TEXT,
  source_package_id INTEGER
);

CREATE TABLE invoice_line_items (
  -- Identische Struktur
  unit_price REAL DEFAULT 0   -- snake_case in DB
);
```

### PDF Template Logic
```typescript
// electron/main.ts - generateTemplateHTML()
<td>€${(typeof parentItem.unitPrice === 'number' && !isNaN(parentItem.unitPrice)) 
  ? parentItem.unitPrice.toFixed(2) 
  : '0.00'}</td>
```
- Template erwartet `unitPrice` (camelCase)
- Bei fehlender Eigenschaft: Fallback zu "0.00"

## Lessons Learned

### 1. Field-Mapping Konsistenz
- **Problem:** Inconsistent field mapping zwischen Angeboten und Rechnungen
- **Lösung:** Explizite Field-Mappings in allen Lade-Funktionen

### 2. Debug-Strategien
- **Wichtig:** Console.log der tatsächlichen Datenstruktur
- **Vergleich:** Funktionierende vs. nicht-funktionierende Implementierung

### 3. Adapter-Pattern
- **Aktuell:** Manuelle Field-Mappings in UI-Layer
- **Besser:** Centralized Field-Mapper (bereits implementiert in SQLiteAdapter)
- **Todo:** UI-Layer sollte Adapter verwenden statt manuelle SQL-Queries

## Prevention

### 1. Verwende existierende Adapter
```typescript
// BESSER: Verwende SQLiteAdapter für konsistente Field-Mappings
const adapter = new SQLiteAdapter();
const offer = await adapter.getOffer(offerId); // Bereits mit camelCase

// AKTUELL: Manuelle SQL + Field-Mapping
const offerRows = await window.rawalite.db.query('SELECT * FROM offers WHERE id = ?', [offerId]);
```

### 2. TypeScript Interface Validation
```typescript
// Line Item Interface sollte camelCase erzwingen
interface OfferLineItem {
  id: number;
  title: string;
  unitPrice: number;  // Nicht unit_price
  // ...
}
```

### 3. Automated Tests
```typescript
// Unit Test für Field-Mapping
test('loadOfferWithAttachments should map unit_price to unitPrice', async () => {
  const offer = await loadOfferWithAttachments(1);
  expect(offer.lineItems[0]).toHaveProperty('unitPrice');
  expect(offer.lineItems[0].unitPrice).toBeGreaterThan(0);
});
```

## Status: ✅ SOLVED & VERIFIED
**Implementiert:** v1.0.42.2  
**Validiert:** 2025-01-11 ✅ **USER CONFIRMED WORKING**  
**Affected:** PDF-Export von Angeboten  
**Root Cause:** Field-Mapping Inkonsistenz zwischen snake_case (DB) und camelCase (Template)  
**Solution:** Explizite Field-Mappings in `loadOfferWithAttachments()`  
**Impact:** Angebote zeigen jetzt korrekte Einzelpreise im PDF (vorher €0,00)
