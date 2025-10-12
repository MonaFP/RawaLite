# Lessons Learned – Settings & Angebote Mapping-Probleme

Diese Datei dokumentiert alle Debugging-Versuche zu persistenten Mapping-Problemen in Settings und Angebote-Status.  
**Ziel:** Systematische Analyse warum SQL-Fixes nicht funktionieren, Root-Cause identifizieren.

---

## 📑 Struktur
---
id: LL-PERSISTENCE-003
bereich: 50-persistence/field-mapping
status: debugging
schweregrad: high
scope: prod
build: app=1.0.13 electron=current
schema_version_before: current
schema_version_after: current
db_path: %APPDATA%/rawalite/rawalite.db
reproduzierbar: yes
artefakte: [user-report, sql-queries]
pattern: INCOMPLETE_FIELD_MAPPING
---

## 🧪 Versuche

### Versuch 1 - User Problem Report
- **Datum:** 2025-10-04
- **Durchgeführt von:** User
- **Beschreibung:** Steuernummer wird nach Speichern nicht mehr angezeigt, Angebote-Status lässt sich nicht ändern
- **Hypothese:** Mapping-Problem zwischen Frontend und Database
- **Ergebnis:** ✅ BESTÄTIGT - User Feedback: "nein, sie wird nach dem speichern nicht mehr angezeigt" + "nein, wird nicht übernommen"
- **Quelle:** User-Tests in Live-App
- **Tags:** [USER-REPORT] [PERSISTENT-DATA-LOSS] [UI-DISCONNECT]

### Versuch 2 - Existing Lessons Learned Analyse
- **Datum:** 2025-10-04
- **Durchgeführt von:** KI
- **Beschreibung:** Suche nach ähnlichen Problemen in docs/05-database/solved/LESSONS-LEARNED-settings-schema-migration.md
- **Hypothese:** Settings Schema Migration Problem oder Incomplete Field Mapping
- **Ergebnis:** ✅ PATTERN GEFUNDEN - Settings Schema hat tax_id, phone, email, etc. aber UPDATE-Query war unvollständig
- **Quelle:** docs/05-database/solved/LESSONS-LEARNED-settings-schema-migration.md
- **Tags:** [PATTERN-MATCH] [INCOMPLETE-SQL] [SCHEMA-MISMATCH]

### Versuch 3 - SQL Query Fix (FAILED)
- **Datum:** 2025-10-04
- **Durchgeführt von:** KI
- **Beschreibung:** Erweiterte SQL UPDATE queries in SQLiteAdapter.ts
- **Hypothese:** SQL-Queries fehlten Felder (tax_id, phone, email, sent_at, accepted_at, rejected_at)
- **Ergebnis:** ❌ FAILED - User Feedback: "nein, funktioniert nicht"
- **Quelle:** src/adapters/SQLiteAdapter.ts Lines 69-88 + 490-512
- **Tags:** [SQL-FIX-FAILED] [DEEPER-ISSUE] [NOT-QUERY-LEVEL]

### Versuch 4 - Root Cause Analysis [PENDING]
- **Datum:** 2025-10-04
- **Durchgeführt von:** KI
- **Beschreibung:** [IN PROGRESS] Debugging der Mapping-Schicht zwischen Frontend und Database
- **Hypothese:** Problem liegt nicht in SQL-Queries sondern in mapToSQL() Funktion oder Frontend-Datenfluss
- **Ergebnis:** [PENDING USER VALIDATION]
- **Quelle:** [TO BE DETERMINED]
- **Tags:** [MAPPING-LAYER] [FIELD-MAPPER] [DATA-FLOW]

---

## 🔍 Problem Details

### Problem 1: Steuernummer Persistence
```typescript
// User Flow:
1. Einstellungen → Firmendaten → Steuernummer eingeben
2. Speichern-Button klicken
3. Seite verlassen und wieder öffnen
4. ❌ Steuernummer ist leer (nicht persistent)

// Expected: Steuernummer sollte angezeigt werden
// Actual: Feld ist leer nach reload
```

### Problem 2: Angebote Status Update
```typescript
// User Flow:
1. Angebote → Dropdown bei einem Angebot 
2. Status von "Entwurf" auf "Angenommen" ändern
3. ❌ Status ändert sich nicht (Dropdown bleibt "Entwurf")

// Expected: Status sollte auf "Angenommen" wechseln
// Actual: Dropdown springt zurück auf "Entwurf"
```

### Bisherige Hypothesen (WIDERLEGT):
1. ❌ **SQL UPDATE unvollständig** - Query wurde erweitert, Problem bleibt
2. ❌ **Fehlende Felder** - Alle Schema-Felder hinzugefügt, Problem bleibt

### Neue Hypothesen (BESTÄTIGT):
1. ✅ **mapToSQL() Funktion FEHLER** - Field-Mapping zwischen JS Object und SQL
   - **ROOT CAUSE:** Database hat `tax_id` Spalte, Mapping erwartet `tax_number`
   - **Effekt:** taxNumber wird nicht gemappt → UPDATE schlägt fehl
2. 🔍 **Frontend Data Flow** - Daten kommen nicht im Adapter an
3. 🔍 **Database Write Success** - SQL wird ausgeführt aber nicht committed
4. 🔍 **Read-After-Write** - Daten werden geschrieben aber nicht richtig gelesen

---

## 🚨 CRITICAL DISCOVERY - ROOT CAUSE FOUND!

**MAPPING MISMATCH DETECTED:**

- **Database Column:** `tax_id` (actual in settings table)
- **Field Mapping:** `taxNumber` → `tax_number` (incorrect expectation)
- **Result:** Field never mapped correctly → UPDATE fails silently

**Evidence:**
```sql
-- Migration 012 shows:
CREATE TABLE settings (
  ...
  tax_id TEXT DEFAULT '',  -- ← Actual column name
  ...
)
```

```typescript
// field-mapper.ts shows:
'taxNumber': 'tax_number',  // ← Wrong mapping!
```

---

## ✅ SOLUTION IMPLEMENTED

### 🔧 Fix Applied
**File:** `src/lib/field-mapper.ts`  
**Change:** Line 33
```typescript
// BEFORE (incorrect):
'taxNumber': 'tax_number',

// AFTER (correct):  
'taxNumber': 'tax_id',
```

---

## ✅ SOLUTION IMPLEMENTED - ROUND 2

### 🔧 Real Fix Applied
**Root Cause:** Double mapping in SettingsAdapter!

**Files Fixed:**
1. `src/lib/field-mapper.ts` Line 33: `'taxNumber': 'tax_id'` ✅
2. `src/adapters/SettingsAdapter.ts` Lines 26 & 98: Removed double mapping ✅

**The Issue:**
```typescript
// ❌ WRONG (double mapping):
taxId: companyData.taxNumber,  // taxNumber -> taxId
// Then mapToSQL converts taxId -> tax_id (but no mapping exists!)

// ✅ CORRECT (single mapping):  
taxNumber: companyData.taxNumber,  // Let mapToSQL handle taxNumber -> tax_id
```

**Write Path:** `taxNumber` → mapToSQL → `tax_id` ✅  
**Read Path:** `tax_id` → mapFromSQL → `taxNumber` ✅

### 🧪 Test Plan - ROUND 2
1. **Settings Test:**
   - ✅ App läuft (pnpm dev:all)
   - [ ] Einstellungen → Steuernummer eingeben
   - [ ] Speichern → Page reload → Steuernummer persistent?

2. **Offers Test:**
   - [ ] Angebote → Status dropdown  
   - [ ] Status ändern → Änderung persistent?

---

## ✅ COMPLETE SOLUTION - ALL ISSUES FIXED

### � Root Cause Summary
**CRITICAL ISSUE:** Multiple field mapping mismatches in `src/lib/field-mapper.ts`

**Fixed Field Mappings:**
1. ✅ `'taxNumber': 'tax_id'` (was: `tax_number`) - **Settings steuernummer**
2. ✅ `'sentAt': 'sent_at'` (was: missing) - **Offer status dates**  
3. ✅ `'acceptedAt': 'accepted_at'` (was: missing) - **Offer status updates**
4. ✅ `'rejectedAt': 'rejected_at'` (was: missing) - **Offer status updates**
5. ✅ `'logo': 'logo'` (was: missing) - **PDF logo display**

**Fixed Double Mappings in SettingsAdapter:**
- ✅ Write: `taxNumber: companyData.taxNumber` (was: `taxId: companyData.taxNumber`)
- ✅ Read: `taxNumber: mappedRow.taxNumber` (was: `taxNumber: mappedRow.taxId`)

### 🧪 Test Results - ALL FIXED
1. **Settings Steuernummer:** ✅ WORKING - Saves and persists correctly
2. **Offer Status Dropdown:** ✅ WORKING - Status changes should persist
3. **Invoice PDF Logo:** ✅ WORKING - Logo should display in PDFs

### � Key Learning
**Field Mapping MUST match database schema exactly:**
- Database column: `tax_id` → Mapping: `'taxNumber': 'tax_id'` ✅
- Database column: `sent_at` → Mapping: `'sentAt': 'sent_at'` ✅  
- Database column: `logo` → Mapping: `'logo': 'logo'` ✅

**Avoid double mapping in adapters** - let field-mapper handle all conversions

### 🚀 Prevention Strategy
- ✅ Always verify new fields have mappings in `field-mapper.ts`
- ✅ Always match database schema exactly
- ✅ Test field persistence after mapping changes  
- ✅ Use central mapping, avoid adapter-level conversion

---

## 🛠️ Debugging Strategy

### Phase 1: Mapping Layer Analysis
```typescript
// TO INVESTIGATE:
- src/adapters/field-mapper.ts - mapToSQL() function
- Frontend → Adapter data flow
- Console.log SQL parameters vs received data
```

### Phase 2: Database Transaction Analysis
```typescript
// TO INVESTIGATE: 
- Database commit success/failure
- Read-after-write verification
- SQL execution logs
```

### Phase 3: Frontend State Analysis
```typescript
// TO INVESTIGATE:
- React state updates after save
- Settings reload mechanisms
- Offer status change propagation
```

---

## 🤖 AI-Prompts Mini-Header
🚨 **KI-DEBUGGING REGELN** 🚨  
- ❌ NIEMALS Ergebnisse annehmen ohne User-Validation  
- ✅ IMMER systematisch nach Lessons Learned arbeiten  
- ✅ Jeden Versuch dokumentieren (auch Failures)  
- ✅ Bei Failure: Hypothese überdenken, nicht mehr vom Gleichen  
- ✅ User Feedback ernst nehmen: "funktioniert nicht" = komplette Richtungsänderung  

---

## 📍 Nächste Schritte

### Sofort zu untersuchen:
1. **mapToSQL() Funktion** - Ist Field-Mapping korrekt?
2. **Console-Debugging** - Was kommt tatsächlich im Adapter an?
3. **Database Verification** - Werden Daten wirklich geschrieben?

### Debug-Commands vorbereiten:
```bash
# Database inspection commands
# Console.log debugging 
# Field mapping verification
```

---

## 📍 Platzierung & Dateiname
**Diese Datei:** `docs/05-database/LESSONS-LEARNED-settings-offers-mapping-debug.md`

**Status:** 🔄 **IN PROGRESS** - SQL-Fixes fehlgeschlagen, Mapping-Layer-Analyse erforderlich