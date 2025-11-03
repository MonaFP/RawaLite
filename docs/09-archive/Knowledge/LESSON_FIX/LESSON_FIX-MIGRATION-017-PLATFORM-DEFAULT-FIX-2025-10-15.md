# Lessons Learned – Migration 017 Platform Default Value Fix
+> **🤖 KI-AUTO-DETECTION SYSTEM:**
> - **AKTUELLER STATUS:** KNOWLEDGE_ONLY
> - **TEMPLATE-QUELLE:** 06-handbook/TEMPLATE/VALIDATED_TEMPLATE-LESSONS-LEARNED_2025-10-26.md
> - **AUTO-UPDATE:** Bei ähnlichen Problemen als Referenz nutzen
> - **STATUS-KEYWORDS:** Erkannt durch LESSON_FIX, Knowledge Base, Historical Reference
Diese Datei dokumentiert die Migration 017 Debugging-Session und die Lösung des SQLite DEFAULT-Wert Problems.  
Ziel: **KI soll wissen, was bereits probiert wurde, mit welchem Ergebnis**, um Doppelarbeit zu vermeiden.

---

## 📑 Struktur
---
id: LL-DATABASE-017
bereich: 05-database/migration
status: resolved
schweregrad: medium
scope: dev|prod
build: app=1.0.14 electron=31.7.7
schema_version_before: 16
schema_version_after: 17
db_path: %APPDATA%\Electron\database\rawalite.db
reproduzierbar: yes
artefakte: [017_add_update_history.ts, migration logs, dev session logs]
---

## 🎯 **Problem-Definition**

**Symptom:** App startet nicht in Development-Umgebung nach GitHub Release v1.0.14
**Fehlermeldung:** `SqliteError: default value of column [platform] is not constant`
**Ursache:** Migration 017 enthielt komplexe CASE-Abfrage in DEFAULT-Klausel
**Impact:** Vollständiger App-Start-Fehler, Migration rollback erforderlich

---

## 🧪 Versuche

### Versuch 1
- **Datum:** 2025-10-07  
- **Durchgeführt von:** GitHub Copilot KI  
- **Beschreibung:** Problem-Identifikation durch `pnpm dev:all` Output-Analyse  
- **Hypothese:** Migration 017 hat SQL-Syntax-Problem, da sie in v1.0.14 neu hinzugefügt wurde  
- **Ergebnis:** ✅ **BESTÄTIGT** - Migration 017 platform-Spalte DEFAULT-Wert Problem identifiziert  
- **Quelle:** Terminal Output `pnpm dev:all` - Migration 17 failed: SqliteError  
- **Tags:** [MIGRATION-SYNTAX], [DEFAULT-VALUE-ERROR]  

### Versuch 2
- **Datum:** 2025-10-07  
- **Durchgeführt von:** GitHub Copilot KI  
- **Beschreibung:** Source-Code Analyse der Migration 017_add_update_history.ts  
- **Hypothese:** Komplexe CASE-Abfrage in DEFAULT nicht erlaubt in SQLite  
- **Ergebnis:** ✅ **BESTÄTIGT** - CASE WHEN EXISTS(...) THEN 'unknown' ELSE 'unknown' END nicht konstant  
- **Quelle:** Migration-Datei Line ~44-48  
- **Tags:** [SQLITE-CONSTRAINT], [CASE-IN-DEFAULT]  

### Versuch 3
- **Datum:** 2025-10-07  
- **Durchgeführt von:** GitHub Copilot KI  
- **Beschreibung:** Fix implementiert - platform DEFAULT 'unknown' (konstanter Wert)  
- **Hypothese:** Robuster konstanter DEFAULT-Wert wird Migration reparieren  
- **Ergebnis:** ✅ **BESTÄTIGT** - Source-Fix erfolgreich implementiert  
- **Quelle:** replace_string_in_file operation erfolgreich  
- **Tags:** [SOURCE-FIX], [CONSTANT-DEFAULT]  

### Versuch 4
- **Datum:** 2025-10-07  
- **Durchgeführt von:** GitHub Copilot KI  
- **Beschreibung:** Main Process Rebuild um geänderte Migration einzubauen  
- **Hypothese:** esbuild muss Migration-Änderungen in dist-electron/main.cjs integrieren  
- **Ergebnis:** ✅ **BESTÄTIGT** - `pnpm run build:main` erfolgreich, 221.8kb generiert  
- **Quelle:** Terminal Output build:main  
- **Tags:** [BUILD-INTEGRATION], [ESBUILD-SUCCESS]  

### Versuch 5
- **Datum:** 2025-10-07  
- **Durchgeführt von:** GitHub Copilot KI  
- **Beschreibung:** Development-Environment Restart mit korrigierter Migration  
- **Hypothese:** `pnpm dev:all` wird jetzt mit reparierter Migration 017 erfolgreich sein  
- **Ergebnis:** ✅ **BESTÄTIGT** - App startet erfolgreich, Migration 017 completed, Schema v17  
- **Quelle:** Terminal Output - "✅ Migration 17 completed", "Application ready with database initialized"  
- **Tags:** [DEV-SUCCESS], [MIGRATION-SUCCESS], [SCHEMA-V17]

---

## 📌 Status
- [x] **Gelöste Probleme:**  
  - Migration 017 SQLite DEFAULT-Wert Syntax-Problem
  - App-Start-Blockade durch fehlgeschlagene Migration
  - Update History Tabelle erfolgreich erstellt (Schema v17)
  - UpdateHistoryService erfolgreich initialisiert

- [x] **Validierte Architektur-Entscheidungen:**  
  - Konstante DEFAULT-Werte in SQLite Migrations verwenden
  - Main Process Rebuild nach Migration-Änderungen erforderlich
  - Development-Environment kann nach Migration-Fix restart werden
  - Backup-System funktioniert korrekt (pre-migration backup erstellt)

---

## 🔍 Quick-Triage-Checkliste
- [x] **App-Name korrekt?** RawaLite  
- [x] **IsPackaged Status?** Development (nicht packaged)  
- [x] **userData Path korrekt?** C:\Users\ramon\AppData\Roaming\Electron\database\rawalite.db  
- [x] **DB File existiert?** Ja, mit Schema Version 16→17  
- [x] **PRAGMA Checks:** foreign_keys=1, journal_mode=wal, synchronous=2, temp_store=2  
- [x] **Tabellen vorhanden?** update_history Tabelle erfolgreich erstellt  
- [x] **Migration Ledger konsistent?** Version 16→17 erfolgreich  
- [x] **IPC Bridge funktional?** Ja, UpdateManagerService initialisiert  
- [x] **Transaction State clean?** Migration in Transaction erfolgreich committed  
- [x] **Log Files aktuell?** Ja, Session ID erstellt: mgg7h7u1-77f3e01dc36486c7  

---

## 📝 Standard-SQL-Snippets

### Problem-Pattern (❌ VERBOTEN):
```sql
-- FALSCH: Komplexe DEFAULT-Werte
platform TEXT DEFAULT (CASE 
  WHEN EXISTS (SELECT 1 FROM pragma_compile_options WHERE compile_options = 'ENABLE_COLUMN_METADATA') 
  THEN 'unknown' 
  ELSE 'unknown' 
END)
```

### Lösung-Pattern (✅ KORREKT):
```sql
-- RICHTIG: Konstante DEFAULT-Werte
platform TEXT DEFAULT 'unknown'
```

### Migration-Debug-Queries:
```sql
-- Schema Version prüfen
PRAGMA user_version;

-- Tabellen-Info prüfen
PRAGMA table_info(update_history);

-- Migration-Backup-Status
SELECT name FROM sqlite_master WHERE type='table' AND name='update_history';
```

---

## 🛠️ PowerShell Env & DB-Report

### Development Environment Status:
```powershell
# Aktuelle Session Info (2025-10-07 06:55:47)
App: RawaLite v1.0.14
Electron: 31.7.7
Node: Built for Electron ABI 125
Database: rawalite.db (Schema v17)
Vite: http://localhost:5174/
Session: mgg7h7u1-77f3e01dc36486c7
```

### Build Commands (Working):
```powershell
pnpm run build:main        # Rebuild nach Migration-Änderungen
pnpm dev:all               # Full development environment
pnpm validate:critical-fixes # All 11 fixes still valid
```

---

## 📊 Migrations-Ledger & Checksums

### Migration 017 Details:
```sql
-- Update History Tracking Table
CREATE TABLE update_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  timestamp TEXT NOT NULL DEFAULT (datetime('now')),
  session_id TEXT NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN (...)),
  current_version TEXT NOT NULL,
  target_version TEXT,
  success BOOLEAN,
  error_message TEXT,
  error_code TEXT,
  progress_percent INTEGER DEFAULT 0,
  duration_ms INTEGER,
  user_action TEXT CHECK (user_action IN ('automatic', 'manual', 'scheduled')),
  download_url TEXT,
  file_size_bytes INTEGER,
  file_hash TEXT,
  platform TEXT DEFAULT 'unknown',  -- FIXED: Konstanter DEFAULT
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
```

### Backup-Status:
- **Pre-Migration Backup:** `pre-migration-2025-10-07T06-55-46-907Z.sqlite`
- **Backup Location:** `%APPDATA%\Electron\database\backups\`
- **Recovery:** Verfügbar falls Rollback erforderlich

---

## 🚨 Recovery-SOP

### Falls Migration 017 erneut fehlschlägt:
1. **Stop Development:** `Ctrl+C` in Terminal  
2. **Restore Backup:** Replace rawalite.db mit pre-migration backup  
3. **Check Migration:** Verify 017_add_update_history.ts konstante DEFAULT-Werte  
4. **Rebuild Main:** `pnpm run build:main`  
5. **Restart:** `pnpm dev:all`  

### Emergency Commands:
```powershell
# Manual DB Reset (nur Development!)
Remove-Item "$env:APPDATA\Electron\database\rawalite.db*"
pnpm dev:all  # Erstellt neue DB mit allen Migrations

# Migration-Status prüfen
sqlite3 "$env:APPDATA\Electron\database\rawalite.db" "PRAGMA user_version;"
```

---

## 🛡️ Guard-Skripte in CI

### Empfohlene Migration-Tests:
```typescript
// Migration 017 Test
describe('Migration 017: Update History', () => {
  it('should create update_history table with constant defaults', async () => {
    const db = new Database(':memory:');
    await runMigration017(db);
    
    // Test konstanter DEFAULT-Wert
    const result = db.exec(`
      INSERT INTO update_history (session_id, event_type, current_version) 
      VALUES ('test', 'check_started', '1.0.14')
    `);
    
    expect(result).toBeTruthy();
    
    const row = db.exec('SELECT platform FROM update_history')[0]?.values[0];
    expect(row[0]).toBe('unknown'); // Konstanter DEFAULT-Wert
  });
});
```

---

## 🤖 AI-Prompts Mini-Header
🚨 **KI-DEBUGGING REGELN** 🚨  
- ❌ NIEMALS Ergebnisse raten oder annehmen  
- ✅ IMMER Entwickler nach Validierung fragen  
- ✅ Dev vs Prod Environment unterscheiden  
- ✅ PNPM-only (niemals npm/yarn)  
- ✅ Methodisch nach debugging.md vorgehen  
- ✅ Jeden Versuch dokumentieren (auch Failures)  
- ✅ Fakten-basiert, keine Spekulationen  

---

## 🏷️ Failure-Taxonomie (Tags)

- **[MIGRATION-SYNTAX]** - SQL-Syntax-Probleme in Migrations
- **[DEFAULT-VALUE-ERROR]** - SQLite DEFAULT-Wert Constraints
- **[SQLITE-CONSTRAINT]** - SQLite-spezifische Einschränkungen
- **[CASE-IN-DEFAULT]** - Komplexe Ausdrücke in DEFAULT-Klauseln
- **[BUILD-INTEGRATION]** - esbuild Integration nach Code-Änderungen
- **[DEV-SUCCESS]** - Erfolgreiche Development-Environment Starts

---

## 📋 ADR-Kurzformat

### ADR: SQLite Migration DEFAULT-Werte
**Status:** Approved ✅  
**Decision:** Verwende nur konstante Werte in DEFAULT-Klauseln  
**Rationale:** SQLite erwartet konstante Ausdrücke, keine CASE/Function-Calls  
**Consequences:** Migration-Syntax einfacher, aber weniger dynamisch  

---

## ⚡ Start-Assertions beim App-Boot

### Erfolgreich validierte Boot-Sequenz:
1. ✅ **Database öffnen:** rawalite.db gefunden und geöffnet
2. ✅ **PRAGMAs setzen:** foreign_keys, journal_mode, synchronous, temp_store
3. ✅ **Schema-Check:** Version 16 detected, Target 17
4. ✅ **Migration-Backup:** pre-migration backup erstellt  
5. ✅ **Migration 017:** update_history Tabelle erfolgreich erstellt
6. ✅ **Schema-Update:** Version auf 17 gesetzt
7. ✅ **Service-Init:** UpdateHistoryService erfolgreich initialisiert
8. ✅ **App-Ready:** Application ready with database initialized

---

## 🔄 Shadow-Write Paritätstest (Dev-only)

*(Nicht anwendbar für Migration-Testing)*

---

## 🧪 Minimal-Repro Harness

### Migration 017 Isolated Test:
```javascript
// scripts/test-migration-017.js
const Database = require('better-sqlite3');
const { up } = require('../src/main/db/migrations/017_add_update_history.ts');

const db = new Database(':memory:');
try {
  up(db);
  console.log('✅ Migration 017 successful');
  
  // Test INSERT mit DEFAULT-Werten
  const stmt = db.prepare(`
    INSERT INTO update_history (session_id, event_type, current_version) 
    VALUES (?, ?, ?)
  `);
  stmt.run('test-session', 'check_started', '1.0.14');
  
  console.log('✅ INSERT with defaults successful');
} catch (error) {
  console.error('❌ Migration 017 failed:', error.message);
}
```

---

## 📍 Platzierung & Dateiname

**Diese Datei:** `docs/03-data/LESSONS-LEARNED-migration-017-platform-default-fix.md`  
**Verlinkt von:**  
- `docs/03-data/INDEX.md`  
- `docs/02-dev/debugging.md`  

---

## ⚠️ WICHTIGE ERINNERUNG FÜR KI
- **NIEMALS Ergebnisse raten oder annehmen**  
- **IMMER Entwickler nach Validierung fragen**  
- **ALLE Versuche dokumentieren**, auch fehlgeschlagene  
- **Methodisch vorgehen** nach debugging.md Standards

## 🎯 **Zusammenfassung für zukünftige KI-Sessions**

**Problem:** Migration 017 mit komplexer CASE-DEFAULT-Klausel → SQLite-Fehler  
**Lösung:** Konstante DEFAULT-Werte verwenden (`platform TEXT DEFAULT 'unknown'`)  
**Workflow:** Source-Fix → Main-Rebuild → Dev-Restart  
**Ergebnis:** App funktioniert, Schema v17, Update History System aktiv  

**Key Learning:** SQLite DEFAULT-Klauseln müssen konstante Werte sein, keine Funktions-Aufrufe oder CASE-Ausdrücke.