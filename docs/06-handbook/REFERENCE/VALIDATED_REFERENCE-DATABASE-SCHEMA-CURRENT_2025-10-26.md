# 🗄️ Database Schema - Live Reference

> **Erstellt:** 26.10.2025 | **Letzte Aktualisierung:** 27.10.2025 (KI-AUTO-DETECTION SYSTEM Integration)  
> **Status:** Live Database Schema | **Typ:** Current Schema State  
> **Schema:** `VALIDATED_REFERENCE-DATABASE-SCHEMA-CURRENT_2025-10-26.md`  
> **Source:** ROOT_VALIDATED_MASTER-DATABASE-THEME-SYSTEM-COMPLETE_2025-10-20.md

## 🤖 **KI-AUTO-DETECTION SYSTEM**

**🎯 STATUS DETECTION KEYWORDS:**
- `Live Database Schema` → **SCHEMA-CRITICAL** - Aktuelle Production Database Struktur
- `Current Schema State` → **LIVE-REFERENCE** - Real-time Database Status
- `046 Migrationen aktiv` → **MIGRATION-STATUS** - Aktueller Schema-Stand
- `Production database` → **PRODUCTION-READY** - Live Environment Status

**📖 TEMPLATE SOURCE:** [VALIDATED_TEMPLATE-KI-AUTO-DETECTION-SYSTEM_2025-10-26.md](../TEMPLATE/VALIDATED_TEMPLATE-KI-AUTO-DETECTION-SYSTEM_2025-10-26.md)  
**🔄 AUTO-UPDATE TRIGGER:** Migration-Änderungen, Schema-Updates, Database-Strukturänderungen  
**🤖 KI-VERHALTENSREGELN (AUTO-AKTIV basierend auf Status):**
- ✅ **SCHEMA-PRIORITY:** Nutze als primäre Database-Referenz für alle DB-Operations  
- ✅ **MIGRATION-CHECK:** Überprüfe aktuelle Migration-Anzahl vor Schema-Änderungen
- ✅ **FIELD-MAPPER-COMPLIANCE:** Verwende Field-Mapper für alle SQL-Queries
- ❌ **FORBIDDEN:** Hardcoded Schema-Annahmen ohne Verification

## 📋 **SCHEMA-ÜBERSICHT nach KI-PRÄFIX-ERKENNUNGSREGELN**

### **STATUS-PRÄFIX:** `VALIDATED_`
- **Bedeutung:** Validierte, stabile Dokumentation (verlässliche Quelle)
- **KI-Verhalten:** Behandelt als verlässliche Quelle für Schema-Referenzen

### **TYP-KATEGORIE:** `REFERENCE-`
- **Verwendung:** Live database schema reference für KI-Sessions
- **Purpose:** Current schema state documentation

> **⚡ LIVE SCHEMA - Aktueller Datenbank-Zustand**  
> **Zweck:** Current database schema reference für KI-Sessions  
> **Migration Status:** 046 Migrationen aktiv (000-045, Schema Version 46 verified 27.10.2025)

## 🎯 **CURRENT SCHEMA OVERVIEW**

### **Database Environment:**
- **Location:** `C:\Users\ramon\AppData\Roaming\Electron\database\rawalite.db`
- **Engine:** SQLite 3.x mit WAL mode
- **Size:** ~5100KB (Production database with real data)
- **Migration Count:** 046 aktive Migrationen (000-045, Schema Version 46)
- **Last Schema Update:** Migration 046 (verified 27.10.2025)
- **Active Tables:** 29 Tabellen total (verified via database inspection)

### **Core System Status:**
- ✅ **Database-Theme-System** - Production Ready (Migration 027)
- ✅ **Navigation Integration** - Complete (Migration 028)
- ✅ **Per-Mode Configuration** - Active (Migration 034-036)
- ✅ **Central Configuration** - Deployed (Migration 037)
- ❌ **Grid Layout** - Footer visibility issues (requires Migration 044)

## 🗄️ **CORE TABLES (Production Active)**

### **Theme System (Migration 027):**
```sql
-- themes: System and user themes
CREATE TABLE themes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    is_system BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- theme_colors: Color definitions per theme
CREATE TABLE theme_colors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    theme_id INTEGER NOT NULL,
    color_key TEXT NOT NULL,
    color_value TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (theme_id) REFERENCES themes(id) ON DELETE CASCADE
);

-- user_theme_preferences: User theme assignments
CREATE TABLE user_theme_preferences (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    theme_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (theme_id) REFERENCES themes(id) ON DELETE CASCADE
);
```

### **Navigation System (Migration 028):**
```sql
-- user_navigation_settings: Navigation preferences
CREATE TABLE user_navigation_settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    navigation_mode TEXT DEFAULT 'mode-dashboard-view' CHECK (
        navigation_mode IN (
            'mode-dashboard-view',
            'mode-data-panel', 
            'mode-compact-focus'
        )
    ),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### **Per-Mode Configuration (Migration 034-036):**
```sql
-- user_navigation_mode_settings: Per-mode navigation settings
CREATE TABLE user_navigation_mode_settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    navigation_mode TEXT NOT NULL,
    setting_key TEXT NOT NULL,
    setting_value TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- user_focus_mode_preferences: Per-mode focus preferences  
CREATE TABLE user_focus_mode_preferences (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    navigation_mode TEXT NOT NULL,
    focus_mode_enabled BOOLEAN DEFAULT 0,
    focus_mode_trigger TEXT DEFAULT 'manual',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- theme_overrides: Scoped theme overrides
CREATE TABLE theme_overrides (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    scope_type TEXT NOT NULL,  -- 'navigation_mode', 'component', 'global'
    scope_value TEXT NOT NULL,
    color_key TEXT NOT NULL,
    color_value TEXT NOT NULL,
    priority INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### **Central Configuration (Migration 037):**
```sql
-- user_layout_preferences: Central layout configuration
-- Added header_height consistency fix (70px → 72px)
CREATE TABLE user_layout_preferences (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    header_height INTEGER DEFAULT 72,  -- Fixed height consistency
    sidebar_width INTEGER DEFAULT 250,
    footer_enabled BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## 🔍 **CURRENT SCHEMA ISSUES**

### **❌ Active Problem: Footer Visibility**
```sql
-- PROBLEM: Mixed legacy + new navigation modes
CHECK (navigation_mode IN (
  'header-statistics',      -- ❌ LEGACY (validation errors)
  'header-navigation',      -- ❌ LEGACY (validation errors)  
  'full-sidebar',           -- ❌ LEGACY (validation errors)
  'mode-dashboard-view',    -- ✅ NEW (valid)
  'mode-data-panel',        -- ✅ NEW (valid)
  'mode-compact-focus'      -- ✅ NEW (valid)
))
```

**Impact:**
- DatabaseNavigationService validation rejects legacy modes
- CSS Grid updates fail due to validation errors
- Footer disappears after app start
- **Required Fix:** Migration 044 (schema cleanup)

### **⚠️ Data Integrity Status:**
- ✅ Theme preferences persist correctly
- ✅ Navigation settings saved properly
- ✅ Per-mode configuration functional
- ❌ Legacy navigation mode conflicts cause UI issues

## 🛠️ **SERVICE LAYER ARCHITECTURE**

### **Database Services (Current Active):**
```typescript
// Central Configuration Service (302 lines)
DatabaseConfigurationService.getActiveConfig()  // Single source of truth

// Theme System Services  
DatabaseThemeService.getAllThemes()
DatabaseThemeService.getUserTheme(userId)
DatabaseThemeService.getThemeColors(themeId)

// Navigation Services
DatabaseNavigationService.getNavigationSettings(userId)
DatabaseNavigationService.setNavigationMode(userId, mode)

// Per-Mode Services (NEW)
DatabaseNavigationService.getModeSettings(userId, mode)
DatabaseNavigationService.setModeSettings(userId, mode, settings)
```

### **Field Mapper Integration:**
```typescript
// MANDATORY: Use field-mapper for all database operations
import { convertSQLQuery } from 'src/lib/field-mapper.ts'

// ✅ CORRECT: Always use parameterized queries
const query = convertSQLQuery('SELECT * FROM themes WHERE is_system = ?', [true])

// ❌ FORBIDDEN: Direct SQL concatenation
const directQuery = `SELECT * FROM themes WHERE name = '${themeName}'`
```

## 🔧 **CRITICAL SCHEMA RULES**

### **Theme System Protection (FIX-016/017/018):**
- **NEVER:** Modify theme tables without schema validation
- **ALWAYS:** Use DatabaseThemeService for theme operations
- **MANDATORY:** Validate Migration 027 integrity before changes
- **FORBIDDEN:** Direct theme table access outside service layer

### **Navigation Schema Rules:**
- **NEVER:** Add navigation modes without CHECK constraint updates
- **ALWAYS:** Validate navigation mode before database operations
- **MANDATORY:** Use new mode system (mode-dashboard-view, mode-data-panel, mode-compact-focus)
- **FORBIDDEN:** Legacy navigation modes (header-statistics, header-navigation, full-sidebar)

### **Database Safety Rules:**
- **ALWAYS:** Use WAL mode for database connections
- **ALWAYS:** Use parameterized queries (field-mapper)
- **NEVER:** Skip migration validation
- **MANDATORY:** Test schema changes in isolated environment first

## 📊 **MIGRATION STATUS**

### **Active Migrations (046 total):**
```sql
-- Current schema version: 46
-- Last successful migration: Migration 046 (verified)
-- Pending migration: Migration 047+ (future)

SELECT migration_id, status, applied_at 
FROM migration_history 
ORDER BY migration_id DESC 
LIMIT 10;
```

### **Critical Migration Dependencies:**
- **Migration 027:** Database-Theme-System foundation (DO NOT MODIFY)
- **Migration 028:** Navigation integration (Active)
- **Migration 034-036:** Per-mode configuration (Production ready)
- **Migration 037:** Central configuration (Header height fix)
- **Migration 044:** Required for footer visibility fix

## 🚨 **EMERGENCY SCHEMA RECOVERY**

### **If Database Corruption Detected:**
```bash
# 1. Stop all processes
taskkill /F /IM node.exe
taskkill /F /IM electron.exe

# 2. Verify database integrity
node scripts/ANALYZE_DATABASE_SQLJS_INSPECT.mjs

# 3. If corruption confirmed, restore from backup
# Backups location: /db/archive-migration-backups/
```

### **If Migration Fails:**
```bash
# Check migration status
pnpm analyze:database-schema | grep -E "migration_history"

# Rollback if needed (CAREFUL!)
node scripts/ROLLBACK_MIGRATION_SAFELY.cjs [migration_id]
```

## 🔄 **SYNC STATUS**

- **Source:** ROOT_VALIDATED_MASTER-DATABASE-THEME-SYSTEM-COMPLETE_2025-10-20.md
- **Last Schema Verification:** 25.10.2025
- **Active Migrations:** 043 completed
- **Known Issues:** Footer visibility (schema conflict)
- **Next Required:** Migration 044 (grid layout fix)

---

**📍 Location:** `docs/06-handbook/REFERENCE/VALIDATED_REFERENCE-DATABASE-SCHEMA-CURRENT_2025-10-26.md`  
**Purpose:** Live database schema reference für KI development sessions  
**Access:** 06-handbook quick navigation system  
**Critical:** Use with field-mapper.ts and validate before modifications