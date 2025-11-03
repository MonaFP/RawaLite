# Lessons Learned – Settings Schema Migration (SQL-Fehler Behebung)
+> **🤖 KI-AUTO-DETECTION SYSTEM:**
> - **AKTUELLER STATUS:** KNOWLEDGE_ONLY
> - **TEMPLATE-QUELLE:** 06-handbook/TEMPLATE/VALIDATED_TEMPLATE-LESSONS-LEARNED_2025-10-26.md
> - **AUTO-UPDATE:** Bei ähnlichen Problemen als Referenz nutzen
> - **STATUS-KEYWORDS:** Erkannt durch LESSON_FIX, Knowledge Base, Historical Reference
Diese Datei dokumentiert alle Debugging- und Analyse-Versuche zum Settings-Schema Problem.  
Ziel: **KI soll wissen, was bereits probiert wurde, mit welchem Ergebnis**, um Doppelarbeit zu vermeiden.

---

## 📑 Struktur
---
id: LL-PERSISTENCE-001
bereich: 50-persistence/migration
status: resolved
schweregrad: high
scope: prod
build: app=1.0.0 electron=22.3.27
schema_version_before: 1 (key-value settings)
schema_version_after: 2 (structured settings)
db_path: %APPDATA%/rawalite/rawalite.db
reproduzierbar: yes
artefakte: [DevTools Console Screenshot, Migration Files]
---

## 🧪 Versuche

### Versuch 1 - Problem-Identifikation
- **Datum:** 2025-10-01  
- **Durchgeführt von:** GitHub Copilot  
- **Beschreibung:** Analyse der SQL-Fehler aus DevTools Console Screenshot  
- **Hypothese:** Settings-Tabelle hat falsches Schema für SettingsAdapter  
- **Ergebnis:** ✅ **BESTÄTIGT** - Settings-Tabelle verwendet key-value Schema (key TEXT PRIMARY KEY, value TEXT), aber SettingsAdapter erwartet id-basiertes Schema mit company_name, street, etc.  
- **Quelle:** DevTools Console: `"SqliteError: no such column: id"` bei `SELECT * FROM settings WHERE id = 1`  
- **Tags:** [SCHEMA-MISMATCH] [SQL-ERROR] [ADAPTER-CONFLICT]  

### Versuch 2 - Schema-Analyse
- **Datum:** 2025-10-01  
- **Durchgeführt von:** GitHub Copilot  
- **Beschreibung:** Untersuchung der aktuellen Migration 000_init.ts und SettingsAdapter  
- **Hypothese:** Migration erstellt falsches Schema für moderne SettingsAdapter API  
- **Ergebnis:** ✅ **BESTÄTIGT** - 000_init.ts erstellt `key-value` Schema, SettingsAdapter.getSettings() erwartet strukturierte Spalten  
- **Quelle:** `src/main/db/migrations/000_init.ts` vs `src/adapters/SettingsAdapter.ts`  
- **Tags:** [MIGRATION-OUTDATED] [API-EVOLUTION]  

### Versuch 3 - Migration 001 Implementierung
- **Datum:** 2025-10-01  
- **Durchgeführt von:** GitHub Copilot  
- **Beschreibung:** Erstellung von Migration 001_settings_restructure.ts für Schema-Umstellung  
- **Hypothese:** Neue Migration kann key-value zu strukturiertem Schema migrieren  
- **Ergebnis:** ✅ **ERFOLGREICH** - Migration erstellt, Data-Migration von altem zu neuem Format implementiert  
- **Quelle:** `src/main/db/migrations/001_settings_restructure.ts`  
- **Tags:** [MIGRATION-CREATED] [DATA-MIGRATION] [SCHEMA-RESTRUCTURE]  
- **Artefakte:** Migration-Datei mit up/down Funktionen  

### Versuch 4 - Build & Installation Test
- **Datum:** 2025-10-01  
- **Durchgeführt von:** GitHub Copilot  
- **Beschreibung:** Neubau der App mit Migration und lokale Installation  
- **Hypothese:** Migration wird beim App-Start ausgeführt und behebt SQL-Fehler  
- **Ergebnis:** ✅ **ERFOLGREICH** - App startet ohne SQL-Fehler, Settings-Schema erfolgreich migriert  
- **Quelle:** PowerShell Terminal: `pnpm build && pnpm dist` + Installation  
- **Tags:** [BUILD-SUCCESS] [MIGRATION-EXECUTED] [PROBLEM-RESOLVED]  

---

## 📌 Status
- ✅ **Gelöste Probleme:**  
  - Settings-Schema von key-value zu strukturiertem Format migriert
  - SQL-Fehler "no such column: id" behoben
  - SettingsAdapter funktioniert mit korrektem Schema
  - Numbering circles Schema ebenfalls aktualisiert für Konsistenz

- ✅ **Validierte Architektur-Entscheidungen:**  
  - Structured Settings Schema mit company data columns
  - Migration-basierte Schema-Evolution
  - Backward-compatible Data-Migration mit Fallbacks

---

## 🔍 Quick-Triage-Checkliste
- ✅ **App-Name korrekt?** RawaLite  
- ✅ **IsPackaged Status?** Production Build  
- ✅ **userData Path korrekt?** %APPDATA%/rawalite/  
- ✅ **DB File existiert?** rawalite.db wird erstellt  
- ✅ **PRAGMA Checks:** Schema-Version tracking funktional  
- ✅ **Tabellen vorhanden?** settings, customers, numbering_circles, etc.  
- ✅ **Migration Ledger konsistent?** Migration 001 erfolgreich angewandt  
- ✅ **IPC Bridge funktional?** DbClient async API funktioniert  
- ✅ **Transaction State clean?** Keine pending transactions  
- ✅ **Log Files aktuell?** Keine SQL-Fehler in Console  

---

## 📝 Schema-Transformation Details

### ALT - Key-Value Format (Migration 000):
```sql
CREATE TABLE settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### NEU - Structured Format (Migration 001):
```sql
CREATE TABLE settings (
  id INTEGER PRIMARY KEY DEFAULT 1,
  company_name TEXT DEFAULT '',
  street TEXT DEFAULT '',
  zip TEXT DEFAULT '',
  city TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  email TEXT DEFAULT '',
  website TEXT DEFAULT '',
  tax_id TEXT DEFAULT '',
  vat_id TEXT DEFAULT '',
  kleinunternehmer INTEGER DEFAULT 0,
  bank_name TEXT DEFAULT '',
  bank_account TEXT DEFAULT '',
  bank_bic TEXT DEFAULT '',
  logo TEXT DEFAULT '',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

---

## 🛠️ Migration Strategy

### Data-Migration Logic:
1. **Backup**: Alte key-value Daten lesen und parsen
2. **Transform**: JSON-Werte zu strukturierten Spalten mappen
3. **Insert**: Neue Struktur mit migrierten Daten befüllen
4. **Replace**: Alte Tabelle durch neue ersetzen

### Field Mappings:
```typescript
// JSON companyData -> SQL columns
companyData.name -> company_name
companyData.postalCode -> zip  
companyData.taxNumber -> tax_id
companyData.kleinunternehmer -> kleinunternehmer (boolean -> INTEGER)
```

---

## 📊 Numbering Circles Schema Update

### ALT - Type-Year Based:
```sql
CREATE TABLE numbering_circles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL, -- 'offer', 'invoice'
  year INTEGER NOT NULL,
  last_number INTEGER DEFAULT 0,
  UNIQUE(type, year)
);
```

### NEU - ID-String Based:
```sql
CREATE TABLE numbering_circles (
  id TEXT PRIMARY KEY, -- 'invoice_2025', 'offer_2025'
  name TEXT NOT NULL,
  prefix TEXT DEFAULT '',
  digits INTEGER DEFAULT 3,
  current INTEGER DEFAULT 0,
  resetMode TEXT DEFAULT 'never',
  lastResetYear INTEGER
);
```

---

## 🚨 Recovery-SOP
1. **Stop App**: `Stop-Process -Name "RawaLite" -Force`
2. **Backup DB**: Copy `%APPDATA%/rawalite/rawalite.db`
3. **Rollback Migration**: Use migration 001 down() function if needed
4. **Restart App**: Migration wird automatisch angewandt

---

## 🛡️ Guard-Skripte Integration
- **validate:ipc**: Prüft DbClient API Konsistenz
- **validate:versions**: Ensures schema version tracking
- **typecheck**: Verhindert Type-Mismatches zwischen Adapter und Schema

---

## 🤖 AI-Prompts Mini-Header
🚨 **KI-DEBUGGING REGELN** 🚨  
- ✅ METHODISCH nach debugging.md vorgehen  
- ✅ Schema-Mismatches durch Migration lösen, nicht durch Adapter-Änderung  
- ✅ Data-Migration IMMER mit Backup und Rollback-Plan  
- ✅ Jeden Versuch dokumentieren (auch Failures)  
- ✅ PNPM-only (niemals npm/yarn)  
- ✅ Build vor Installation: `pnpm build && pnpm dist`  

---

## 🏷️ Failure-Taxonomie (Tags)
- `[SCHEMA-MISMATCH]` - Adapter erwartet anderes Schema als DB
- `[API-EVOLUTION]` - Code entwickelt sich schneller als Schema
- `[MIGRATION-OUTDATED]` - Initiale Migration nicht mehr zeitgemäß
- `[DATA-MIGRATION]` - Bestehende Daten müssen transformiert werden
- `[SQL-ERROR]` - Direkte SQL-Ausführungsfehler
- `[ADAPTER-CONFLICT]` - Adapter API nicht kompatibel mit DB Schema

---

## 📋 ADR-Kurzformat
**Decision**: Structured Settings Schema mit company data columns  
**Rationale**: Bessere Performance, Type Safety, SQL-native Queries  
**Consequences**: Migration nötig, aber bessere Maintainability  
**Alternatives**: Adapter an key-value Schema anpassen (verworfen - schlechtere Performance)  

---

## ⚡ Start-Assertions beim App-Boot
```typescript
// Verify settings table schema before SettingsAdapter usage
const schemaCheck = db.prepare(`
  SELECT name FROM pragma_table_info('settings') 
  WHERE name IN ('id', 'company_name', 'street')
`).all();
assert(schemaCheck.length >= 3, 'Settings schema migration not applied');
```

---

## 🧪 Minimal-Repro Harness
```typescript
// Test script für Settings Schema Validation
// File: scripts/test-settings-schema.js
const db = require('better-sqlite3')('test.db');
const { migrations } = require('../src/main/db/migrations');

// Apply migrations
migrations.forEach(m => m.up(db));

// Test settings query
const result = db.prepare('SELECT * FROM settings WHERE id = 1').get();
console.log('Settings schema test:', result ? 'PASS' : 'FAIL');
```

---

## 📍 Platzierung & Dateiname

**Diese Datei:** `docs/50-persistence/migration/LESSONS-LEARNED-settings-schema-migration.md`  
**Verlinkt von:**  
- `docs/50-persistence/INDEX.md`  
- `docs/00-standards/debugging/debugging.md`  

---

## ⚠️ WICHTIGE ERINNERUNG FÜR KI
- **Schema-Änderungen IMMER durch Migration**, nie durch Adapter-Anpassung
- **Data-Migration bei Breaking Changes** zwingend erforderlich  
- **Backward Compatibility** durch down() Migration sicherstellen
- **Testing nach Migration** auf produktionsähnlichen Daten