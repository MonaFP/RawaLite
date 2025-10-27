# Navigation Mode Migration 044 - Implementation Plan

> **Erstellt:** 26.10.2025 | **Letzte Aktualisierung:** 26.10.2025 (Option B: Migration 046 - Detaillierter Plan)  
> **Status:** READY FOR IMPLEMENTATION (Option B approved) | **Typ:** Implementation Plan  
> **Schema:** `WIP_IMPL-NAVIGATION-MODE-MIGRATION-044_2025-10-26.md`  
> **🛡️ Validation:** Fixes from [ROOT_VALIDATED_REGISTRY-CRITICAL-FIXES_2025-10-17.md](ROOT_VALIDATED_REGISTRY-CRITICAL-FIXES_2025-10-17.md) preserved

## 📋 **EXECUTIVE SUMMARY - Migration 046 Plan**

### **Problem:**
SqliteError beim Application-Start: `table user_navigation_mode_settings has no column named header_height`

### **Root Cause:**
**Table-Name-Konflikt zwischen Migration 034 und Migration 042:**
- **Migration 034 SQL:** Definiert Per-Mode Settings Tabelle (mit `navigation_mode` Spalte pro Mode)
- **Migration 042 TS:** Erstellt globale UI Settings Tabelle (mit `default_navigation_mode` für User)
- **Beide verwenden denselben Tabellennamen:** `user_navigation_mode_settings`
- **Tatsächliche DB:** Migration 042 wurde ausgeführt → Service-Code erwartet Migration 034 Schema

### **Lösung: Option B - Migration 046**

**Strategie:**
1. **Umbenennen** der existierenden Tabelle: `user_navigation_mode_settings` → `user_navigation_ui_settings`
2. **Erstellen** der Per-Mode Settings Tabelle mit ursprünglichem Namen (Migration 034 nachholen)
3. **Beide Tabellen** bleiben erhalten für unterschiedliche Zwecke

**Ergebnis:**
- ✅ `user_navigation_mode_settings` = Per-Mode Layout Configuration (header_height **PRO MODE**)
- ✅ `user_navigation_ui_settings` = Globale UI/Footer Settings (Transitions, Footer-Toggles)
- ✅ Service-Code funktioniert (erwartet Per-Mode Schema)
- ✅ Keine Datenverluste (Alte Settings in umbenannter Tabelle)
- ✅ Vollständige Migration 034 Funktionalität nachgeholt

**Aufwand:** ~85 Minuten (inkl. Testing & Documentation)

**Nächster Schritt:** Phase 0 Backup erstellen → Phase 1 Migration 046 implementieren

---

## 🎯 **KERNPROBLEM - Root Cause Analysis**

### **SqliteError: table user_navigation_mode_settings has no column named header_height**

**Root Cause:** Service-Code referenziert **FALSCHE Tabelle** für Layout-Präferenzen.

**Zwei-Tabellen-Architektur (by Design):**
| **Tabelle** | **Zweck** | **Felder** | **Service-Usage** |
|:--|:--|:--|:--|
| `user_navigation_preferences` | **Layout/Dimensionen** | ✅ `header_height`, `sidebar_width`, `auto_collapse`, `remember_focus_mode` | ⚠️ SOLLTE verwendet werden |
| `user_navigation_mode_settings` | **UI/Verhalten/Footer** | ✅ `default_navigation_mode`, `show_footer`, `footer_show_*`, etc. | ❌ AKTUELL fälschlich verwendet |

**Fehlerhafte Code-Stelle:**
```typescript
// src/services/DatabaseNavigationService.ts:217-233
this.statements.upsertUserPreferences = this.db.prepare(`
  INSERT OR REPLACE INTO user_navigation_mode_settings  // ❌ FALSCHE TABELLE
  (user_id, default_navigation_mode, header_height, sidebar_width, ...)  // ❌ Felder existieren nicht
```

**Korrekte Tabelle laut Schema:**
```sql
-- user_navigation_preferences HAS:
header_height INTEGER DEFAULT 72
sidebar_width INTEGER DEFAULT 280
auto_collapse BOOLEAN DEFAULT FALSE
remember_focus_mode BOOLEAN DEFAULT TRUE

-- user_navigation_mode_settings HAS NOT:
-- ❌ header_height (nicht vorhanden!)
-- ❌ sidebar_width (nicht vorhanden!)
-- ❌ auto_collapse (nicht vorhanden!)
```

---

## 📋 **LÖSUNGSPLAN - Service-Layer Table Reference Fix**

### **Option 1: Service-Layer Fix (EMPFOHLEN - Minimal Invasive)**

**Ansatz:** Ändere Tabellenreferenzen in `DatabaseNavigationService.prepareStatements()` von `user_navigation_mode_settings` → `user_navigation_preferences`.

**Vorteile:**
- ✅ Keine Datenbank-Migration erforderlich
- ✅ Minimale Code-Änderungen (nur SQL-Statements)
- ✅ Vollständig abwärtskompatibel
- ✅ Beide Tabellen behalten ihre Aufgaben (by Design)
- ✅ Sofortige Fehlerbeseitigung

**Code-Änderungen (3 Stellen in prepareStatements()):**

#### **Änderung 1: getUserPreferences (Zeile 212-214)**
```typescript
// ❌ VORHER (FALSCH):
this.statements.getUserPreferences = this.db.prepare(`
  SELECT * FROM user_navigation_mode_settings WHERE user_id = ?
`);

// ✅ NACHHER (KORREKT):
this.statements.getUserPreferences = this.db.prepare(`
  SELECT * FROM user_navigation_preferences WHERE user_id = ?
`);
```

#### **Änderung 2: upsertUserPreferences (Zeile 217-222)**
```typescript
// ❌ VORHER (FALSCH):
this.statements.upsertUserPreferences = this.db.prepare(`
  INSERT OR REPLACE INTO user_navigation_mode_settings 
  (user_id, default_navigation_mode, header_height, sidebar_width, auto_collapse, remember_focus_mode, created_at, updated_at)
  VALUES (?, ?, ?, ?, ?, ?, 
    COALESCE((SELECT created_at FROM user_navigation_mode_settings WHERE user_id = ?), CURRENT_TIMESTAMP), 
    CURRENT_TIMESTAMP)
`);

// ✅ NACHHER (KORREKT):
this.statements.upsertUserPreferences = this.db.prepare(`
  INSERT OR REPLACE INTO user_navigation_preferences 
  (user_id, navigation_mode, header_height, sidebar_width, auto_collapse, remember_focus_mode, created_at, updated_at)
  VALUES (?, ?, ?, ?, ?, ?, 
    COALESCE((SELECT created_at FROM user_navigation_preferences WHERE user_id = ?), CURRENT_TIMESTAMP), 
    CURRENT_TIMESTAMP)
`);
```

**⚠️ HINWEIS:** Spaltenname `default_navigation_mode` → `navigation_mode` (laut Schema user_navigation_preferences)

#### **Änderung 3: updateNavigationMode (Zeile 225-228)**
```typescript
// ❌ VORHER (FALSCH):
this.statements.updateNavigationMode = this.db.prepare(`
  UPDATE user_navigation_mode_settings 
  SET default_navigation_mode = ?, updated_at = CURRENT_TIMESTAMP 
  WHERE user_id = ?
`);

// ✅ NACHHER (KORREKT):
this.statements.updateNavigationMode = this.db.prepare(`
  UPDATE user_navigation_preferences 
  SET navigation_mode = ?, updated_at = CURRENT_TIMESTAMP 
  WHERE user_id = ?
`);
```

#### **Änderung 4: updateLayoutDimensions (Zeile 231-234)**
```typescript
// ❌ VORHER (FALSCH):
this.statements.updateLayoutDimensions = this.db.prepare(`
  UPDATE user_navigation_mode_settings 
  SET header_height = ?, sidebar_width = ?, updated_at = CURRENT_TIMESTAMP 
  WHERE user_id = ?
`);

// ✅ NACHHER (KORREKT):
this.statements.updateLayoutDimensions = this.db.prepare(`
  UPDATE user_navigation_preferences 
  SET header_height = ?, sidebar_width = ?, updated_at = CURRENT_TIMESTAMP 
  WHERE user_id = ?
`);
```

**Validation nach Fix:**
```bash
pnpm build  # TypeScript-Validierung
pnpm dev:all  # Funktionstest
```

---

### **Option 2: Migration 046 - Per-Mode Settings Table (EMPFOHLEN nach tieferer Analyse)**

**NEUE ERKENNTNIS (26.10.2025):**
- Migration 034 SQL-File existiert und definiert **Per-Mode-Settings-Tabelle**
- Migration 042 hat eine **ANDERE** `user_navigation_mode_settings` Tabelle erstellt (globale Settings)
- **KONFLIKT:** Gleicher Tabellenname, unterschiedliche Schemas
- **Service-Code erwartet:** Per-Mode-Settings (Migration 034 Schema)
- **DB enthält:** Globale Settings (Migration 042 Schema)

**Analyseergebnisse:**

| **Quelle** | **Tabelle** | **Key Column** | **Zweck** |
|:--|:--|:--|:--|
| **Migration 034 SQL** | `user_navigation_mode_settings` | `navigation_mode` | Per-Mode Layout (header_height, sidebar_width **PRO MODE**) |
| **Migration 042 TS** | `user_navigation_mode_settings` | `default_navigation_mode` | Globale UI Settings (Footer, Transitions, Mode-Switching) |
| **Aktuelle DB** | `user_navigation_mode_settings` | `default_navigation_mode` | ✅ Migration 042 implementiert |
| **Service-Code** | `user_navigation_mode_settings` | `navigation_mode` | ❌ Erwartet Migration 034 |

**Ansatz:** Migration 046 erstellen mit folgender Strategie:

#### **Phase 1: Tabellen-Rename (Konfliktauflösung)**
```sql
-- 1. Umbenennen der existierenden Tabelle (Migration 042)
ALTER TABLE user_navigation_mode_settings 
RENAME TO user_navigation_ui_settings;

-- 2. Indexes und Triggers aktualisieren
DROP INDEX idx_user_navigation_mode_settings_user_id;
CREATE INDEX idx_user_navigation_ui_settings_user_id 
ON user_navigation_ui_settings(user_id);

DROP TRIGGER update_user_navigation_mode_settings_updated_at;
CREATE TRIGGER update_user_navigation_ui_settings_updated_at
AFTER UPDATE ON user_navigation_ui_settings
FOR EACH ROW
BEGIN
  UPDATE user_navigation_ui_settings 
  SET updated_at = datetime('now') 
  WHERE id = NEW.id;
END;
```

#### **Phase 2: Per-Mode-Settings-Tabelle erstellen (Migration 034 nachholen)**
```sql
-- Exakt aus migrations/034-navigation-mode-settings.sql
CREATE TABLE IF NOT EXISTS user_navigation_mode_settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  navigation_mode TEXT NOT NULL CHECK (navigation_mode IN (
    'mode-dashboard-view', 'mode-data-panel', 'mode-compact-focus'
  )),
  
  -- Mode-specific Layout Configuration
  header_height INTEGER NOT NULL DEFAULT 160 
    CHECK (header_height >= 60 AND header_height <= 220),
  sidebar_width INTEGER NOT NULL DEFAULT 280 
    CHECK (sidebar_width >= 180 AND sidebar_width <= 320),
  
  -- Mode-specific Behavior Settings
  auto_collapse_mobile BOOLEAN NOT NULL DEFAULT 0,
  auto_collapse_tablet BOOLEAN NOT NULL DEFAULT 0,
  remember_dimensions BOOLEAN NOT NULL DEFAULT 1,
  
  -- Responsive Design Configuration
  mobile_breakpoint INTEGER NOT NULL DEFAULT 768 
    CHECK (mobile_breakpoint >= 480 AND mobile_breakpoint <= 1024),
  tablet_breakpoint INTEGER NOT NULL DEFAULT 1024 
    CHECK (tablet_breakpoint >= 768 AND tablet_breakpoint <= 1440),
  
  -- CSS Grid Template Overrides (JSON format)
  grid_template_columns TEXT NULL,
  grid_template_rows TEXT NULL,
  grid_template_areas TEXT NULL,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Constraints
  UNIQUE(user_id, navigation_mode),
  FOREIGN KEY (user_id) 
    REFERENCES user_navigation_preferences(user_id) 
    ON DELETE CASCADE
);

-- Indexes
CREATE INDEX idx_navigation_mode_settings_user_mode 
ON user_navigation_mode_settings(user_id, navigation_mode);

CREATE INDEX idx_navigation_mode_settings_mode 
ON user_navigation_mode_settings(navigation_mode);

-- Trigger
CREATE TRIGGER trigger_navigation_mode_settings_updated_at 
AFTER UPDATE ON user_navigation_mode_settings
FOR EACH ROW
BEGIN
  UPDATE user_navigation_mode_settings 
  SET updated_at = CURRENT_TIMESTAMP 
  WHERE id = NEW.id;
END;
```

#### **Phase 3: Default-Daten einfügen**
```sql
-- Default settings für alle Modi (KI-safe)
INSERT OR IGNORE INTO user_navigation_mode_settings 
(user_id, navigation_mode, header_height, sidebar_width, 
 auto_collapse_mobile, auto_collapse_tablet, remember_dimensions, 
 mobile_breakpoint, tablet_breakpoint)
VALUES 
('default', 'mode-dashboard-view', 160, 280, 0, 0, 1, 768, 1024),
('default', 'mode-data-panel', 160, 280, 0, 0, 1, 768, 1024),
('default', 'mode-compact-focus', 72, 240, 1, 1, 1, 768, 1024);

-- Für alle existierenden User
INSERT OR IGNORE INTO user_navigation_mode_settings 
(user_id, navigation_mode, header_height, sidebar_width, 
 auto_collapse_mobile, auto_collapse_tablet, remember_dimensions, 
 mobile_breakpoint, tablet_breakpoint)
SELECT 
  unp.user_id,
  modes.mode,
  CASE modes.mode 
    WHEN 'mode-dashboard-view' THEN 160
    WHEN 'mode-data-panel' THEN 160
    WHEN 'mode-compact-focus' THEN 72
  END as header_height,
  CASE modes.mode 
    WHEN 'mode-dashboard-view' THEN 280
    WHEN 'mode-data-panel' THEN 280
    WHEN 'mode-compact-focus' THEN 240
  END as sidebar_width,
  CASE modes.mode 
    WHEN 'mode-dashboard-view' THEN 0
    WHEN 'mode-data-panel' THEN 0
    WHEN 'mode-compact-focus' THEN 1
  END as auto_collapse_mobile,
  CASE modes.mode 
    WHEN 'mode-dashboard-view' THEN 0
    WHEN 'mode-data-panel' THEN 0
    WHEN 'mode-compact-focus' THEN 1
  END as auto_collapse_tablet,
  1 as remember_dimensions,
  768 as mobile_breakpoint,
  1024 as tablet_breakpoint
FROM user_navigation_preferences unp
CROSS JOIN (
  SELECT 'mode-dashboard-view' as mode
  UNION SELECT 'mode-data-panel' as mode
  UNION SELECT 'mode-compact-focus' as mode
) modes;
```

#### **Phase 4: Service-Layer Update (optional)**
```typescript
// Optional: Service-Methoden für UI-Settings anpassen
// Falls UI-Settings weiterhin benötigt werden:
this.statements.getUISettings = this.db.prepare(`
  SELECT * FROM user_navigation_ui_settings WHERE user_id = ?
`);
```

**Vorteile dieser Lösung:**
- ✅ **Korrekte Architektur:** Zwei separate Tabellen für verschiedene Zwecke
  - `user_navigation_mode_settings` = Per-Mode Layout (wie vom Service erwartet)
  - `user_navigation_ui_settings` = Globale UI/Footer Settings
- ✅ **Backward Compatible:** Alte Daten bleiben in umbenannter Tabelle erhalten
- ✅ **Service-Code funktioniert:** Per-Mode-Settings wie erwartet verfügbar
- ✅ **Vollständige Migration 034:** Nachholen der ursprünglich geplanten Funktionalität
- ✅ **Keine Datenverluste:** Alle existierenden Settings bleiben nutzbar

**Risiken & Mitigation:**
- ⚠️ **Rename Operation:** SQLite ALTER TABLE RENAME ist atomar und sicher
- ⚠️ **Foreign Key Constraints:** Werden automatisch aktualisiert
- ⚠️ **Backup MANDATORY:** Pre-migration Backup erforderlich

**Aufwand:**
- Migration 046 erstellen: **30 Minuten**
- Testing & Validation: **20 Minuten**
- **GESAMT:** ~50 Minuten

---

## 🔧 **GRID-ARCHITEKTUR UPDATE (Sekundäres Problem)**

### **Problem:** Service-Layer generiert 2-Zeilen-Grid, Dokumentation + CSS zeigen 3-Zeilen-Grid mit Footer

**Aktueller Stand:**
| **Source** | **Grid Template Rows** | **Grid Template Areas** | **Footer?** |
|:--|:--|:--|:--|
| **MASTER-Doku** | 3 Zeilen (160px/160px/72px header) | `"sidebar header" "sidebar focus-bar" "sidebar main"` | ⚠️ Header, kein Footer |
| **CSS (layout-grid.css)** | `160px 1fr 60px` (3 Zeilen) | `"sidebar header" "sidebar main" "sidebar footer"` | ✅ **JA** (60px) |
| **Service (SYSTEM_DEFAULTS)** | `40px 1fr` (2 Zeilen) | `"sidebar focus-bar" "sidebar main"` | ❌ **NEIN** |

**Empfohlenes Ziel-Grid:** CSS-Implementierung als autoritativ → **3-Zeilen-Grid mit Footer**

**Code-Änderungen in SYSTEM_DEFAULTS (DatabaseNavigationService.ts:134-155):**

```typescript
// ❌ VORHER (2-Zeilen-Grid):
GRID_TEMPLATE_ROWS: {
  'mode-dashboard-view': '40px 1fr',
  'mode-data-panel': '40px 1fr',
  'mode-compact-focus': '40px 1fr'
},

GRID_TEMPLATE_AREAS: {
  'mode-dashboard-view': '"sidebar focus-bar" "sidebar main"',
  'mode-data-panel': '"sidebar focus-bar" "sidebar main"',
  'mode-compact-focus': '"sidebar focus-bar" "sidebar main"'
},

// ✅ NACHHER (3-Zeilen-Grid mit Footer):
GRID_TEMPLATE_ROWS: {
  'mode-dashboard-view': '160px 1fr 60px',  // Header + Main + Footer
  'mode-data-panel': '160px 1fr 60px',      // Header + Main + Footer
  'mode-compact-focus': '72px 1fr 60px'     // Compact Header + Main + Footer
},

GRID_TEMPLATE_AREAS: {
  'mode-dashboard-view': '"sidebar header" "sidebar main" "sidebar footer"',
  'mode-data-panel': '"sidebar header" "sidebar main" "sidebar footer"',
  'mode-compact-focus': '"sidebar header" "sidebar main" "sidebar footer"'
},
```

**Backward Compatibility:** CSS-Fallbacks bleiben bestehen (keine Breaking Changes).

---

## ✅ **IMPLEMENTIERUNGS-CHECKLISTE**

### **⚠️ STRATEGIE-ENTSCHEIDUNG**

**Zwei Optionen verfügbar:**
- **Option A (schnell):** Service-Layer Table Reference Fix - 15 Minuten
- **Option B (korrekt):** Migration 046 - Per-Mode Settings nachholen - 50 Minuten

**EMPFEHLUNG:** **Option B** wurde vom User gewählt

---

### **Phase 0: Pre-Migration Vorbereitung (KRITISCH - MANDATORY)**

- [ ] **Backup der Produktions-DB erstellen**
  ```bash
  $timestamp = Get-Date -Format "yyyy-MM-dd-HHmmss"
  Copy-Item "$env:APPDATA\Electron\database\rawalite.db" `
    -Destination "$env:APPDATA\Electron\database\backups\pre-migration-046-$timestamp.db"
  ```
- [ ] **Aktuelle Schema-Version verifizieren**
  ```bash
  sqlite3 "$env:APPDATA\Electron\database\rawalite.db" "PRAGMA user_version;"
  # Erwartet: 46
  ```
- [ ] **Existierende Tabellen-Struktur dokumentieren**
  ```bash
  sqlite3 "$env:APPDATA\Electron\database\rawalite.db" `
    "SELECT sql FROM sqlite_master WHERE name='user_navigation_mode_settings';" `
    > schema-backup-046.sql
  ```
- [ ] **Alle laufenden Electron/Node Prozesse stoppen**
  ```bash
  taskkill /F /IM node.exe ; taskkill /F /IM electron.exe
  ```

---

### **Phase 1: Migration 046 erstellen (OPTION B)**

- [ ] **Migrations-Datei erstellen:** `src/main/db/migrations/046_add_per_mode_navigation_settings.ts`
  ```typescript
  /**
   * Migration 046: Per-Mode Navigation Settings
   * 
   * Resolves table name conflict between Migration 034 and Migration 042:
   * - Renames existing user_navigation_mode_settings → user_navigation_ui_settings
   * - Creates new Per-Mode Settings table (originally planned in Migration 034)
   * 
   * Tables Modified:
   * - user_navigation_mode_settings (RENAMED to user_navigation_ui_settings)
   * 
   * Tables Created:
   * - user_navigation_mode_settings (Per-Mode Layout Configuration)
   * 
   * @since v1.0.63+
   * @date 2025-10-26
   */

  import type Database from 'better-sqlite3';

  export function up(db: Database.Database): void {
    console.log('[Migration 046] Resolving table name conflict...');
    
    try {
      // Phase 1: Rename existing table (Migration 042)
      console.log('[Migration 046] Phase 1: Renaming user_navigation_mode_settings → user_navigation_ui_settings');
      
      db.exec(`ALTER TABLE user_navigation_mode_settings RENAME TO user_navigation_ui_settings;`);
      
      // Update indexes
      db.exec(`DROP INDEX IF EXISTS idx_user_navigation_mode_settings_user_id;`);
      db.exec(`CREATE INDEX idx_user_navigation_ui_settings_user_id ON user_navigation_ui_settings(user_id);`);
      
      // Update trigger
      db.exec(`DROP TRIGGER IF EXISTS update_user_navigation_mode_settings_updated_at;`);
      db.exec(`
        CREATE TRIGGER update_user_navigation_ui_settings_updated_at
        AFTER UPDATE ON user_navigation_ui_settings
        FOR EACH ROW
        BEGIN
          UPDATE user_navigation_ui_settings 
          SET updated_at = datetime('now') 
          WHERE id = NEW.id;
        END;
      `);
      
      console.log('[Migration 046] Phase 1 ✅ Table renamed successfully');
      
      // Phase 2: Create Per-Mode Settings Table (Migration 034 catch-up)
      console.log('[Migration 046] Phase 2: Creating Per-Mode Settings table');
      
      db.exec(`
        CREATE TABLE IF NOT EXISTS user_navigation_mode_settings (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id TEXT NOT NULL,
          navigation_mode TEXT NOT NULL CHECK (navigation_mode IN (
            'mode-dashboard-view', 'mode-data-panel', 'mode-compact-focus'
          )),
          
          -- Mode-specific Layout Configuration
          header_height INTEGER NOT NULL DEFAULT 160 
            CHECK (header_height >= 60 AND header_height <= 220),
          sidebar_width INTEGER NOT NULL DEFAULT 280 
            CHECK (sidebar_width >= 180 AND sidebar_width <= 320),
          
          -- Mode-specific Behavior Settings
          auto_collapse_mobile BOOLEAN NOT NULL DEFAULT 0,
          auto_collapse_tablet BOOLEAN NOT NULL DEFAULT 0,
          remember_dimensions BOOLEAN NOT NULL DEFAULT 1,
          
          -- Responsive Design Configuration
          mobile_breakpoint INTEGER NOT NULL DEFAULT 768 
            CHECK (mobile_breakpoint >= 480 AND mobile_breakpoint <= 1024),
          tablet_breakpoint INTEGER NOT NULL DEFAULT 1024 
            CHECK (tablet_breakpoint >= 768 AND tablet_breakpoint <= 1440),
          
          -- CSS Grid Template Overrides (JSON format)
          grid_template_columns TEXT NULL,
          grid_template_rows TEXT NULL,
          grid_template_areas TEXT NULL,
          
          -- Metadata
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          
          -- Constraints
          UNIQUE(user_id, navigation_mode),
          FOREIGN KEY (user_id) 
            REFERENCES user_navigation_preferences(user_id) 
            ON DELETE CASCADE
        );
      `);
      
      // Create indexes
      db.exec(`
        CREATE INDEX IF NOT EXISTS idx_navigation_mode_settings_user_mode 
        ON user_navigation_mode_settings(user_id, navigation_mode);
      `);
      
      db.exec(`
        CREATE INDEX IF NOT EXISTS idx_navigation_mode_settings_mode 
        ON user_navigation_mode_settings(navigation_mode);
      `);
      
      // Create trigger
      db.exec(`
        CREATE TRIGGER IF NOT EXISTS trigger_navigation_mode_settings_updated_at 
        AFTER UPDATE ON user_navigation_mode_settings
        FOR EACH ROW
        BEGIN
          UPDATE user_navigation_mode_settings 
          SET updated_at = CURRENT_TIMESTAMP 
          WHERE id = NEW.id;
        END;
      `);
      
      console.log('[Migration 046] Phase 2 ✅ Per-Mode Settings table created');
      
      // Phase 3: Insert default data
      console.log('[Migration 046] Phase 3: Inserting default per-mode settings');
      
      // Default settings for all modes
      db.exec(`
        INSERT OR IGNORE INTO user_navigation_mode_settings 
        (user_id, navigation_mode, header_height, sidebar_width, 
         auto_collapse_mobile, auto_collapse_tablet, remember_dimensions, 
         mobile_breakpoint, tablet_breakpoint)
        VALUES 
        ('default', 'mode-dashboard-view', 160, 280, 0, 0, 1, 768, 1024),
        ('default', 'mode-data-panel', 160, 280, 0, 0, 1, 768, 1024),
        ('default', 'mode-compact-focus', 72, 240, 1, 1, 1, 768, 1024);
      `);
      
      // For all existing users
      db.exec(`
        INSERT OR IGNORE INTO user_navigation_mode_settings 
        (user_id, navigation_mode, header_height, sidebar_width, 
         auto_collapse_mobile, auto_collapse_tablet, remember_dimensions, 
         mobile_breakpoint, tablet_breakpoint)
        SELECT 
          unp.user_id,
          modes.mode,
          CASE modes.mode 
            WHEN 'mode-dashboard-view' THEN 160
            WHEN 'mode-data-panel' THEN 160
            WHEN 'mode-compact-focus' THEN 72
          END as header_height,
          CASE modes.mode 
            WHEN 'mode-dashboard-view' THEN 280
            WHEN 'mode-data-panel' THEN 280
            WHEN 'mode-compact-focus' THEN 240
          END as sidebar_width,
          CASE modes.mode 
            WHEN 'mode-dashboard-view' THEN 0
            WHEN 'mode-data-panel' THEN 0
            WHEN 'mode-compact-focus' THEN 1
          END as auto_collapse_mobile,
          CASE modes.mode 
            WHEN 'mode-dashboard-view' THEN 0
            WHEN 'mode-data-panel' THEN 0
            WHEN 'mode-compact-focus' THEN 1
          END as auto_collapse_tablet,
          1 as remember_dimensions,
          768 as mobile_breakpoint,
          1024 as tablet_breakpoint
        FROM user_navigation_preferences unp
        CROSS JOIN (
          SELECT 'mode-dashboard-view' as mode
          UNION SELECT 'mode-data-panel' as mode
          UNION SELECT 'mode-compact-focus' as mode
        ) modes;
      `);
      
      console.log('[Migration 046] Phase 3 ✅ Default data inserted');
      
      // Validation
      const modeSettingsCount = db.prepare('SELECT COUNT(*) as cnt FROM user_navigation_mode_settings').get() as { cnt: number };
      const uiSettingsCount = db.prepare('SELECT COUNT(*) as cnt FROM user_navigation_ui_settings').get() as { cnt: number };
      
      console.log(`[Migration 046] ✅ Validation:`);
      console.log(`  - Per-Mode Settings: ${modeSettingsCount.cnt} rows`);
      console.log(`  - UI Settings: ${uiSettingsCount.cnt} rows`);
      
      console.log('[Migration 046] ✅ Migration completed successfully');
      
    } catch (error) {
      console.error('[Migration 046] ❌ Migration failed:', error);
      throw error;
    }
  }

  export function down(db: Database.Database): void {
    console.log('[Migration 046] Rolling back per-mode navigation settings...');
    
    try {
      // Drop Per-Mode Settings table
      db.exec('DROP TRIGGER IF EXISTS trigger_navigation_mode_settings_updated_at;');
      db.exec('DROP INDEX IF EXISTS idx_navigation_mode_settings_user_mode;');
      db.exec('DROP INDEX IF EXISTS idx_navigation_mode_settings_mode;');
      db.exec('DROP TABLE IF EXISTS user_navigation_mode_settings;');
      
      // Restore original table name
      db.exec('ALTER TABLE user_navigation_ui_settings RENAME TO user_navigation_mode_settings;');
      
      // Restore original indexes
      db.exec('DROP INDEX IF EXISTS idx_user_navigation_ui_settings_user_id;');
      db.exec('CREATE INDEX idx_user_navigation_mode_settings_user_id ON user_navigation_mode_settings(user_id);');
      
      // Restore original trigger
      db.exec('DROP TRIGGER IF EXISTS update_user_navigation_ui_settings_updated_at;');
      db.exec(`
        CREATE TRIGGER update_user_navigation_mode_settings_updated_at
        AFTER UPDATE ON user_navigation_mode_settings
        FOR EACH ROW
        BEGIN
          UPDATE user_navigation_mode_settings 
          SET updated_at = datetime('now') 
          WHERE id = NEW.id;
        END;
      `);
      
      console.log('[Migration 046] ✅ Rollback completed');
      
    } catch (error) {
      console.error('[Migration 046] ❌ Rollback failed:', error);
      throw error;
    }
  }
  ```

- [ ] **Migration in Index registrieren:** `src/main/db/migrations/index.ts`
  ```typescript
  // Add import (nach migration045)
  import * as migration046 from './046_add_per_mode_navigation_settings';
  
  // Add to migrations array (als letztes)
  {
    version: 47,
    name: '046_add_per_mode_navigation_settings',
    up: migration046.up,
    down: migration046.down
  }
  ```

---

### **Phase 2: Service-Layer Update (OPTION B - optional)**

- [ ] **Optional: UI-Settings Service-Methoden hinzufügen**
  ```typescript
  // src/services/DatabaseNavigationService.ts
  // Falls user_navigation_ui_settings weiterhin genutzt werden soll:
  
  this.statements.getUISettings = this.db.prepare(`
    SELECT * FROM user_navigation_ui_settings WHERE user_id = ?
  `);
  
  this.statements.updateFooterSettings = this.db.prepare(`
    UPDATE user_navigation_ui_settings 
    SET show_footer = ?, footer_show_mode_info = ?, 
        footer_show_theme_info = ?, footer_show_version = ?,
        updated_at = datetime('now')
    WHERE user_id = ?
  `);
  ```

- [ ] **Validation:** TypeScript-Kompilierung
  ```bash
  pnpm build
  ```

---

### **Phase 3: Testing & Validation (OPTION B)**

- [ ] **Test 1: Migration ausführen**
  ```bash
  pnpm dev:all
  # Erwartung: Migration 046 läuft automatisch durch
  # Log: "[Migration 046] ✅ Migration completed successfully"
  ```

- [ ] **Test 2: Schema-Version prüfen**
  ```bash
  sqlite3 "$env:APPDATA\Electron\database\rawalite.db" "PRAGMA user_version;"
  # Erwartet: 47
  ```

- [ ] **Test 3: Beide Tabellen existieren**
  ```bash
  sqlite3 "$env:APPDATA\Electron\database\rawalite.db" `
    "SELECT name FROM sqlite_master WHERE type='table' AND name LIKE '%navigation%';"
  # Erwartet:
  # - user_navigation_preferences
  # - user_navigation_mode_settings (Per-Mode Layout)
  # - user_navigation_ui_settings (globale UI Settings)
  # - navigation_mode_history
  ```

- [ ] **Test 4: Per-Mode Settings haben Daten**
  ```bash
  sqlite3 "$env:APPDATA\Electron\database\rawalite.db" `
    "SELECT COUNT(*) FROM user_navigation_mode_settings;"
  # Erwartet: Mindestens 3 (default user, 3 modes)
  ```

- [ ] **Test 5: Application startet ohne SqliteError**
  ```bash
  pnpm dev:all
  # Erwartung: Kein SqliteError mehr
  ```

- [ ] **Test 6: Navigation Mode wechseln funktioniert**
  - Dashboard View → Data Panel → Compact Focus
  - Sidebar Width Anpassung (Persistenz prüfen)
  - Per-Mode Settings werden geladen

- [ ] **Test 7: Footer UI Settings bleiben erhalten**
  - Footer wird angezeigt
  - Footer-Toggles funktionieren
  - user_navigation_ui_settings Tabelle ist nutzbar

---

### **Phase 4: Documentation Update (OPTION B)**

- [ ] **Migration-Report:** Status WIP → COMPLETED
- [ ] **CRITICAL-FIXES:** Migration 046 als FIX-020 registrieren
- [ ] **LESSONS-LEARNED:** Table-Name-Conflict dokumentieren
  - Migration 034 vs Migration 042 Konflikt
  - Lösung durch Rename + Nachholen
  - Best Practice: Migration-Tests vor Merge

---

### **Phase 5: Rollback-Plan (OPTION B - Nur im Notfall)**

- [ ] **Bei Fehlern: Migration 046 rückgängig machen**
  ```typescript
  // Manueller Rollback (falls nötig):
  const db = getDb();
  const migration046 = require('./046_add_per_mode_navigation_settings');
  migration046.down(db);
  setUserVersion(46); // Zurück auf alte Version
  ```

- [ ] **Backup wiederherstellen**
  ```bash
  Copy-Item "$env:APPDATA\Electron\database\backups\pre-migration-046-*.db" `
    -Destination "$env:APPDATA\Electron\database\rawalite.db" -Force
  ```

---

## 📊 **TECHNISCHE DETAILS**

### **Datenbank-Schema (Validiert - Schema Version 46)**

#### **user_navigation_preferences (Layout/Dimensionen)**
```sql
CREATE TABLE user_navigation_preferences (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  navigation_mode TEXT NOT NULL DEFAULT 'mode-dashboard-view',
  header_height INTEGER DEFAULT 72,           -- ✅ Vorhanden
  sidebar_width INTEGER DEFAULT 280,          -- ✅ Vorhanden
  auto_collapse BOOLEAN DEFAULT FALSE,        -- ✅ Vorhanden
  remember_focus_mode BOOLEAN DEFAULT TRUE,   -- ✅ Vorhanden
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### **user_navigation_mode_settings (UI/Verhalten/Footer)**
```sql
CREATE TABLE user_navigation_mode_settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL DEFAULT 'default',
  default_navigation_mode TEXT NOT NULL DEFAULT 'mode-dashboard-view'
    CHECK (default_navigation_mode IN ('mode-dashboard-view', 'mode-data-panel', 'mode-compact-focus')),
  allow_mode_switching BOOLEAN NOT NULL DEFAULT 1,
  remember_last_mode BOOLEAN NOT NULL DEFAULT 1,
  show_mode_indicator BOOLEAN NOT NULL DEFAULT 1,
  auto_hide_sidebar_in_focus BOOLEAN NOT NULL DEFAULT 1,
  persist_sidebar_width BOOLEAN NOT NULL DEFAULT 1,
  show_footer BOOLEAN NOT NULL DEFAULT 1,             -- ✅ Footer Control
  footer_show_mode_info BOOLEAN NOT NULL DEFAULT 1,
  footer_show_theme_info BOOLEAN NOT NULL DEFAULT 1,
  footer_show_version BOOLEAN NOT NULL DEFAULT 1,
  footer_show_focus_controls BOOLEAN NOT NULL DEFAULT 1,
  enable_mode_transitions BOOLEAN NOT NULL DEFAULT 1,
  transition_duration_ms INTEGER NOT NULL DEFAULT 300
    CHECK (transition_duration_ms >= 100 AND transition_duration_ms <= 1000),
  legacy_mode_mapping TEXT DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(user_id)
);
```

### **Service Layer Architecture (Nach Fix)**

```typescript
// ✅ KORREKTE Tabellenzuordnung:
getUserPreferences()        → SELECT FROM user_navigation_preferences
upsertUserPreferences()     → INSERT INTO user_navigation_preferences
updateNavigationMode()      → UPDATE user_navigation_preferences
updateLayoutDimensions()    → UPDATE user_navigation_preferences

// Für Footer/UI-Settings (separater Service oder separate Methoden):
getNavigationModeSettings() → SELECT FROM user_navigation_mode_settings
updateFooterSettings()      → UPDATE user_navigation_mode_settings
```

---

## 🚨 **KRITISCHE HINWEISE**

### **1. Zwei-Tabellen-Architektur ist BY DESIGN**
- **NICHT zusammenführen!** Separation of Concerns gewollt
- `user_navigation_preferences` = User-spezifische Layout-Dimensionen
- `user_navigation_mode_settings` = Globale UI-Einstellungen + Footer-Kontrolle

### **2. Field-Mapper Usage (MANDATORY)**
- **IMMER** `convertSQLQuery()` verwenden für dynamische SQL-Queries
- **PREPARED STATEMENTS:** Verwenden snake_case direkt (better-sqlite3 Kompatibilität)
- **DATA TRANSFORMATION:** `mapFromSQL()` / `mapToSQL()` bei Daten-Konvertierung (bereits implementiert)
- **EXISTING PATTERN:** DatabaseNavigationService verwendet Field-Mapper in Zeile 304, 381 (getUserNavigationPreferences, setUserNavigationPreferences)
- Siehe: [ROOT_VALIDATED_REGISTRY-CRITICAL-FIXES_2025-10-17.md](ROOT_VALIDATED_REGISTRY-CRITICAL-FIXES_2025-10-17.md) FIX-010

**⚠️ WICHTIG:** Prepared Statements in `prepareStatements()` verwenden hardcoded snake_case (by design für better-sqlite3).  
Field-Mapper wird bei **Daten-Transformation** verwendet, nicht bei Statement-Erstellung.

### **3. Backward Compatibility MANDATORY**
- CSS-Fallbacks müssen bestehen bleiben
- Alte Navigation-Modes (`header-statistics`, etc.) sind deprecated aber konvertiert
- Migration 043 hat bereits Legacy-zu-KI-safe Konvertierung durchgeführt

### **4. Validation Commands**
```bash
# VOR jeder Code-Änderung:
pnpm validate:critical-fixes

# VOR Application-Start:
taskkill /F /IM node.exe 2>&1 ; taskkill /F /IM electron.exe 2>&1

# Build + Test:
pnpm build
pnpm dev:all

# NACH Code-Änderungen (Field-Mapper Compliance):
# Prüfe: mapFromSQL/mapToSQL werden in getUserNavigationPreferences/setUserNavigationPreferences verwendet
# Prüfe: Prepared Statements verwenden snake_case direkt (by design für better-sqlite3)
```

**Field-Mapper Pattern (bereits im Service implementiert):**
```typescript
// ✅ KORREKT: Data Transformation mit Field-Mapper (Zeile 304, 381)
const row = this.statements.getUserPreferences!.get(userId) as any;
return mapFromSQL(row) as NavigationPreferences; // ✅ Field-Mapper
```

---

## 🎯 **NÄCHSTE SCHRITTE (OPTION B - Migration 046)**

### **Implementierungs-Reihenfolge:**

1. **KRITISCH (Phase 0):** Pre-Migration Vorbereitung
   - Backup erstellen
   - Schema dokumentieren
   - Alle Prozesse stoppen

2. **IMPLEMENTATION (Phase 1):** Migration 046 erstellen
   - Migrations-Datei: `046_add_per_mode_navigation_settings.ts`
   - Index-Update: `migrations/index.ts`
   - TypeScript build

3. **OPTIONAL (Phase 2):** Service-Layer UI-Settings Update
   - Nur wenn user_navigation_ui_settings weiter genutzt wird

4. **MANDATORY (Phase 3):** Testing & Validation
   - Migration automatisch ausführen lassen
   - Beide Tabellen prüfen
   - Application-Funktionalität validieren

5. **EMPFOHLEN (Phase 4):** Documentation Update
   - Migration-Report
   - CRITICAL-FIXES Registry
   - LESSONS-LEARNED

**⏱️ Geschätzter Aufwand (Option B):**
- Phase 0 (Vorbereitung): **10 Minuten**
- Phase 1 (Migration erstellen): **30 Minuten**
- Phase 2 (Service-Update): **10 Minuten** (optional)
- Phase 3 (Testing): **20 Minuten**
- Phase 4 (Documentation): **15 Minuten**
- **GESAMT:** ~85 Minuten (mit optionalen Schritten)

---

## 📊 **VERGLEICH OPTION A vs OPTION B**

| **Kriterium** | **Option A (Service-Layer Fix)** | **Option B (Migration 046)** |
|:--|:--|:--|
| **Aufwand** | 15 Minuten | 85 Minuten |
| **Komplexität** | Niedrig (4 SQL-Statements) | Mittel (Migration + Testing) |
| **Architektur-Korrektheit** | ⚠️ Kompromiss (Per-Mode-Features fehlen) | ✅ Vollständig (Migration 034 nachgeholt) |
| **Backward Compatibility** | ✅ Voll erhalten | ✅ Voll erhalten (Rename statt Drop) |
| **Risiko** | Niedrig | Mittel (Datenbank-Migration) |
| **Per-Mode Settings verfügbar** | ❌ Nein (Service nutzt nur global) | ✅ Ja (vollständig implementiert) |
| **Footer UI Settings** | ✅ Bleiben erhalten | ✅ Bleiben erhalten (umbenannt) |
| **Zukunftssicherheit** | ⚠️ Per-Mode später nachrüsten | ✅ Vollständig für zukünftige Features |
| **Rollback möglich** | ✅ Einfach (Git revert) | ✅ Migration down() verfügbar |

**USER-ENTSCHEIDUNG:** **Option B gewählt** ✅

**Begründung für Option B:**
1. ✅ **Vollständige Implementierung:** Per-Mode Settings wie ursprünglich in Migration 034 geplant
2. ✅ **Klare Architektur:** Zwei separate Tabellen für verschiedene Zwecke
3. ✅ **Zukunftssicher:** Basis für erweiterte Per-Mode Features
4. ✅ **Lessons Learned:** Table-Name-Konflikt systematisch gelöst
5. ✅ **Dokumentiert:** Migration 034 vs 042 Konflikt klar dokumentiert

---

## 🚨 **KRITISCHE HINWEISE FÜR OPTION B**

### **1. Backup ist MANDATORY**
```bash
# IMMER VOR Migration ausführen:
$timestamp = Get-Date -Format "yyyy-MM-dd-HHmmss"
Copy-Item "$env:APPDATA\Electron\database\rawalite.db" `
  -Destination "$env:APPDATA\Electron\database\backups\pre-migration-046-$timestamp.db"
```

### **2. Table-Name-Konflikt Resolution**
- **ALTE** `user_navigation_mode_settings` wird zu `user_navigation_ui_settings`
- **NEUE** `user_navigation_mode_settings` wird mit Per-Mode Schema erstellt
- **KEIN Datenverlust:** Alte Daten bleiben in umbenannter Tabelle

### **3. Service-Code Kompatibilität**
- ✅ **Per-Mode Statements funktionieren:** Neue Tabelle hat erwartetes Schema
- ⚠️ **UI-Settings Access:** Falls benötigt, Service-Methoden erweitern
- ✅ **Backward Compatible:** Alte Navigation-Logik bleibt erhalten

### **4. Migration Testing MANDATORY**
```bash
# Nach Migration 046:
1. Schema Version = 47
2. user_navigation_mode_settings = Per-Mode Layout (navigation_mode Spalte)
3. user_navigation_ui_settings = Globale UI Settings (default_navigation_mode Spalte)
4. Beide Tabellen haben Daten
5. Application startet ohne SqliteError
```

### **5. Validation Commands (Option B)**
```bash
# PRE-Migration Checks:
pnpm validate:critical-fixes
sqlite3 "$env:APPDATA\Electron\database\rawalite.db" "PRAGMA integrity_check;"
sqlite3 "$env:APPDATA\Electron\database\rawalite.db" "PRAGMA user_version;" # Should be 46

# POST-Migration Checks:
sqlite3 "$env:APPDATA\Electron\database\rawalite.db" "PRAGMA user_version;" # Should be 47
sqlite3 "$env:APPDATA\Electron\database\rawalite.db" "SELECT COUNT(*) FROM user_navigation_mode_settings;"
sqlite3 "$env:APPDATA\Electron\database\rawalite.db" "SELECT COUNT(*) FROM user_navigation_ui_settings;"

# Application Test:
pnpm build
pnpm dev:all  # Kein SqliteError erwartet
```

---

**📍 Location:** `/docs/WIP_IMPL-NAVIGATION-MODE-MIGRATION-044_2025-10-26.md`  
**Purpose:** Detaillierter Implementierungsplan für Service-Layer Table Reference Fix  
**Status:** READY FOR IMPLEMENTATION - Wartet auf User-Approval

---

## 📋 **ALTE ÄNDERUNGEN (Bereits durchgeführt, Teil der Migration 044)**

#### 1. Navigation-Modi aktualisiert ✅
- **Alt:** `header-statistics`, `header-navigation`, `full-sidebar`
- **Neu:** `mode-dashboard-view`, `mode-data-panel`, `mode-compact-focus`
- **Status:** Migration 043 vollständig abgeschlossen

#### 2. Interface-Updates ✅
```typescript
export interface NavigationPreferences {
  id?: number;
  userId: string;
  navigationMode: NavigationMode;
  sidebarWidth: number;
  autoCollapse: boolean;
  rememberFocusMode: boolean;
  createdAt?: string;
  updatedAt?: string;
}
```

#### 3. Migrations-Sequenz ✅
- Migration 044 (Navigation Mode Update) - COMPLETED
- Migration 045 (Schema-Erweiterung) - COMPLETED
- Aktueller Migrations-Stand: **Schema Version 46**

#### 1. Navigation-Modi aktualisiert
- **Alt:**
  - `header-statistics`
  - `header-navigation`
  - `full-sidebar`
- **Neu:**
  - `mode-dashboard-view`
  - `mode-data-panel`
  - `mode-compact-focus`

#### 2. Header-Height-Referenzen ⚠️ UNVOLLSTÄNDIG
- ✅ Aus NavigationPreferences Interface
- ✅ Aus NavigationModeSettings Interface
- ✅ Aus SYSTEM_DEFAULTS
- ❌ Noch in DatabaseNavigationService.prepareStatements()
- ❌ Service-Initialisierung schlägt fehl

**Aktueller Fehler:**
```
SqliteError: table user_navigation_mode_settings has no column named header_height
at Database.prepare [...] 
at _DatabaseNavigationService.prepareStatements
```

#### 3. Grid-Template-Struktur vereinfacht
- Reduziert auf zwei Zeilen (`40px 1fr`)
- Kein separater Header-Bereich mehr
- Grid-Areas auf neue Struktur angepasst

#### 4. Service-Methoden angepasst
- `setNavigationMode`: Header-Height-Logik entfernt
- `updateLayoutDimensions`: Auf Sidebar-Width fokussiert
- `generateGridConfiguration`: Vereinfachte Grid-Struktur
- `getDefaultLayoutConfig`: Neue Modi implementiert

### 📊 Technische Details

#### Zentral-Konfiguration (SYSTEM_DEFAULTS)
```typescript
static readonly SYSTEM_DEFAULTS = {
  SIDEBAR_WIDTHS: {
    'mode-dashboard-view': 240,
    'mode-data-panel': 280,
    'mode-compact-focus': 240
  },
  
  GRID_TEMPLATE_ROWS: {
    'mode-dashboard-view': '40px 1fr',
    'mode-data-panel': '40px 1fr',
    'mode-compact-focus': '40px 1fr'
  },
  
  GRID_TEMPLATE_AREAS: {
    'mode-dashboard-view': '"sidebar focus-bar" "sidebar main"',
    'mode-data-panel': '"sidebar focus-bar" "sidebar main"',
    'mode-compact-focus': '"sidebar focus-bar" "sidebar main"'
  }
};
```

#### Interface-Updates
```typescript
export interface NavigationPreferences {
  id?: number;
  userId: string;
  navigationMode: NavigationMode;
  sidebarWidth: number;
  autoCollapse: boolean;
  rememberFocusMode: boolean;
  createdAt?: string;
  updatedAt?: string;
}
```

### 🔍 Validierung

1. TypeScript-Kompilierung erfolgreich
2. Keine verbleibenden Header-Height-Referenzen
3. Grid-Templates für alle Modi definiert
4. Alle Service-Methoden angepasst

### 📝 Migration Notes

#### Migrations-Sequenz Analyse
1. ✅ Migration 044 (Navigation Mode Update)
   - Dokumentiert in [ROOT_VALIDATED_SUCCESS-MIGRATION-044_2025-10-25.md](ROOT_VALIDATED_SUCCESS-MIGRATION-044_2025-10-25.md)
   - Backup-Tabelle erstellt und validiert
   - Schema-Änderungen durchgeführt

2. ✅ Migration 045 (Schema-Erweiterung)
   - Erfolgreich ausgeführt
   - Teil der Versions-Sequenz bis 46

3. 📊 Aktueller Migrations-Stand
   - **Schema Version:** 46
   - **Target Version:** 46
   - **Status:** Schema aktuell
   - ⚠️ **Problem:** Service-Layer Synchronisation fehlt

### 🔄 Next Steps

1. Frontend-Components auf neue Modi aktualisieren
2. Grid-Layout-Tests durchführen
3. User-Preferences-Migration validieren

---

## ✅ Implementation Checklist

- [x] Navigation-Modi aktualisiert
- [ ] ⚠️ Header-Height-Referenzen entfernt (noch in DatabaseNavigationService)
- [x] Grid-Templates vereinfacht
- [ ] Service-Methoden angepasst (prepareStatements() fehlerhaft)
- [x] TypeScript-Validierung durchgeführt
- [ ] Frontend-Updates ausstehend
- [ ] Layout-Tests ausstehend
- [ ] User-Migration ausstehend

## 🚨 Kritische Fehler

1. `DatabaseNavigationService.prepareStatements()` referenziert noch `header_height`
2. Datenbank-Schema und Service-Code sind nicht synchronisiert
3. Service-Initialisierung schlägt fehl

## 📋 Nächste Schritte

1. Überprüfen der `prepareStatements()`-Methode in `DatabaseNavigationService`
2. Anpassen der SQL-Statements (header_height entfernen)
3. Service-Initialisierung aktualisieren
4. Build und Test wiederholen

---

**📍 Location:** `/docs/COMPLETED_IMPL-NAVIGATION-MODE-MIGRATION-044_2025-10-26.md`