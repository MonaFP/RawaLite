# 🔧 Database Navigation Mode Constraints Fix

> **Erstellt:** 25.10.2025 | **Letzte Aktualisierung:** 25.10.2025 (Initial Plan)  
> **Status:** Planning | **Typ:** Fix Plan  
> **Schema:** `PLAN_FIX-DATABASE-NAVIGATION-MODE-CONSTRAINTS_2025-10-25.md`

## 🔍 Problem-Analyse

### Aktuelle Symptome
- Footer verschwindet nach App-Start
- Grid Layout Issues
- DatabaseNavigationService validation errors

### Root Cause
```sql
-- Problematische Database CHECK constraints mischen Legacy und neue Modes:
CHECK (navigation_mode IN (
  'header-navigation',     -- LEGACY mode (Problem)
  'header-statistics',     -- LEGACY mode (Problem)
  'full-sidebar',         -- LEGACY mode (Problem)
  'mode-compact-focus'    -- NEW mode (korrekt)
))
```

### Architektur-Violations
1. **Database-First Principle verletzt:**
   - Frontend-State ohne DB-Validierung
   - Umgehung des Field-Mapper Systems

2. **Service Layer Separation gebrochen:**
   - Direkte Database-Zugriffe im Renderer
   - Main/Renderer Process Separation verletzt

3. **Critical Fixes ignoriert:**
   - FIX-016 (Grid Architecture)
   - FIX-017 (Theme System Integration)
   - FIX-018 (Navigation Separation)

## 🎯 Lösung: Migration 044

### Phase 1: Schema Cleanup
```sql
-- 1. Backup erstellen
CREATE TABLE migration_backup_044_navigation_preferences AS 
SELECT * FROM navigation_preferences;

-- 2. Legacy modes entfernen
ALTER TABLE navigation_preferences 
DROP CONSTRAINT navigation_mode_check;

-- 3. Neue Constraint
ALTER TABLE navigation_preferences
ADD CONSTRAINT navigation_mode_check 
CHECK (navigation_mode IN ('mode-compact-focus'));

-- 4. Default korrigieren
ALTER TABLE navigation_preferences
ALTER COLUMN navigation_mode 
SET DEFAULT 'mode-compact-focus';
```

### Phase 2: Data Migration
```sql
-- 1. Legacy Data updaten
UPDATE navigation_preferences 
SET navigation_mode = 'mode-compact-focus'
WHERE navigation_mode IN (
  'header-navigation',
  'header-statistics', 
  'full-sidebar'
);

-- 2. Validate
SELECT DISTINCT navigation_mode 
FROM navigation_preferences;
```

### Phase 3: Service Layer Update
1. **DatabaseNavigationService.ts:**
   ```typescript
   // Field-Mapper Integration
   const validModes = ['mode-compact-focus'];
   
   async validateNavigationMode(mode: string): Promise<boolean> {
     return validModes.includes(mode);
   }
   ```

2. **NavigationIpcBridge.ts:**
   ```typescript
   // Main/Renderer Separation
   ipcMain.handle('navigation:validate', 
     async (event, mode) => {
       return navigationService.validateNavigationMode(mode);
     }
   );
   ```

## 🔄 Rollout Plan

### 1. Pre-Migration Validation
```bash
# 1. Backup Check
sqlite3 "$env:APPDATA\Electron\database\rawalite.db" \
"SELECT COUNT(*) as backup_exists FROM sqlite_master WHERE type='table' AND name='migration_backup_044_navigation_preferences'"

# 2. Critical Fixes
pnpm validate:critical-fixes
```

### 2. Migration Execution
1. Stop alle Prozesse:
```bash
taskkill /F /IM node.exe
taskkill /F /IM electron.exe
```

2. Migration ausführen:
```bash
pnpm migration:run 044
```

### 3. Post-Migration Validation
```sql
-- 1. Schema Check
.schema navigation_preferences

-- 2. Data Check
SELECT DISTINCT navigation_mode FROM navigation_preferences;
```

## 🧪 Test Plan

1. **Service Layer Tests:**
```typescript
describe('DatabaseNavigationService', () => {
  it('should validate correct mode', async () => {
    expect(await service.validateNavigationMode('mode-compact-focus'))
      .toBe(true);
  });

  it('should reject legacy modes', async () => {
    expect(await service.validateNavigationMode('header-navigation'))
      .toBe(false);
  });
});
```

2. **Integration Tests:**
```typescript
describe('Navigation Integration', () => {
  it('should preserve footer visibility', async () => {
    // Start app
    // Check footer visibility
    // Change mode
    // Verify footer still visible
  });
});
```

## 🚨 Rollback Plan

1. **Schema Restore:**
```sql
DROP TABLE navigation_preferences;
ALTER TABLE migration_backup_044_navigation_preferences 
RENAME TO navigation_preferences;
```

2. **Service Reset:**
```bash
git checkout HEAD^ src/main/services/DatabaseNavigationService.ts
pnpm build
```

## ✅ Erfolgs-Kriterien

1. **Database Integrity:**
   - Nur neue navigation modes in DB
   - Keine legacy constraints
   - Alle Daten migriert

2. **Service Validation:**
   - DatabaseNavigationService validiert korrekt
   - Field-Mapper integriert
   - IPC Bridge implementiert

3. **UI Consistency:**
   - Footer bleibt sichtbar
   - Grid Layout korrekt
   - Keine validation errors

## 📋 Follow-up

1. **Cleanup:**
   - Legacy code entfernen
   - Backup tables nach 1 Woche droppen
   - Dokumentation aktualisieren

2. **Monitoring:**
   - Error logs überwachen
   - UI consistency checks
   - Performance metrics

---

**📍 Location:** `/docs/PLAN_FIX-DATABASE-NAVIGATION-MODE-CONSTRAINTS_2025-10-25.md`  
**Purpose:** Fix plan for database navigation mode constraints issue  
**Status:** Ready for review  
**Critical:** Migration 044 implementation plan