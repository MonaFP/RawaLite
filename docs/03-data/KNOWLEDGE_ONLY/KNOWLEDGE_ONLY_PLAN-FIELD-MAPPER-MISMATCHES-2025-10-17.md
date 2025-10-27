# 🔍 VOLLSTÄNDIGE SCHEMA-MISMATCH ANALYSE - RawaLite

> **Erstellt:** 15.10.2025 | $12025-10-17 (Content modernization + ROOT_ integration)| **Typ:** Field-Mapping Validation

## 📋 **ANALYSE-ÜBERSICHT**

Vollständige Schema-Mismatch Analyse für Field-Mapping Probleme zwischen JavaScript camelCase und SQL snake_case Patterns. 

Searched text for `createdAt|updatedAt|companyName|customerId|offerId|packageId|invoiceId|lastNumber|taxRate|totalAmount|validUntil|dueDate|paidAt|parentItemId|unitPrice` (`**/src/**/*.ts`), 100 results

Searched text for `created_at|updated_at|company_name|customer_id|offer_id|package_id|invoice_id|last_number|tax_rate|total_amount|valid_until|due_date|paid_at|parent_item_id|unit_price` (`**/src/**/*.ts`), 100 results

Jetzt analysiere ich die Adapters und Services: 

Searched text for `packageLineItems|offerLineItems|invoiceLineItems|unitPrice|parentItemId` (`**/src/adapters/**/*.ts`), 20 results

Starting (3/4) *Schema-Fix Implementierungsplan*

# 🔍 **VOLLSTÄNDIGER SCHEMA-MISMATCH ANALYSEBERICHT - RawaLite**

## 📊 **1. KRITISCHE BEFUNDE - ÜBERSICHT**

| **Kategorie** | **Anzahl Probleme** | **Schwere** | **Status** |
|---------------|-------------------|-------------|------------|
| Field-Mapper Lücken | 8 | 🔴 HOCH | Identifiziert |
| SQLiteAdapter Inkonsistenzen | 12 | 🔴 HOCH | Identifiziert |
| LineItem Schema-Konflikte | 6 | 🔴 HOCH | Identifiziert |
| Migration Schema-Konflikte | 3 | 🔴 HOCH | Behoben |
| Services Schema-Drift | 4 | 🟡 MITTEL | Identifiziert |

---

## 📋 **2. DETAILLIERTE SCHEMA-MISMATCH TABELLE**

### **🔴 Field-Mapper Lücken (KRITISCH)**

| **CamelCase (Code)** | **Snake_Case (DB)** | **Status im Mapper** | **Betroffene Dateien** | **Impact** |
|---------------------|---------------------|---------------------|------------------------|------------|
| `unitPrice` | `unit_price` | ❌ FEHLT | SQLiteAdapter.ts (20x) | LineItem Queries kaputt |
| `parentItemId` | `parent_item_id` | ❌ FEHLT | SQLiteAdapter.ts (12x) | Sub-Items funktionieren nicht |
| `packageId` | `package_id` | ❌ FEHLT | SQLiteAdapter.ts (6x) | Package-LineItem Queries kaputt |
| `invoiceId` | `invoice_id` | ❌ FEHLT | SQLiteAdapter.ts (4x) | Invoice-LineItem Queries kaputt |
| `vatRate` | `vat_rate` | ❌ FEHLT | SQLiteAdapter.ts (8x) | Tax Berechnung fehlerhaft |
| `vatAmount` | `vat_amount` | ❌ FEHLT | SQLiteAdapter.ts (6x) | Tax Berechnung fehlerhaft |
| `offerNumber` | `offer_number` | ❌ FEHLT | SQLiteAdapter.ts (4x) | Angebotsnummern kaputt |
| `invoiceNumber` | `invoice_number` | ❌ FEHLT | SQLiteAdapter.ts (4x) | Rechnungsnummern kaputt |

### **🔴 SQLiteAdapter Schema-Inkonsistenzen (KRITISCH)**

| **Method** | **Problem** | **Zeile** | **Beschreibung** | **Fix-Komplexität** |
|------------|-------------|-----------|------------------|-------------------|
| `listPackages()` | Mixed SQL Style | 160 | `convertSQLQuery()` mit camelCase aber hardcoded snake_case Insert | 🟡 MITTEL |
| `getPackage()` | Mixed SQL Style | 185 | Gleiche Inkonsistenz wie listPackages | 🟡 MITTEL |
| `listOffers()` | Hardcoded snake_case | 312 | `SELECT ... unit_price, parent_item_id FROM offer_line_items` | 🟡 MITTEL |
| `getOffer()` | Hardcoded snake_case | 348 | Gleiche Inkonsistenz | 🟡 MITTEL |
| `createOffer()` | Mixed Parameters | 409 | `mappedItem.unit_price` vs `mappedItem.parent_item_id` | 🔴 HOCH |
| `updateOffer()` | Mixed Parameters | 456 | Gleiche Inkonsistenz | 🔴 HOCH |
| `listInvoices()` | Hardcoded snake_case | 481 | `SELECT ... unit_price, parent_item_id FROM invoice_line_items` | 🟡 MITTEL |
| `getInvoice()` | Hardcoded snake_case | 517 | Gleiche Inkonsistenz | 🟡 MITTEL |
| `createInvoice()` | Mixed Parameters | 579 | `mappedItem.unit_price` vs `mappedItem.parent_item_id` | 🔴 HOCH |
| `updateInvoice()` | Mixed Parameters | 626 | Gleiche Inkonsistenz | 🔴 HOCH |
| `createPackage()` | Mixed Parameters | 237 | `mappedItem.parent_item_id` in hardcoded SQL | 🔴 HOCH |
| `updatePackage()` | Mixed Parameters | 286 | Gleiche Inkonsistenz | 🔴 HOCH |

### **🟡 Tabellennamen-Inkonsistenzen (MITTEL)**

| **camelCase Query** | **Tatsächlicher Tabellenname** | **Status** | **Betroffene Zeilen** |
|---------------------|-------------------------------|------------|----------------------|
| `packageLineItems` | `package_line_items` | ❌ FALSCH | 160, 185 |
| `offerLineItems` | `offer_line_items` | ❌ FALSCH | Implizit durch hardcoded SQL |
| `invoiceLineItems` | `invoice_line_items` | ❌ FALSCH | Implizit durch hardcoded SQL |

---

## 🔧 **3. ROOT-CAUSE ANALYSE**

### **Hauptproblem: Field-Mapper Unvollständigkeit**
```typescript
// ❌ AKTUELL: Fehlende Mappings im field-mapper.ts
'parentItemId': 'parent_item_id',    // FEHLT!
'unitPrice': 'unit_price',           // FEHLT!
'packageId': 'package_id',           // FEHLT!
'invoiceId': 'invoice_id',           // FEHLT!
'vatRate': 'vat_rate',               // FEHLT!
'vatAmount': 'vat_amount',           // FEHLT!
'offerNumber': 'offer_number',       // FEHLT!
'invoiceNumber': 'invoice_number'    // FEHLT!
```

### **Sekundärproblem: SQLiteAdapter Architektur-Inkonsistenz**
```typescript
// ❌ PROBLEM: Mix aus convertSQLQuery() und hardcoded snake_case
const query = convertSQLQuery("SELECT * FROM packages ORDER BY createdAt DESC"); // ✅ RICHTIG
const lineItemQuery = `SELECT id, title, quantity, amount, parent_item_id FROM package_line_items WHERE package_id = ?`; // ❌ FALSCH
```

---

## 📋 **4. REPARATUR-IMPLEMENTIERUNGSPLAN**

### **🔴 PHASE 1: Field-Mapper Vervollständigung (CRITICAL - 30 Min)**

| **Schritt** | **Aktion** | **Dateien** | **Aufwand** |
|-------------|------------|-------------|-------------|
| 1.1 | Field-Mapper um 8 fehlende Mappings erweitern | field-mapper.ts | 5 Min |
| 1.2 | Tabellennamen-Mappings hinzufügen | field-mapper.ts | 5 Min |
| 1.3 | Tests für neue Mappings | Test-Dateien | 20 Min |

**Code-Vorlage für Phase 1:**
```typescript
// Ergänzungen für field-mapper.ts
'parentItemId': 'parent_item_id',
'unitPrice': 'unit_price', 
'packageId': 'package_id',
'invoiceId': 'invoice_id',
'vatRate': 'vat_rate',
'vatAmount': 'vat_amount',
'offerNumber': 'offer_number',
'invoiceNumber': 'invoice_number',

// Tabellennamen
'packageLineItems': 'package_line_items',
'offerLineItems': 'offer_line_items', 
'invoiceLineItems': 'invoice_line_items'
```

### **🔴 PHASE 2: SQLiteAdapter LineItem Queries Fix (CRITICAL - 60 Min)**

| **Schritt** | **Betroffene Methods** | **Fix-Pattern** | **Aufwand** |
|-------------|----------------------|-----------------|-------------|
| 2.1 | `listOffers()`, `getOffer()` | Hardcoded → `convertSQLQuery()` | 15 Min |
| 2.2 | `listInvoices()`, `getInvoice()` | Hardcoded → `convertSQLQuery()` | 15 Min |
| 2.3 | `listPackages()`, `getPackage()` | Tabellennamen korrigieren | 10 Min |
| 2.4 | CREATE/UPDATE Methods | Parameter-Mapping korrigieren | 20 Min |

**Code-Vorlage für Phase 2:**
```typescript
// ✅ RICHTIG: Konvertierte LineItem Queries
const lineItemQuery = convertSQLQuery(`
  SELECT id, title, description, quantity, unitPrice, total, parentItemId 
  FROM offerLineItems 
  WHERE offerId = ? ORDER BY id
`);
```

### **🟡 PHASE 3: Services Schema-Drift Fix (MEDIUM - 30 Min)**

| **Service** | **Problem** | **Fix** | **Aufwand** |
|-------------|-------------|---------|-------------|
| ExportService | Direct field access | Field-Mapper integration | 15 Min |
| NummernkreisService | Snake_case SQL hardcoded | convertSQLQuery() usage | 10 Min |
| Persistence layer | Legacy field names | Alignment mit Field-Mapper | 5 Min |

### **✅ PHASE 4: Validierung & Testing (30 Min)**

| **Test-Kategorie** | **Scope** | **Aufwand** |
|-------------------|-----------|-------------|
| Unit Tests | Field-Mapper functionality | 10 Min |
| Integration Tests | SQLiteAdapter CRUD operations | 15 Min |
| E2E Tests | Settings, Numbering, LineItems | 5 Min |

---

## ⚡ **5. PRIORITÄTS-MATRIX**

### **🔴 SOFORT (Blocker für Numbering Circles):**
1. Field-Mapper um `parentItemId`, `unitPrice` erweitern
2. Package LineItem Queries korrigieren  
3. Settings/Numbering Circle Schema Tests

### **🟡 KURZFRISTIG (Performance & Data Integrity):**
1. Offer/Invoice LineItem Queries korrigieren
2. CREATE/UPDATE Parameter-Mapping fixes
3. ExportService Field-Mapper Integration

### **🟢 MITTELFRISTIG (Code Quality):**
1. Services Schema-Drift Alignment
2. Migration Documentation Update  
3. Integration Test Coverage

---

## 🎯 **6. ERFOLGSKRITERIEN**

| **Kriterium** | **Messbar** | **Ziel** |
|---------------|-------------|----------|
| Schema Consistency | 0 camelCase/snake_case Mismatches | 100% |
| Field-Mapper Coverage | Alle DB-Felder gemappt | 100% |
| SQLiteAdapter Consistency | Einheitliche convertSQLQuery() Usage | 100% |
| NumberingCircles functional | Settings-Page lädt Nummernkreise | ✅ |
| LineItems functional | Sub-Items werden korrekt geladen | ✅ |
| Export functional | PDF/CSV Export ohne Schema-Fehler | ✅ |

---

## 🔍 **7. RISIKO-ASSESSMENT**

| **Risiko** | **Wahrscheinlichkeit** | **Impact** | **Mitigation** |
|------------|----------------------|------------|----------------|
| Breaking Changes | 🟡 MITTEL | 🔴 HOCH | Schrittweise Migration, Tests |
| Data Loss | 🟢 NIEDRIG | 🔴 HOCH | Backup vor Änderungen |
| Performance Impact | 🟡 MITTEL | 🟡 MITTEL | Field-Mapper Optimierung |
| User Experience | 🔴 HOCH | 🟡 MITTEL | Sofortige Settings-Fix |

---

## ✅ **8. NÄCHSTE SCHRITTE (EMPFEHLUNG)**

1. **SOFORT**: Field-Mapper um kritische Mappings erweitern (5 Min)
2. **DANACH**: Package LineItem Queries korrigieren (10 Min)  
3. **DANN**: EinstellungenPage Funktionalität testen
4. **ANSCHLIESSEND**: Vollständige SQLiteAdapter Reparatur (60 Min)

**⏱️ Gesamtaufwand: ~2 Stunden für vollständige Schema-Konsistenz**

**🎯 Unmittelbares Ziel: Numbering Circles wieder funktionsfähig machen (15 Min)**
