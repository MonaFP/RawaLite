# PDF Einzelpreis & Rundungsfehler - Problemlösung
CAVE:  **🤖 KI-AUTO-DETECTION SYSTEM NEEDED. KI HAS TO READ HANDBOOK FIRST**
**STATUS:** ⚠️ ACTIVE - Warten auf User-Validierung  
$12025-10-17**VERSION:** v1.0.42.2  

## 🚨 Problembeschreibung

### Problem 1: PDF Einzelpreis zeigt 0,00€
- **Symptom:** In der PDF-Ausgabe der Angebote wird der Einzelpreis nicht ausgegeben, nur der Gesamtpreis. Überall steht 0,00€
- **Vergleich:** Bei Rechnungen funktioniert es korrekt

### Problem 2: 1-Cent-Abrundung beim Speichern
- **Symptom:** User gibt 80,00€ ein, nach dem Speichern wird es zu 79,98€
- **Screenshot:** User-Report zeigt Eingabe vs. gespeicherten Wert

## 🔍 Root Cause Analysis

### Entdeckte Ursachen:

#### 1. SQLiteAdapter Field Mapping Inkonsistenz
**Datei:** `src/adapters/SQLiteAdapter.ts` - `getOffer()` Methode
- **Problem:** Verwendete manuelle SQL-Aliases statt field-mapper
- **Code:** `unit_price as unitPrice` → direkte Aliasing
- **Lösung:** Wechsel zu `mapFromSQL()` für konsistente Feldkonvertierung

#### 2. OfferForm Subtotal Speicherlogik Fehler  
**Datei:** `src/components/OfferForm.tsx` - Zeile 384
- **Problem:** `subtotal: totals.subtotalAfterDiscount` statt `totals.subtotalBeforeDiscount`
- **Auswirkung:** Speichert Zwischensumme NACH Rabatt als "subtotal"
- **Verwirrung:** PDF Template und Datenbank erwarten subtotal VOR Rabatt

#### 3. InvoiceForm identisches Problem
**Datei:** `src/components/InvoiceForm.tsx` - Zeile 182
- **Problem:** Gleicher Fehler wie in OfferForm

## 🛠️ Implementierte Lösungen

### Fix 1: SQLiteAdapter Konsistenz ✅
```typescript
// VORHER (inkonsistent):
const lineItemQuery = convertSQLQuery(`SELECT unitPrice, parentItemId FROM offer_line_items`);

// NACHHER (konsistent):  
const lineItemQuery = convertSQLQuery(`SELECT unit_price, parent_item_id FROM offer_line_items`);
const mapped = lineItems.map(item => mapFromSQL(item));
```

### Fix 2: OfferForm Subtotal Korrektur ✅
```typescript
// VORHER (falsch):
subtotal: totals.subtotalAfterDiscount,

// NACHHER (richtig):
subtotal: totals.subtotalBeforeDiscount,
```

### Fix 3: InvoiceForm Subtotal Korrektur ✅
- Identische Änderung wie in OfferForm angewendet

### Fix 4: SQLiteAdapter listOffers() Field Mapping ✅ **NEU**
```typescript
// PROBLEM: listOffers() vs getOffer() Inkonsistenz
// listOffers() verwendete: SELECT unitPrice, parentItemId (camelCase)
// getOffer() verwendete: SELECT unit_price, parent_item_id (snake_case + mapFromSQL)

// BEHOBEN: Beide verwenden jetzt snake_case + mapFromSQL
```

## 🧪 Validierung

### Tests durchgeführt:
1. **JavaScript Floating Point Test:** ✅ parseFloat() und Math.round() funktionieren korrekt
2. **Discount Calculator Test:** ✅ Alle Berechnungen mit 80,00€ ergeben exakt 80.00
3. **Critical Fixes Validation:** ✅ Alle 15 kritischen Fixes bleiben intakt
4. **Build Test:** ✅ Anwendung kompiliert erfolgreich

### Erwartete Resultate:
- ✅ PDF zeigt korrekte Einzelpreise (nicht 0,00€)
- ✅ 80,00€ Input wird als 80,00€ gespeichert (nicht 79,98€)
- ✅ Rabattberechnungen funktionieren weiterhin korrekt
- ✅ Keine Regressionen in anderen Bereichen

## 📋 Datenbank Schema Kontext

### Discount System (Migration 013):
```sql
-- Zwischensumme VOR Rabatt (für line items Summe)
subtotal_before_discount REAL DEFAULT NULL

-- Berechneter Rabatt-Betrag  
discount_amount REAL DEFAULT NULL

-- Standard subtotal Feld (sollte = subtotal_before_discount sein)
subtotal REAL NOT NULL DEFAULT 0
```

### Field Mapping System:
- **snake_case** (Datenbank) ↔ **camelCase** (TypeScript)
- **Automatisch:** `mapFromSQL()` und `mapToSQL()` 
- **Konsistenz:** Verhindert manuelle Mapping-Fehler

## 🎯 User Validation Required

**NACH DEN LETZTEN FIXES - BITTE TESTEN:**

### 🔴 PRIORITÄT 1: PDF Einzelpreis Test
1. Öffne existierendes Angebot (z.B. AN-0003 oder AN-0004)
2. Generiere PDF 
3. **PRÜFE:** Werden Einzelpreise korrekt angezeigt? (nicht 0,00€)
4. **DEBUG:** Schau in DevTools Console nach "🔍 [PDF DEBUG]" Meldungen

### 🟡 PRIORITÄT 2: Rabatt-Rundung Test
1. Erstelle neues Angebot mit 80,00€ Einzelpreis
2. **OHNE Rabatt:** Speichere → sollte 80,00€ bleiben
3. **MIT 9,8% Rabatt:** Speichere → prüfe ob sporadischer Rundungsfehler auftritt
4. Falls Rundungsfehler: Speichere nochmal → sollte dann korrekt werden
5. **DEBUG:** Schau in DevTools Console nach "🧮 [OfferForm] Discount calculation debug"

### 🟢 PRIORITÄT 3: Standard-Funktionalität
1. Rabattberechnungen funktionieren weiterhin
2. Speichern/Laden funktioniert normal 
3. Keine anderen Regressionen

---

## 📋 Technische Änderungen (v1.0.42.2)

### Geänderte Dateien:
- `src/adapters/SQLiteAdapter.ts`
  - `listOffers()`: camelCase → snake_case field names + mapFromSQL
  - `getOffer()`: bereits korrekt (Referenz-Implementation)
- `src/components/OfferForm.tsx` 
  - subtotal Speicherlogik korrigiert
  - Debug-Logging für Rabatt-Berechnungen hinzugefügt
- `src/components/InvoiceForm.tsx`
  - subtotal Speicherlogik korrigiert

## 🚦 Next Steps

1. **User führt Validierungstests durch**
2. **User bestätigt:** "Problem gelöst" oder berichtet weitere Issues
3. **Bei Erfolg:** Verschiebung nach `docs/12-lessons/solved/`
4. **Bei Issues:** Weitere Debugging-Schritte

## 📁 Geänderte Dateien
- `src/adapters/SQLiteAdapter.ts` - listOffers() + getOffer() mapFromSQL consistency  
- `src/components/OfferForm.tsx` - subtotal Speicherlogik + debug logging
- `src/components/InvoiceForm.tsx` - subtotal Speicherlogik

### 🔍 Debug Features hinzugefügt:
- **PDF Debug:** Console logs in `electron/main.ts` generateTemplateHTML
- **Rabatt Debug:** Console logs in `src/components/OfferForm.tsx` calculateDocumentTotals

### 🧪 Validierungen:
- ✅ Critical Fixes: Alle 15 kritischen Fixes bleiben intakt
- ✅ Build Test: Erfolgreiche Kompilierung
- ✅ Field Mapping: Konsistente snake_case ↔ camelCase Konvertierung

---
**WICHTIG:** Dieses Dokument bleibt in `active/` bis User-Bestätigung der PDF-Fix-Wirksamkeit vorliegt!
