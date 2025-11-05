# PLAN_RESCUE-MIGRATION-049-RESTORE-PER-MODE_2025-11-04

> **Erstellt:** 04.11.2025 | **Letzte Aktualisierung:** 04.11.2025 (Initial Creation - Emergency Rescue Plan)  
> **Status:** PLAN - Emergency Rescue | **Typ:** PLAN - Rescue Operation  
> **Schema:** `PLAN_RESCUE-MIGRATION-049-RESTORE-PER-MODE_2025-11-04.md`

> **🤖 KI-AUTO-DETECTION SYSTEM:**
> - **AKTUELLER STATUS:** PLAN - Emergency Rescue (automatisch durch "Rescue Operation" erkannt)
> - **TEMPLATE-QUELLE:** 03-data PLAN Template
> - **AUTO-UPDATE:** Bei Rescue-Fortschritt automatisch Plan aktualisieren
> - **STATUS-KEYWORDS:** Erkannt durch "PLAN", "Emergency Rescue", "Migration 049"

> **🤖 KI-VERHALTENSREGELN (AUTO-AKTIV basierend auf Status):**
> 
> **📚 STATUS = PLAN:**
> - ✅ **Rescue Plan** - Aktiver Rettungsplan für fehlgeschlagene Option 3 Implementation
> - ✅ **Emergency Operation** - Höchste Priorität zur Wiederherstellung der Funktionalität
> - 🎯 **AUTO-REFERENCE:** Bei Navigation-Problemen diesen Rescue-Plan befolgen
> - 🔄 **AUTO-TRIGGER:** Bei Keywords "NAVIGATION BROKEN" → Rescue-Plan konsultieren

> **⚠️ EMERGENCY RESCUE STATUS:** App non-functional - Migration 045 destroyed per-mode config (04.11.2025)  
> **ROOT CAUSE:** DROP TABLE + UNIQUE(user_id) statt UNIQUE(user_id, navigation_mode)  
> **Template Integration:** KI-SESSION-BRIEFING mandatory vor Rescue-Operations  
> **Critical Function:** Restore INDIVIDUELL konfigurierbare Navigation-Modes

---

## 🚨 **PROBLEM STATEMENT**

### **Was ist passiert:**
Option 3 Implementation (Hybrid-Mapping-Layer) führte zu **massiv fehlerhaftem Umbau**:

**SOLL:** Individuell konfigurierbare Navigation-Modes (per-mode Settings)  
**IST:** Alles wird global definiert (global-only Settings)  
**ERGEBNIS:** App non-functional, per-mode Konfiguration verloren

### **ROOT CAUSE Analysis:**

**Migration 045 - Destruktive Operation:**
```typescript
// src/main/db/migrations/045_enforce_ki_safe_navigation.ts
function rebuildNavigationModeSettings(db: Database): void {
  db.exec('DROP TABLE user_navigation_mode_settings'); // ❌ DESTROYED ALL PER-MODE DATA
  
  db.exec(`CREATE TABLE user_navigation_mode_settings (
    user_id TEXT NOT NULL,
    default_navigation_mode TEXT NOT NULL,
    UNIQUE(user_id)  // ❌ SINGLE ROW PER USER (was UNIQUE(user_id, navigation_mode))
  )`);
}
```

**Comparison:**

| Aspekt | Migration 034 (WORKING) | Migration 045 (BROKEN) |
|--------|-------------------------|------------------------|
| **Structure** | UNIQUE(user_id, navigation_mode) | UNIQUE(user_id) |
| **Storage** | Multiple rows per user | Single row per user |
| **Per-Mode** | ✅ YES (one row per mode) | ❌ NO (global only) |
| **Data Migration** | ✅ YES (preserved data) | ❌ NO (DROP TABLE) |

---

## 🎯 **RESCUE STRATEGY - 7 STEPS**

### **OVERVIEW:**

```
Phase 1: Analyse & Vorbereitung
Phase 2: Hardlock & Service-Refactoring
Phase 3: Fokus-Prefs-Queries & Field-Mapper-Compliance
Phase 4: Optionale Re-Migration (049)
Phase 5: Tests & Guards
Phase 6: Manuelle Verifikation
Phase 7: Dokumentation & Commit
```

---

## 📋 **SCHRITT 1: ANALYSE & VORBEREITUNG**

### **1.1 Documentation Review:**

**MANDATORY Reading:**
- [ ] `06-handbook/REFERENCE/VALIDATED_REFERENCE-CRITICAL-FIXES-CURRENT_2025-10-26.md`
- [ ] `06-handbook/REFERENCE/VALIDATED_REFERENCE-DATABASE-SCHEMA-CURRENT_2025-10-26.md`
- [ ] `docs/03-data/COMPLETED/` - Existing migration documentation
- [ ] `docs/03-data/LESSON/` - Previous database lessons learned

**Schema Understanding:**
- [ ] Review Migration 034 original structure (per-mode working baseline)
- [ ] Review Migration 045 breaking changes (global-only disaster)
- [ ] Review Migration 046/047 attempted repairs (too late)
- [ ] Understand composite key: `UNIQUE(user_id, navigation_mode)`

### **1.2 Current Schema Verification:**

```bash
# Analyze current database state
node scripts/ANALYZE_DATABASE_SQLJS_INSPECT.mjs

# Check user_navigation_mode_settings structure
# Expected (BROKEN): UNIQUE(user_id)
# Target (WORKING): UNIQUE(user_id, navigation_mode)
```

**Verification Checklist:**
- [ ] Confirm current table structure matches broken Migration 045
- [ ] Identify affected tables: `user_navigation_mode_settings`
- [ ] Document current data (if any remains after DROP TABLE)
- [ ] Verify related tables: `user_navigation_preferences`, `user_navigation_mode_history`

### **1.3 Database Backup:**

```bash
# MANDATORY: Secure current database state
Copy-Item "C:\Users\ramon\AppData\Roaming\Electron\database\rawalite.db" `
  -Destination "C:\Users\ramon\AppData\Roaming\Electron\database\rawalite-pre-rescue-049.db.backup"

# Verify backup
Test-Path "C:\Users\ramon\AppData\Roaming\Electron\database\rawalite-pre-rescue-049.db.backup"
```

**Backup Verification:**
- [ ] Backup file created successfully
- [ ] Backup size matches original database
- [ ] Backup timestamp documented: `[TIMESTAMP]`
- [ ] Backup location documented in Session Notes

---

> **🎯 KI-FRIENDLY REMINDER - Ende Schritt 1:**
> 
> **STOP & VERIFY vor Weiter:**
> - ✅ Alle Dokumente aus 1.1 gelesen? (MANDATORY)
> - ✅ Migration 034 vs 045 Struktur verstanden? (UNIQUE Key Difference!)
> - ✅ Database-Backup erstellt? (Pre-rescue-049.db.backup)
> - ✅ Backup verifiziert? (Test-Path erfolgreich)
> - ✅ Current schema analysiert? (ANALYZE_DATABASE_SQLJS_INSPECT.mjs)
> 
> **ERST WENN ALLE ✅ → Weiter mit Schritt 2**
> 
> **Bei ❌ oder Unsicherheit: STOP → Klären → DANN weiter!**

---

## 🔧 **SCHRITT 2: HARDLOCK & SERVICE-REFACTORING**

### **2.1 DatabaseNavigationService Hardlock:**

**Current State:** Service uses hybrid-mapper for schema detection (034 vs 045 routing)  
**Target State:** Hardlock to Migration 034 per-mode structure (no more dual-path)

**Refactoring Plan:**

```typescript
// src/services/DatabaseNavigationService.ts

// ❌ REMOVE: Hybrid-mapper dependency
import { NavigationHybridMapper } from '../lib/navigation-hybrid-mapper';

// ❌ REMOVE: Schema detection logic
private async detectDatabaseSchema(): Promise<SchemaDetectionResult>

// ❌ REMOVE: Conditional routing
if (schemaVersion === 'migration-034') { /* ... */ }
else if (schemaVersion === 'migration-045') { /* ... */ }

// ✅ ADD: Direct per-mode SQL with convertSQLQuery()
import { convertSQLQuery } from '../lib/field-mapper';

// ✅ SIMPLIFY: Constructor
constructor(db: Database) {
  this.db = db;
  // No more schema detection, no more hybrid-mapper
}

// ✅ HARDLOCK: getModeSpecificSettings
async getModeSpecificSettings(userId: string, mode: string): Promise<ModeSettings> {
  const query = convertSQLQuery(
    'SELECT header_height FROM user_navigation_mode_settings WHERE user_id = ? AND navigation_mode = ?',
    [userId, mode]
  );
  
  const result = this.db.prepare(query).get(userId, mode);
  return result || this.getDefaultSettingsForMode(mode);
}
```

**Refactoring Checklist:**
- [ ] Remove `navigation-hybrid-mapper.ts` import
- [ ] Remove `detectDatabaseSchema()` method
- [ ] Remove conditional schema routing logic
- [ ] Add direct `convertSQLQuery()` usage for all queries
- [ ] Simplify constructor (remove schema detection)
- [ ] Update `getModeSpecificSettings()` to use per-mode SQL
- [ ] Update `setModeSpecificSettings()` to use per-mode SQL
- [ ] Remove all references to `migration-045` schema

### **2.2 Remove Hybrid-Mapper File:**

```bash
# BACKUP first (MANDATORY per 29.10.2025 File Backup Policy)
Copy-Item "src/lib/navigation-hybrid-mapper.ts" `
  -Destination "src/lib/navigation-hybrid-mapper.ts.backup"

# Move to archive (not delete - keep for reference)
Move-Item "src/lib/navigation-hybrid-mapper.ts" `
  -Destination "archive/deprecated-navigation-hybrid-mapper-2025-11-04.ts"
```

**Cleanup Checklist:**
- [ ] Backup created: `navigation-hybrid-mapper.ts.backup`
- [ ] File archived: `archive/deprecated-navigation-hybrid-mapper-2025-11-04.ts`
- [ ] No remaining imports in codebase (grep search verification)
- [ ] TypeScript compilation successful (no broken imports)

---

> **🎯 KI-FRIENDLY REMINDER - Ende Schritt 2:**
> 
> **STOP & VERIFY vor Weiter:**
> - ✅ DatabaseNavigationService refactored? (Hybrid-mapper removed)
> - ✅ Schema detection logic entfernt? (No more 034 vs 045 routing)
> - ✅ Constructor vereinfacht? (No more schema detection)
> - ✅ navigation-hybrid-mapper.ts archiviert? (nicht gelöscht!)
> - ✅ TypeScript Compilation erfolgreich? (pnpm build)
> - ✅ Keine broken imports? (grep search verification)
> 
> **ERST WENN ALLE ✅ → Weiter mit Schritt 3**
> 
> **Bei ❌: Code rollback → Fix → DANN weiter!**

---

## 🎯 **SCHRITT 3: FOKUS-PREFS-QUERIES & FIELD-MAPPER-COMPLIANCE**

### **3.1 Migration zu Field-Mapper Queries:**

**All SQL queries MUST use `convertSQLQuery()` - NO EXCEPTIONS**

**Pattern:**
```typescript
// ❌ FORBIDDEN: Hardcoded snake_case SQL
const query = `SELECT header_height FROM user_navigation_mode_settings WHERE user_id = ?`;

// ✅ CORRECT: Field-mapper SQL (automatic camelCase ↔ snake_case conversion)
const query = convertSQLQuery(
  'SELECT header_height FROM user_navigation_mode_settings WHERE user_id = ? AND navigation_mode = ?',
  [userId, mode]
);
```

### **3.2 Query Locations to Update:**

**DatabaseNavigationService.ts:**
- [ ] `getModeSpecificSettings()` - Convert to field-mapper
- [ ] `setModeSpecificSettings()` - Convert to field-mapper
- [ ] `getDefaultMode()` - Convert to field-mapper (if exists)
- [ ] `updateDefaultMode()` - Convert to field-mapper (if exists)
- [ ] All WHERE clauses include `navigation_mode = ?` parameter

**Field-Mapper Integration Checklist:**
- [ ] Import `convertSQLQuery` from `src/lib/field-mapper.ts`
- [ ] Replace ALL direct SQL strings with `convertSQLQuery()` wrapper
- [ ] Verify parameter arrays match query placeholders
- [ ] Test query execution (no SQL injection vulnerabilities)
- [ ] Validate camelCase ↔ snake_case conversion works correctly

### **3.3 Focus-Prefs Migration:**

**If Focus-Mode Preferences exist in separate table:**

```typescript
// Example: getFocusPreferences() mit field-mapper
async getFocusPreferences(userId: string, mode: string): Promise<FocusPrefs> {
  const query = convertSQLQuery(
    'SELECT * FROM user_focus_mode_preferences WHERE user_id = ? AND navigation_mode = ?',
    [userId, mode]
  );
  
  const result = this.db.prepare(query).get(userId, mode);
  return result || this.getDefaultFocusPrefsForMode(mode);
}
```

**Focus-Prefs Checklist:**
- [ ] Identify focus-related queries in codebase
- [ ] Convert to field-mapper pattern
- [ ] Add `navigation_mode` WHERE clause if missing
- [ ] Test focus-mode switching with per-mode persistence

---

> **🎯 KI-FRIENDLY REMINDER - Ende Schritt 3:**
> 
> **STOP & VERIFY vor Weiter:**
> - ✅ Alle SQL queries nutzen convertSQLQuery()? (NO hardcoded snake_case!)
> - ✅ getModeSpecificSettings() migriert? (Field-mapper compliant)
> - ✅ setModeSpecificSettings() migriert? (Field-mapper compliant)
> - ✅ navigation_mode WHERE clauses hinzugefügt? (Per-mode filtering)
> - ✅ Focus-Prefs queries migriert? (Falls vorhanden)
> - ✅ Keine SQL injection vulnerabilities? (Parameterized queries only!)
> 
> **ERST WENN ALLE ✅ → Weiter mit Schritt 4**
> 
> **Bei ❌: Query-Review → Security-Check → DANN weiter!**

---

## 🔄 **SCHRITT 4: OPTIONALE RE-MIGRATION (049)**

### **4.1 Migration 049 Specification:**

**Purpose:** Restore original Migration 034 per-mode structure

**Migration File:** `src/main/db/migrations/049_restore_per_mode_navigation.ts`

**Operations:**

```typescript
import Database from 'better-sqlite3';

export function up(db: Database): void {
  console.log('🔄 Migration 049: Restoring per-mode navigation structure...');

  // STEP 1: Backup current global settings (if any data exists)
  db.exec(`
    CREATE TEMPORARY TABLE temp_global_settings AS
    SELECT user_id, default_navigation_mode
    FROM user_navigation_mode_settings
  `);

  // STEP 2: Drop broken global table
  db.exec('DROP TABLE user_navigation_mode_settings');

  // STEP 3: Recreate original per-mode structure (Migration 034 baseline)
  db.exec(`
    CREATE TABLE user_navigation_mode_settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      navigation_mode TEXT NOT NULL CHECK(navigation_mode IN ('dashboard-view', 'data-panel', 'compact-focus')),
      header_height INTEGER NOT NULL DEFAULT 160 CHECK(header_height IN (36, 160)),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(user_id, navigation_mode)  -- ✅ COMPOSITE KEY RESTORED
    )
  `);

  // STEP 4: Seed default settings for all modes
  const modes = ['dashboard-view', 'data-panel', 'compact-focus'];
  const defaultHeights = { 'dashboard-view': 160, 'data-panel': 160, 'compact-focus': 36 };

  db.transaction(() => {
    const insert = db.prepare(`
      INSERT INTO user_navigation_mode_settings (user_id, navigation_mode, header_height)
      VALUES (?, ?, ?)
    `);

    // Get users from temp table (or use default 'system' user)
    const users = db.prepare('SELECT DISTINCT user_id FROM temp_global_settings').all() as { user_id: string }[];
    
    if (users.length === 0) {
      users.push({ user_id: 'system' }); // Fallback if no data
    }

    for (const user of users) {
      for (const mode of modes) {
        insert.run(user.user_id, mode, defaultHeights[mode]);
      }
    }
  })();

  // STEP 5: Create indexes for performance
  db.exec('CREATE INDEX idx_nav_settings_user_mode ON user_navigation_mode_settings(user_id, navigation_mode)');
  db.exec('CREATE INDEX idx_nav_settings_mode ON user_navigation_mode_settings(navigation_mode)');

  // STEP 6: Drop temporary backup table
  db.exec('DROP TABLE temp_global_settings');

  console.log('✅ Migration 049: Per-mode navigation structure restored!');
}

export function down(db: Database): void {
  console.log('⚠️ Migration 049 rollback: Not recommended - would destroy per-mode data again!');
  
  // Rollback would recreate broken global structure - NOT RECOMMENDED
  // If absolutely necessary, backup data first and recreate Migration 045 structure
  
  throw new Error('Migration 049 rollback blocked - would destroy per-mode configuration');
}
```

### **4.2 Migration Execution Plan:**

```bash
# BEFORE EXECUTION: Verify backup exists
Test-Path "C:\Users\ramon\AppData\Roaming\Electron\database\rawalite-pre-rescue-049.db.backup"

# Execute migration
pnpm validate:migrations  # Ensure migration index is correct

# Start app to trigger migration
pnpm dev:all

# Verify migration success
node scripts/ANALYZE_DATABASE_SQLJS_INSPECT.mjs | Select-String "user_navigation_mode_settings"
```

**Migration Checklist:**
- [ ] Migration file created: `049_restore_per_mode_navigation.ts`
- [ ] Migration index updated (if auto-generation failed)
- [ ] Database backup verified before execution
- [ ] Migration executed successfully (check logs)
- [ ] New table structure verified: UNIQUE(user_id, navigation_mode) ✅
- [ ] Default settings seeded for all modes
- [ ] Indexes created for performance

### **4.3 Decision Point: Migration 049 vs. Hardlock:**

**Option A: WITH Migration 049 (Recommended)**
- ✅ Proper schema restoration
- ✅ Clean database state
- ✅ Future-proof (no hybrid logic)
- ⚠️ Requires database restart

**Option B: WITHOUT Migration 049 (Quick Fix)**
- ✅ Faster implementation (service-level only)
- ❌ Schema remains broken (UNIQUE(user_id))
- ❌ Technical debt (hybrid logic removed but schema wrong)
- ❌ Future migrations may fail

**RECOMMENDATION:** Execute Migration 049 for clean restoration ✅

---

> **🎯 KI-FRIENDLY REMINDER - Ende Schritt 4:**
> 
> **STOP & VERIFY vor Weiter:**
> - ✅ Migration 049 file created? (049_restore_per_mode_navigation.ts)
> - ✅ UNIQUE constraint restored? (UNIQUE(user_id, navigation_mode) composite key!)
> - ✅ Migration executed successfully? (Check logs for errors)
> - ✅ Database backup verified BEFORE execution? (Pre-rescue-049.db.backup)
> - ✅ New table structure verified? (ANALYZE_DATABASE_SQLJS_INSPECT.mjs)
> - ✅ Default settings seeded? (All 3 modes: dashboard, data-panel, compact)
> - ✅ Indexes created? (Performance optimization)
> 
> **CRITICAL: Wenn Migration fehlschlägt → STOP → Backup restore → Debug!**
> 
> **ERST WENN ALLE ✅ → Weiter mit Schritt 5**

---

## ✅ **SCHRITT 5: TESTS & GUARDS**

### **5.1 Unit Tests Creation:**

**File:** `tests/unit/DatabaseNavigationService.per-mode.test.ts`

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import Database from 'better-sqlite3';
import { DatabaseNavigationService } from '../../src/services/DatabaseNavigationService';

describe('DatabaseNavigationService - Per-Mode Configuration', () => {
  let db: Database.Database;
  let service: DatabaseNavigationService;

  beforeEach(() => {
    db = new Database(':memory:');
    
    // Setup per-mode structure (Migration 049 equivalent)
    db.exec(`
      CREATE TABLE user_navigation_mode_settings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        navigation_mode TEXT NOT NULL,
        header_height INTEGER NOT NULL DEFAULT 160,
        UNIQUE(user_id, navigation_mode)
      )
    `);

    service = new DatabaseNavigationService(db);
  });

  it('should store different header heights per mode', async () => {
    const userId = 'test-user';

    // Set different heights for different modes
    await service.setModeSpecificSettings(userId, 'dashboard-view', { headerHeight: 160 });
    await service.setModeSpecificSettings(userId, 'compact-focus', { headerHeight: 36 });

    // Verify independent persistence
    const dashboardSettings = await service.getModeSpecificSettings(userId, 'dashboard-view');
    const compactSettings = await service.getModeSpecificSettings(userId, 'compact-focus');

    expect(dashboardSettings.headerHeight).toBe(160);
    expect(compactSettings.headerHeight).toBe(36);
  });

  it('should not allow mode cross-contamination', async () => {
    const userId = 'test-user';

    // Set height for dashboard-view
    await service.setModeSpecificSettings(userId, 'dashboard-view', { headerHeight: 160 });

    // Change height for compact-focus
    await service.setModeSpecificSettings(userId, 'compact-focus', { headerHeight: 36 });

    // Dashboard settings should remain unchanged
    const dashboardSettings = await service.getModeSpecificSettings(userId, 'dashboard-view');
    expect(dashboardSettings.headerHeight).toBe(160); // Should NOT be 36
  });

  it('should support multiple users with independent settings', async () => {
    // User 1: dashboard-view = 160
    await service.setModeSpecificSettings('user-1', 'dashboard-view', { headerHeight: 160 });

    // User 2: dashboard-view = 36 (different preference)
    await service.setModeSpecificSettings('user-2', 'dashboard-view', { headerHeight: 36 });

    // Verify independence
    const user1Settings = await service.getModeSpecificSettings('user-1', 'dashboard-view');
    const user2Settings = await service.getModeSpecificSettings('user-2', 'dashboard-view');

    expect(user1Settings.headerHeight).toBe(160);
    expect(user2Settings.headerHeight).toBe(36);
  });
});
```

**Test Execution:**
```bash
# Run per-mode tests
pnpm test tests/unit/DatabaseNavigationService.per-mode.test.ts

# Verify all tests pass
```

### **5.2 Validation Guard Script:**

**File:** `scripts/VALIDATE_NAVIGATION_PER_MODE_CHECK.mjs`

```javascript
#!/usr/bin/env node
import Database from 'better-sqlite3';
import { app } from 'electron';
import path from 'path';

console.log('🔍 Validating per-mode navigation structure...\n');

// Get production database path
const userData = app.getPath('userData');
const dbPath = path.join(userData, 'database', 'rawalite.db');

const db = new Database(dbPath, { readonly: true });

// VALIDATION 1: Check table structure
const tableInfo = db.pragma('table_info(user_navigation_mode_settings)');
const hasNavigationModeColumn = tableInfo.some(col => col.name === 'navigation_mode');
const hasUserIdColumn = tableInfo.some(col => col.name === 'user_id');

console.log('✅ Table Structure Validation:');
console.log(`  - user_id column: ${hasUserIdColumn ? '✅ PRESENT' : '❌ MISSING'}`);
console.log(`  - navigation_mode column: ${hasNavigationModeColumn ? '✅ PRESENT' : '❌ MISSING'}\n`);

// VALIDATION 2: Check UNIQUE constraint
const indexList = db.pragma('index_list(user_navigation_mode_settings)');
const uniqueIndex = indexList.find(idx => idx.unique === 1);

if (uniqueIndex) {
  const indexInfo = db.pragma(`index_info(${uniqueIndex.name})`);
  const indexColumns = indexInfo.map(col => tableInfo[col.seqno].name);
  
  console.log('✅ UNIQUE Constraint Validation:');
  console.log(`  - Index: ${uniqueIndex.name}`);
  console.log(`  - Columns: ${indexColumns.join(', ')}`);
  
  const isCompositeKey = indexColumns.includes('user_id') && indexColumns.includes('navigation_mode');
  console.log(`  - Composite Key (user_id + navigation_mode): ${isCompositeKey ? '✅ CORRECT' : '❌ WRONG (global-only)'}\n`);
} else {
  console.log('❌ UNIQUE Constraint: MISSING\n');
}

// VALIDATION 3: Check data integrity (multiple rows per user)
const userModeCount = db.prepare(`
  SELECT user_id, COUNT(*) as mode_count
  FROM user_navigation_mode_settings
  GROUP BY user_id
`).all();

console.log('✅ Data Integrity Validation:');
if (userModeCount.length > 0) {
  for (const row of userModeCount) {
    const status = row.mode_count > 1 ? '✅ PER-MODE' : '⚠️ SINGLE MODE';
    console.log(`  - User: ${row.user_id}, Modes: ${row.mode_count} ${status}`);
  }
} else {
  console.log('  - No data present (empty table)\n');
}

db.close();

console.log('\n✅ Per-mode navigation validation complete!');
```

**Guard Integration:**
```json
// package.json
{
  "scripts": {
    "validate:per-mode": "node scripts/VALIDATE_NAVIGATION_PER_MODE_CHECK.mjs",
    "prebuild": "pnpm validate:critical-fixes && pnpm validate:per-mode"
  }
}
```

**Guard Checklist:**
- [ ] Validation script created: `VALIDATE_NAVIGATION_PER_MODE_CHECK.mjs`
- [ ] Script verifies composite key: `UNIQUE(user_id, navigation_mode)`
- [ ] Script checks data integrity: Multiple rows per user allowed
- [ ] Package.json updated: `validate:per-mode` command added
- [ ] Prebuild hook includes per-mode validation

---

> **🎯 KI-FRIENDLY REMINDER - Ende Schritt 5:**
> 
> **STOP & VERIFY vor Weiter:**
> - ✅ Unit tests created? (DatabaseNavigationService.per-mode.test.ts)
> - ✅ Tests pass? (pnpm test - All 3 scenarios green!)
> - ✅ Validation guard created? (VALIDATE_NAVIGATION_PER_MODE_CHECK.mjs)
> - ✅ Guard verifies composite key? (UNIQUE(user_id, navigation_mode))
> - ✅ Guard checks data integrity? (Multiple rows per user)
> - ✅ Package.json updated? (validate:per-mode command)
> - ✅ Prebuild hook integrated? (Prevent future regressions)
> 
> **AUTOMATED PROTECTION: Guards prevent Migration-045-style disasters!**
> 
> **ERST WENN ALLE ✅ → Weiter mit Schritt 6**

---

## 🧪 **SCHRITT 6: MANUELLE VERIFIKATION**

### **6.1 Test Scenarios:**

**Scenario 1: Different Header Heights per Mode**

```bash
# Start app
pnpm dev:all

# Manual steps:
1. Navigate to dashboard-view mode
2. Set header height to 160px (expanded)
3. Navigate to compact-focus mode
4. Set header height to 36px (compact)
5. Navigate back to dashboard-view
6. Verify header height is still 160px (no cross-contamination)
```

**Expected Result:**
- ✅ Dashboard-view: 160px persists
- ✅ Compact-focus: 36px persists
- ✅ No global override (modes independent)

**Scenario 2: Mode Switching Persistence**

```bash
# Manual steps:
1. Set all modes to different heights (dashboard=160, data-panel=160, compact=36)
2. Switch between modes multiple times
3. Close app
4. Reopen app
5. Verify all modes still have correct heights
```

**Expected Result:**
- ✅ Settings persist across app restarts
- ✅ No settings lost during mode switches
- ✅ Database stores separate rows per mode

**Scenario 3: Multi-User Independence (if applicable)**

```bash
# Manual steps (if multi-user support):
1. Login as User A, set dashboard-view = 160px
2. Logout, login as User B, set dashboard-view = 36px
3. Logout, login as User A again
4. Verify User A still has 160px (not affected by User B)
```

**Expected Result:**
- ✅ User A settings independent from User B
- ✅ No user cross-contamination

### **6.2 Database Verification:**

```bash
# After manual testing, inspect database
node scripts/ANALYZE_DATABASE_SQLJS_INSPECT.mjs

# Check for per-mode rows
# Expected: Multiple rows per user (one per mode)
# WRONG: Single row per user (global-only)
```

**Verification Query:**
```sql
SELECT user_id, navigation_mode, header_height
FROM user_navigation_mode_settings
ORDER BY user_id, navigation_mode;

-- Expected output example:
-- user_id       | navigation_mode  | header_height
-- system        | dashboard-view   | 160
-- system        | data-panel       | 160
-- system        | compact-focus    | 36
```

**Database Verification Checklist:**
- [ ] Multiple rows per user (one per mode)
- [ ] Composite UNIQUE key verified: `UNIQUE(user_id, navigation_mode)`
- [ ] No global-only rows (single user_id entry)
- [ ] Header heights differ per mode (not all 160 or all 36)

---

> **🎯 KI-FRIENDLY REMINDER - Ende Schritt 6:**
> 
> **STOP & VERIFY vor Weiter:**
> - ✅ Scenario 1 tested? (Different header heights per mode persist!)
> - ✅ Scenario 2 tested? (Mode switching persistence across app restarts!)
> - ✅ Scenario 3 tested? (Multi-user independence - if applicable)
> - ✅ Database inspection done? (ANALYZE_DATABASE_SQLJS_INSPECT.mjs)
> - ✅ Multiple rows per user verified? (One row per mode)
> - ✅ Composite key verified? (UNIQUE(user_id, navigation_mode))
> - ✅ No cross-mode contamination? (Dashboard=160 stays 160, Compact=36 stays 36)
> 
> **MANUAL TESTING CRITICAL: Automated tests can't catch all UI behaviors!**
> 
> **ERST WENN ALLE ✅ → Weiter mit Schritt 7**

---

## 📝 **SCHRITT 7: DOKUMENTATION & COMMIT**

### **7.1 TRACKING Document Update:**

**File:** `docs/03-data/COMPLETED/TRACKING_IMPL-OPTION3-DATABASE-HYBRID-MAPPING-LAYER_2025-11-04.md`

**Add Phase 4 Section:**

```markdown
## 📋 **PHASE 4: RESCUE OPERATION (04.11.2025)**

### **ROOT CAUSE IDENTIFICATION:**
- Migration 045 destroyed per-mode configuration via DROP TABLE
- Changed UNIQUE(user_id, navigation_mode) → UNIQUE(user_id)
- Result: Global-only configuration, app non-functional

### **RESCUE ACTIONS:**
1. ✅ Deprecated failed Option 3 plan (DEPRECATED_PLAN-OPTION3-HYBRID-MAPPING-FAILED)
2. ✅ Created 7-step rescue plan (PLAN_RESCUE-MIGRATION-049-RESTORE-PER-MODE)
3. ✅ Hardlocked DatabaseNavigationService to per-mode structure (removed hybrid-mapper)
4. ✅ Migrated all queries to field-mapper compliance (convertSQLQuery)
5. ✅ Executed Migration 049 (restored UNIQUE(user_id, navigation_mode) composite key)
6. ✅ Created validation tests (DatabaseNavigationService.per-mode.test.ts)
7. ✅ Created validation guard (VALIDATE_NAVIGATION_PER_MODE_CHECK.mjs)
8. ✅ Manual verification complete (all modes persist independently)

### **RESULT:**
- ✅ Per-mode navigation configuration restored
- ✅ App functional with INDIVIDUELL konfigurierbare Navigation-Modes
- ✅ Technical debt removed (hybrid-mapper deprecated)
- ✅ Database schema clean (Migration 049 baseline)

### **STATUS:** **RESCUED** (from failed Option 3) → Working per-mode configuration ✅
```

### **7.2 LESSON_FIX Creation:**

**File:** `docs/03-data/LESSON/LESSON_FIX-MIGRATION-045-DESTROYED-PER-MODE-CONFIG_2025-11-04.md`

```markdown
# LESSON_FIX-MIGRATION-045-DESTROYED-PER-MODE-CONFIG_2025-11-04

> **Erstellt:** 04.11.2025 | **Letzte Aktualisierung:** 04.11.2025 (Rescue Operation Complete)  
> **Status:** SOLVED | **Typ:** LESSON_FIX - Critical Migration Failure  
> **Schema:** `LESSON_FIX-MIGRATION-045-DESTROYED-PER-MODE-CONFIG_2025-11-04.md`

## 🚨 **PROBLEM STATEMENT**

Migration 045 destroyed per-mode navigation configuration through DROP TABLE operation and changed UNIQUE constraint from composite key to simple key.

**SYMPTOM:** App non-functional, navigation settings global-only instead of per-mode  
**ROOT CAUSE:** `DROP TABLE` + `UNIQUE(user_id)` instead of `UNIQUE(user_id, navigation_mode)`  
**IMPACT:** Complete loss of INDIVIDUELL konfigurierbare Navigation-Modes

## 📋 **ROOT CAUSE ANALYSIS**

### **Migration 045 Breaking Change:**

```typescript
// DESTRUCTIVE OPERATION:
function rebuildNavigationModeSettings(db: Database): void {
  db.exec('DROP TABLE user_navigation_mode_settings'); // ❌ NO DATA MIGRATION
  
  db.exec(`CREATE TABLE user_navigation_mode_settings (
    user_id TEXT NOT NULL,
    default_navigation_mode TEXT NOT NULL,
    UNIQUE(user_id)  // ❌ CHANGED FROM UNIQUE(user_id, navigation_mode)
  )`);
}
```

### **Why This Failed:**

| Migration 034 (Working) | Migration 045 (Broken) |
|------------------------|------------------------|
| UNIQUE(user_id, navigation_mode) | UNIQUE(user_id) |
| Multiple rows per user (one per mode) | Single row per user (global only) |
| Per-mode settings: ✅ YES | Per-mode settings: ❌ NO |
| Data preserved: ✅ YES | Data preserved: ❌ NO (DROP TABLE) |

## 🔧 **SOLUTION IMPLEMENTATION**

### **7-Step Rescue Plan:**

1. ✅ Deprecated failed Option 3 Hybrid-Mapping-Layer plan
2. ✅ Hardlocked DatabaseNavigationService to per-mode structure
3. ✅ Removed hybrid-mapper dependency (archived)
4. ✅ Migrated all queries to field-mapper compliance
5. ✅ Created Migration 049: Restore composite key UNIQUE(user_id, navigation_mode)
6. ✅ Created validation tests and guards
7. ✅ Manual verification complete

### **Migration 049 - Restoration:**

```typescript
// COMPOSITE KEY RESTORED:
db.exec(`
  CREATE TABLE user_navigation_mode_settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    navigation_mode TEXT NOT NULL,
    header_height INTEGER NOT NULL DEFAULT 160,
    UNIQUE(user_id, navigation_mode)  -- ✅ COMPOSITE KEY RESTORED
  )
`);
```

## ✅ **OUTCOMES**

- ✅ Per-mode configuration restored (INDIVIDUELL konfigurierbar)
- ✅ App functional again
- ✅ Technical debt removed (hybrid-mapper deprecated)
- ✅ Database schema clean (Migration 049 baseline)
- ✅ Validation guards in place (prevent future regressions)

## 🛡️ **PREVENTION RULES**

### **NEVER in Migrations:**
- ❌ DROP TABLE without data migration strategy
- ❌ Change UNIQUE constraints without understanding impact
- ❌ Rebuild tables without preserving existing data
- ❌ Mix "enforce" with "rebuild" in same migration

### **ALWAYS in Migrations:**
- ✅ Backup current data before destructive operations
- ✅ Use ALTER TABLE instead of DROP/CREATE when possible
- ✅ Test composite key changes thoroughly
- ✅ Document breaking changes in migration comments
- ✅ Create rollback strategy for destructive migrations

### **MANDATORY Reviews:**
- ✅ Peer review for any DROP TABLE operations
- ✅ Schema impact analysis before UNIQUE constraint changes
- ✅ Test migrations on copy of production database first
- ✅ Validation guards for multi-row-per-user scenarios

## 📊 **METRICS**

- **Detection Time:** Immediate (app non-functional)
- **Root Cause Time:** 30 minutes (schema comparison)
- **Resolution Time:** 4 hours (7-step rescue plan)
- **Testing Time:** 2 hours (unit tests + manual verification)
- **Total Downtime:** ~6 hours (emergency rescue operation)

## 🔗 **RELATED DOCUMENTATION**

- **Failed Plan:** `docs/03-data/DEPRECATED/DEPRECATED_PLAN-OPTION3-HYBRID-MAPPING-FAILED_2025-11-03.md`
- **Rescue Plan:** `docs/03-data/PLAN/PLAN_RESCUE-MIGRATION-049-RESTORE-PER-MODE_2025-11-04.md`
- **Tracking:** `docs/03-data/COMPLETED/TRACKING_IMPL-OPTION3-DATABASE-HYBRID-MAPPING-LAYER_2025-11-04.md`

---

**LESSON LEARNED:** Never DROP TABLE without comprehensive data migration. Always preserve multi-row-per-user functionality when refactoring.
```

### **7.3 Git Commit Strategy:**

```bash
# COMMIT 1: Service Refactoring
git add src/services/DatabaseNavigationService.ts
git add archive/deprecated-navigation-hybrid-mapper-2025-11-04.ts
git commit -m "refactor(navigation): Remove hybrid-mapper, hardlock to per-mode structure

- Remove navigation-hybrid-mapper.ts dependency
- Hardlock DatabaseNavigationService to Migration 034 per-mode structure
- Remove schema detection logic (no more dual-path routing)
- Archive hybrid-mapper for reference (deprecated)

BREAKING: Requires Migration 049 for per-mode restoration

Refs: PLAN_RESCUE-MIGRATION-049-RESTORE-PER-MODE_2025-11-04"

# COMMIT 2: Field-Mapper Compliance
git add src/services/DatabaseNavigationService.ts
git commit -m "refactor(navigation): Migrate all queries to field-mapper compliance

- Convert all SQL queries to convertSQLQuery() wrapper
- Add navigation_mode WHERE clauses for per-mode filtering
- Remove hardcoded snake_case SQL (field-mapper automatic conversion)

Refs: PLAN_RESCUE-MIGRATION-049-RESTORE-PER-MODE_2025-11-04"

# COMMIT 3: Migration 049
git add src/main/db/migrations/049_restore_per_mode_navigation.ts
git commit -m "feat(db): Migration 049 - Restore per-mode navigation structure

- Restore UNIQUE(user_id, navigation_mode) composite key
- Seed default settings for all modes (dashboard, data-panel, compact)
- Create performance indexes for user+mode queries
- Fix Migration 045 destructive DROP TABLE operation

BREAKING: Requires database restart
FIXES: Per-mode navigation configuration destroyed by Migration 045

Refs: LESSON_FIX-MIGRATION-045-DESTROYED-PER-MODE-CONFIG_2025-11-04"

# COMMIT 4: Tests & Guards
git add tests/unit/DatabaseNavigationService.per-mode.test.ts
git add scripts/VALIDATE_NAVIGATION_PER_MODE_CHECK.mjs
git add package.json
git commit -m "test(navigation): Add per-mode validation tests and guards

- Create unit tests for per-mode persistence
- Create validation guard script (VALIDATE_NAVIGATION_PER_MODE_CHECK)
- Add prebuild validation hook (prevent regressions)

Refs: PLAN_RESCUE-MIGRATION-049-RESTORE-PER-MODE_2025-11-04"

# COMMIT 5: Documentation
git add docs/03-data/DEPRECATED/DEPRECATED_PLAN-OPTION3-HYBRID-MAPPING-FAILED_2025-11-03.md
git add docs/03-data/PLAN/PLAN_RESCUE-MIGRATION-049-RESTORE-PER-MODE_2025-11-04.md
git add docs/03-data/LESSON/LESSON_FIX-MIGRATION-045-DESTROYED-PER-MODE-CONFIG_2025-11-04.md
git add docs/03-data/COMPLETED/TRACKING_IMPL-OPTION3-DATABASE-HYBRID-MAPPING-LAYER_2025-11-04.md
git commit -m "docs(navigation): Document Migration 045 failure and rescue operation

- Mark Option 3 plan as DEPRECATED (failed implementation)
- Create 7-step rescue plan (PLAN_RESCUE-MIGRATION-049)
- Document root cause in LESSON_FIX
- Update TRACKING with Phase 4 rescue operation

Refs: LESSON_FIX-MIGRATION-045-DESTROYED-PER-MODE-CONFIG_2025-11-04"
```

### **7.4 Documentation Checklist:**

- [ ] TRACKING document updated (Phase 4 added)
- [ ] LESSON_FIX created (root cause documented)
- [ ] Old plan marked DEPRECATED (failure explained)
- [ ] New rescue plan created (7 steps detailed)
- [ ] Git commits structured (5 logical commits)
- [ ] Cross-references added (all docs linked)

---

> **🎯 KI-FRIENDLY REMINDER - Ende Schritt 7:**
> 
> **STOP & VERIFY vor Abschluss:**
> - ✅ TRACKING updated? (Phase 4: RESCUE OPERATION complete)
> - ✅ LESSON_FIX created? (Root cause + prevention rules documented)
> - ✅ Old plan deprecated? (DEPRECATED_ prefix + failure notice)
> - ✅ Git commits structured? (5 logical commits with clear messages)
> - ✅ Cross-references added? (All docs properly linked)
> - ✅ All checklists completed? (1-7 verified)
> 
> **DOCUMENTATION = KNOWLEDGE PRESERVATION!**
> 
> **Future KI-Sessions können aus dieser Rescue-Operation lernen!**
> 
> **ERST WENN ALLE ✅ → RESCUE COMPLETE! 🎉**

---

## 🎯 **SUCCESS CRITERIA**

### **Technical Success:**
- ✅ Per-mode navigation configuration working
- ✅ Multiple rows per user in database (one per mode)
- ✅ Header heights persist independently per mode
- ✅ No cross-mode contamination
- ✅ App functional and stable

### **Code Quality:**
- ✅ Hybrid-mapper removed (technical debt cleared)
- ✅ All queries use field-mapper (convertSQLQuery)
- ✅ Service layer simplified (no schema detection)
- ✅ Tests created (per-mode validation)
- ✅ Guards in place (prevent regressions)

### **Documentation Quality:**
- ✅ Root cause documented (LESSON_FIX)
- ✅ Rescue plan documented (PLAN_RESCUE)
- ✅ Tracking updated (Phase 4)
- ✅ Old plan deprecated (failure explained)
- ✅ Cross-references complete

### **Validation Success:**
- ✅ `pnpm validate:critical-fixes` passes
- ✅ `pnpm validate:migrations` passes
- ✅ `pnpm validate:per-mode` passes (new guard)
- ✅ Manual testing complete (all scenarios pass)
- ✅ Database schema verified (composite key restored)

---

## 📋 **NEXT STEPS (Post-Rescue)**

### **Immediate:**
1. Monitor app stability (no regressions)
2. User feedback collection (per-mode functionality)
3. Performance monitoring (database queries)

### **Short-Term:**
1. Review all migrations (prevent similar issues)
2. Add pre-commit hooks (validate schema changes)
3. Create migration testing framework

### **Long-Term:**
1. Migration best practices documentation
2. Schema change review process
3. Automated schema validation in CI/CD

---

**📍 Location:** `docs/03-data/PLAN/PLAN_RESCUE-MIGRATION-049-RESTORE-PER-MODE_2025-11-04.md`  
**Purpose:** Emergency rescue plan for failed Option 3 implementation  
**Status:** PLAN - Ready for execution  
**Next:** Execute rescue plan step-by-step

---

*Rescue plan created: 04.11.2025 - Emergency operation to restore per-mode configuration*
