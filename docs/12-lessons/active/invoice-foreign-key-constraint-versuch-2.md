# Invoice Foreign Key Constraint Fix - Versuch 2

**Datum:** 2025-10-10  
**Problem:** FOREIGN KEY constraint failed beim Speichern von Rechnungen mit Sub-Items  
**Status:** ⚠️ IN ARBEIT - Versuch 2 nach Analyse des fehlerhaften ersten Versuchs  
**Betroffene Dateien:** `src/adapters/SQLiteAdapter.ts`

## 🚨 Problem-Entdeckung

### Root Cause gefunden
Der erste Versuch von v1.0.40 hatte das Problem **NICHT korrekt** gelöst. Die Invoice-Implementierung verwendete:

❌ **Fehlerhafter Ansatz (Versuch 1):**
```typescript
// PROBLEM: Einfache Timestamps, keine Parent-Child Sortierung
const processedLineItems = data.lineItems.map(item => {
  if (item.id < 0) {
    const newId = Date.now() + Math.random(); // ❌ Timestamp-basiert
    idMapping[item.id] = newId;
    return { ...item, id: newId };
  }
  return item;
});

// PROBLEM: Keine Sortierung - alle Items durcheinander eingefügt
for (const item of processedLineItems) {
  await this.client.exec(`INSERT INTO invoice_line_items...`);
}
```

**Warum das nicht funktioniert:**
1. **Keine Parent-Child Sortierung** → Sub-Items können vor Parent-Items eingefügt werden
2. **Timestamp-basierte IDs** → Keine Garantie für Database `lastInsertRowid`
3. **Keine explizite Foreign Key Behandlung** → `parent_item_id` kann auf nicht-existierende IDs verweisen

### Bewährter Offer-Code als Referenz
✅ **Korrekte Offer-Implementierung (funktioniert seit v1.0.13):**
```typescript
// KORREKT: Parent-Child Sortierung
const mainItems = patch.lineItems.filter(item => !item.parentItemId);
const subItems = patch.lineItems.filter(item => item.parentItemId);

// KORREKT: Main Items zuerst mit lastInsertRowid
for (const item of mainItems) {
  const itemResult = await this.client.exec(`INSERT...`);
  idMapping[item.id] = Number(itemResult.lastInsertRowid); // ✅ DB-generierte IDs
}

// KORREKT: Sub-Items mit resolved parent IDs
for (const item of subItems) {
  const resolvedParentId = idMapping[item.parentItemId] || null;
  await this.client.exec(`INSERT... parent_item_id = ?`, [..., resolvedParentId]);
}
```

## 🛠️ Implementierung - Versuch 2

### Fix 1: createInvoice() - Korrekte ID-Sortierung

**Datei:** `src/adapters/SQLiteAdapter.ts` ~Line 830

**Änderung:**
```typescript
// 🎯 CRITICAL FIX: ID Mapping System for FOREIGN KEY constraint compliance
// Create ID mapping for frontend negative IDs to database positive IDs
const idMapping: Record<number, number> = {};

// Sort items - main items first, then sub-items to ensure parent_item_id references exist
const mainItems = data.lineItems.filter(item => !item.parentItemId);
const subItems = data.lineItems.filter(item => item.parentItemId);

console.log(`🔧 CREATE INVOICE: Starting with ${data.lineItems.length} total items`);
console.log(`🔧 CREATE INVOICE: Found ${mainItems.length} main items and ${subItems.length} sub-items`);

// Insert main items first and build ID mapping for ALL IDs
for (const item of mainItems) {
  const mappedItem = mapToSQL(item);
  const itemResult = await this.client.exec(
    `INSERT INTO invoice_line_items (invoice_id, title, description, quantity, unit_price, total, parent_item_id) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [invoiceId, mappedItem.title, mappedItem.description || null, mappedItem.quantity, mappedItem.unit_price, mappedItem.total, null]
  );

  // Map ALL IDs (both negative frontend IDs AND positive existing IDs) to new database IDs
  idMapping[item.id] = Number(itemResult.lastInsertRowid);
  
  console.log(`🔧 CREATE INVOICE ID Mapping: Frontend ID ${item.id} → Database ID ${idMapping[item.id]}`);
}

// Then insert sub-items with correct parent references
for (const item of subItems) {
  const mappedItem = mapToSQL(item);

  // Resolve parent_item_id using ID mapping - CRITICAL: Look up parent's NEW database ID
  let resolvedParentId = null;
  if (item.parentItemId) {
    resolvedParentId = idMapping[item.parentItemId] || null;
    console.log(`🔧 CREATE INVOICE Sub-Item ID Mapping: Sub-Item ${item.id} → Parent ${item.parentItemId} → Resolved Parent DB ID ${resolvedParentId}`);
  }

  const itemResult = await this.client.exec(
    `INSERT INTO invoice_line_items (invoice_id, title, description, quantity, unit_price, total, parent_item_id) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [invoiceId, mappedItem.title, mappedItem.description || null, mappedItem.quantity, mappedItem.unit_price, mappedItem.total, resolvedParentId]
  );

  // Map sub-item ID as well for potential nested sub-items
  idMapping[item.id] = Number(itemResult.lastInsertRowid);
}
```

### Fix 2: updateInvoice() - Identisches System

**Datei:** `src/adapters/SQLiteAdapter.ts` ~Line 920

**Änderung:** Identische Parent-Child Sortierung und ID-Mapping Logik wie in `createInvoice()`.

## 🔍 Unterschiede zu Versuch 1

| Aspekt | Versuch 1 (Fehlerhaft) | Versuch 2 (Korrekt) |
|--------|------------------------|----------------------|
| **Sortierung** | ❌ Keine - alle Items durcheinander | ✅ Parent Items zuerst, dann Sub-Items |
| **ID-Generierung** | ❌ `Date.now() + Math.random()` | ✅ `Number(itemResult.lastInsertRowid)` |
| **Foreign Key Handling** | ❌ Nach genereller Verarbeitung | ✅ Explizite Parent-ID Resolution |
| **Insertion Order** | ❌ Unsortiert (kann Foreign Key Fehler verursachen) | ✅ Garantiert gültige parent_item_id Referenzen |
| **Debugging** | ❌ Minimal | ✅ Ausführliche Console-Logs |

## 📊 Erwartete Verbesserungen

### Database Konsistenz
```sql
-- Korrekte Parent-Child Referenzen nach Fix
invoice_line_items:
  id | parent_item_id | title
  1  | NULL          | "Hauptposition 1"
  2  | 1             | "↳ Sub-Position 1.1"  
  3  | 1             | "↳ Sub-Position 1.2"
  4  | NULL          | "Hauptposition 2"
  5  | 4             | "↳ Sub-Position 2.1"
```

### Frontend-Backend ID Flow
```
Frontend:              Database:
-1 (Parent)     →      1 (lastInsertRowid)
-2 (Sub von -1) →      2 (parent_item_id = 1)
-3 (Sub von -1) →      3 (parent_item_id = 1)
```

## 🧪 Validierung

### Test-Szenario
1. **Rechnung mit Sub-Items erstellen**
   - 1x Parent Item: "Consulting" 
   - 2x Sub Items: "↳ Analyse", "↳ Konzept"
   
2. **Rechnung mit Sub-Items bearbeiten**
   - Existing Parent Item bearbeiten
   - Sub-Items hinzufügen/entfernen

### Erwartete Ergebnisse
- ✅ **Keine FOREIGN KEY constraint Fehler**
- ✅ **Sub-Items werden korrekt gespeichert**
- ✅ **Parent-Child Hierarchie bleibt intakt**
- ✅ **Console-Logs zeigen korrekte ID-Mappings**

## 🚀 Nächste Schritte

1. **Build & Compile Test**
2. **Funktionstest mit echten Rechnungen**
3. **Critical Fixes Validation**
4. **Bei Erfolg: Dokumentation in solved/ verschieben**

---

**Status:** ⚠️ IMPLEMENTIERT - Wartend auf Validierung  
**Lessons Learned:** Der erste Versuch war unvollständig - die bewährte Offer-Logik muss 1:1 auf Invoices übertragen werden.