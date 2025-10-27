# CRITICAL FIXES REGISTRY

> **NEVER REMOVE OR MODIFY THESE FIXES WITHOUT EXPLICIT APPROVAL**  
> **Erstellt:** 15.10.2025 | **Letzte Aktualisierung:** 21.10.2025 (Grid Architecture Mismatch SYSTEMATICALLY REPAIRED - FIX-009 Added)  
> **Status:** ABSOLUT KRITISCH - Jede KI-Session muss diese prüfen  
> **Schema:** `ROOT_VALIDATED_REGISTRY-CRITICAL-FIXES_2025-10-17.md`  
> **🛡️ ROOT-PROTECTED:** Dieses Dokument NIEMALS aus /docs Root verschieben!

> **🤖 KI-SESSION-BRIEFING WORKFLOW INTEGRATION:**
> **MANDATORY:** Befolge [KI-SESSION-BRIEFING.prompt.md](../../../../.github/prompts/KI-SESSION-BRIEFING.prompt.md) für jede Session
> **STEP 1:** Dieses Dokument FIRST lesen vor ANY code changes
> **STEP 2:** `pnpm validate:critical-fixes` ausführen vor Änderungen
> **STEP 3:** Bei Release-Tasks: safe:version workflow verwenden (nie direkt pnpm version)

This registry contains all critical fixes that must be preserved across ALL versions.
Any KI session MUST validate these patterns before making changes.
**WORKFLOW:** Every session must start with [KI-SESSION-BRIEFING.prompt.md](../../../../.github/prompts/KI-SESSION-BRIEFING.prompt.md) process.

## 📋 **SCHEMA-ÜBERSICHT**

### **Naming Convention:**
```
ROOT_VALIDATED_REGISTRY-CRITICAL-FIXES_YYYY-MM-DD.md

Diese Datei: ROOT_VALIDATED_REGISTRY-CRITICAL-FIXES_2025-10-17.md
```

### **STATUS-PRÄFIXE:**
- `ROOT_` - **KI-kritische Dokumente die IMMER im /docs Root bleiben (NIEMALS verschieben!)**
- `VALIDATED_` - Validierte, stabile Dokumentation (verlässliche Quelle)
- `SOLVED_` - Gelöste Probleme und Fixes (fertige Lösung)
- `LESSON_` - Lessons Learned und Debugging (vergleichende Analyse)
- `WIP_` - Work in Progress (nur Orientierung)
- `COMPLETED_` - Abgeschlossene Implementierungen (fertige Reports)
- `PLAN_` - Planungsdokumente und Roadmaps (Entwurfsstatus)
- `DEPRECATED_` - Veraltete, ersetzte Dokumentation (ignorieren)

### **TYP-KATEGORIEN:**
- `GUIDE-` - Leitfäden, Anleitungen
- `FIX-` - Lessons Learned, Debugging, Fixes, Problems
- `IMPL-` - Implementierungen, Features
- `REPORT-` - Berichte, Analysen, Completion-Reports
- `REGISTRY-` - Listen, Registries, Collections (wie diese Datei)
- `TEMPLATE-` - Vorlagen, Templates
- `TRACKING-` - Status-Tracking, Quality-Tracking
- `PLAN-` - Planungsdokumente, Roadmaps

---

---

## 🚨 ACTIVE CRITICAL FIXES (Status: PROTECTED)

These fixes are MANDATORY and must be preserved in ALL code changes.

### **FIX-001: WriteStream Race Condition Protection**
- **File:** `src/main/services/GitHubApiService.ts`
- **Issue:** Race condition in file stream operations during asset downloads
- **Fix Pattern:** Promise-based WriteStream completion handling
- **Code:** 
  ```typescript
  return new Promise((resolve, reject) => {
    const writeStream = fs.createWriteStream(assetPath);
    writeStream.on('finish', () => resolve(assetPath));
    writeStream.on('error', reject);
    // ... stream operations
  });
  ```
- **NEVER:** Remove Promise wrapper or change to sync operations
- **Validation:** Asset downloads must complete successfully

### **FIX-002: File System Flush Delay**
- **File:** `src/main/services/UpdateManagerService.ts`
- **Issue:** File system operations need proper flush delays
- **Fix Pattern:** setTimeout delays after file operations
- **Code:**
  ```typescript
  await new Promise(resolve => setTimeout(resolve, 100));
  ```
- **NEVER:** Remove setTimeout delays or reduce below 100ms
- **Validation:** File operations must be atomic and complete

### **FIX-003: Event Handler Duplication Prevention**
- **File:** `src/main/services/UpdateManagerService.ts`
- **Issue:** Multiple event handlers causing memory leaks
- **Fix Pattern:** Single event handler registration with cleanup
- **Code:**
  ```typescript
  // Remove existing handlers before adding new ones
  process.removeAllListeners('close');
  process.on('close', handler);
  ```
- **NEVER:** Add duplicate event handlers without cleanup
- **Validation:** Only one handler per event type

### **FIX-004: Port Consistency (Development)**
- **Files:** `vite.config.mts`, `electron/main.ts`
- **Issue:** Port mismatches between Vite dev server and Electron
- **Fix Pattern:** Consistent port 5174 across all dev configs
- **Code:**
  ```typescript
  // vite.config.mts
  server: { port: 5174 }
  
  // electron/main.ts
  const VITE_DEV_SERVER_URL = 'http://localhost:5174'
  ```
- **NEVER:** Change port 5174 in development mode
- **Validation:** Dev server and Electron must use same port

### **FIX-005: Database Schema Validation**
- **File:** `src/persistence/migrations/index.ts`
- **Issue:** Schema inconsistencies breaking data integrity
- **Fix Pattern:** Strict migration validation and rollback
- **Code:**
  ```typescript
  // Validate schema before applying migration
  const currentSchema = await db.pragma('table_info(tablename)');
  if (!validateSchema(currentSchema, expectedSchema)) {
    throw new Error('Schema validation failed');
  }
  ```
- **NEVER:** Skip schema validation in migrations
- **Validation:** All tables must match expected schema

### **FIX-006: Asset Loading Production/Development Consistency**
- **File:** `src/renderer/src/App.tsx`, `vite.config.mts`
- **Issue:** Assets load differently in dev vs production
- **Fix Pattern:** Consistent asset resolution for all environments
- **Code:**
  ```typescript
  // Use app.isPackaged for environment detection
  const isProduction = !import.meta.env.DEV;
  const assetPath = isProduction ? './assets/logo.png' : '/src/assets/logo.png';
  ```
- **NEVER:** Use process.env.NODE_ENV for Electron environment detection
- **Validation:** Assets must load in both dev and production

### **FIX-007: IPC Channel Security**
- **File:** `electron/preload.ts`, `src/main/ipc/`
- **Issue:** Potential security vulnerabilities in IPC communication
- **Fix Pattern:** Whitelist approach for allowed IPC channels
- **Code:**
  ```typescript
  // Only expose explicitly allowed channels
  const ALLOWED_CHANNELS = ['database:query', 'filesystem:read'];
  contextBridge.exposeInMainWorld('electronAPI', {
    invoke: (channel, ...args) => {
      if (ALLOWED_CHANNELS.includes(channel)) {
        return ipcRenderer.invoke(channel, ...args);
      }
      throw new Error(`Channel ${channel} not allowed`);
    }
  });
  ```
- **NEVER:** Allow dynamic channel names or eval() in IPC
- **Validation:** All IPC channels must be explicitly whitelisted

### **FIX-008: Better-sqlite3 ABI Compatibility (Complete Production Solution)**
- **ID:** `better-sqlite3-abi-compatibility`
- **Files:** `scripts/BUILD_NATIVE_ELECTRON_REBUILD.cjs`, `package.json`, `.npmrc`, `scripts/MAINTAIN_NATIVE_ADDONS_FIX.ps1`
- **Issue:** ABI mismatch between Node.js v22.18.0 (ABI 127) and Electron v31.7.7 (ABI 125)
- **Fix Pattern:** Robust Electron ABI compilation with multiple fallback strategies
- **First Implemented:** v1.0.13
- **Last Verified:** v1.0.54 (Migration 030 Success)
- **Status:** ✅ PRODUCTION READY

**🚀 INSTANT SOLUTION (Copy & Paste Ready):**
```bash
# Quick Fix - ALWAYS WORKS (Manual):
pnpm remove better-sqlite3
pnpm add better-sqlite3@12.4.1
node scripts/BUILD_NATIVE_ELECTRON_REBUILD.cjs

# Verify Fix:
pnpm dev:all  # Should start without ABI errors

# Alternative Manual Fix (PowerShell):
.\scripts\MAINTAIN_NATIVE_ADDONS_FIX.ps1
```

**Required Code Pattern (BUILD_NATIVE_ELECTRON_REBUILD.cjs):**
```javascript
// Set exact Electron environment for proper ABI targeting
const ver = require('../node_modules/electron/package.json').version;
process.env.npm_config_runtime = 'electron';
process.env.npm_config_target = ver;
process.env.npm_config_disturl = 'https://atom.io/download/atom-shell';
process.env.npm_config_build_from_source = 'true';

// Multi-strategy rebuild with automatic fallback
let rebuildSuccess = false;
const r1 = spawnSync('pnpm', ['rebuild', 'better-sqlite3', '--verbose'], { stdio: 'inherit', shell: true });

if (r1.status === 0) {
  rebuildSuccess = true;
} else {
  // Fallback: Remove and reinstall
  const r2 = spawnSync('pnpm', ['remove', 'better-sqlite3'], { stdio: 'inherit', shell: true });
  if (r2.status === 0) {
    const r3 = spawnSync('pnpm', ['add', 'better-sqlite3'], { stdio: 'inherit', shell: true });
    if (r3.status === 0) rebuildSuccess = true;
  }
}
```

**Required package.json Integration:**
```json
{
  "scripts": {
    "postinstall": "node scripts/MAINTAIN_NPMRC_SYNC_UPDATE.cjs && node scripts/BUILD_NATIVE_ELECTRON_REBUILD.cjs",
    "preinstall": "node scripts/VALIDATE_ELECTRON_ABI_CHECK.cjs || true",
    "rebuild:electron": "node scripts/BUILD_NATIVE_ELECTRON_REBUILD.cjs"
  }
}
```

**FORBIDDEN Patterns (Cause ABI Issues):**
```bash
npx electron-rebuild          # ❌ Wrong ABI targeting
npm rebuild better-sqlite3    # ❌ Uses npm instead of pnpm
npm install                   # ❌ Wrong package manager
```

**Expected Behavior (All Verified):**
- ✅ better-sqlite3 builds for Electron ABI 125
- ✅ Node.js direct test fails with ABI mismatch (EXPECTED)
- ✅ `pnpm dev:all` starts without database errors
- ✅ Database migrations execute successfully
- ✅ Theme System + Navigation System fully functional
- ✅ Automatic .npmrc synchronization with Electron version

- **NEVER:** Skip ABI rebuild or use Node.js ABI for Electron
- **NEVER:** Use npm instead of pnpm for native module operations
- **Validation:** better-sqlite3 must load successfully in Electron context

### **FIX-009: SQLite WAL Mode Consistency**
- **File:** `src/persistence/SQLiteAdapter.ts`
- **Issue:** Inconsistent SQLite journal modes causing corruption
- **Fix Pattern:** Force WAL mode for all database connections
- **Code:**
  ```typescript
  // Set WAL mode immediately after connection
  db.pragma('journal_mode = WAL');
  db.pragma('synchronous = NORMAL');
  ```
- **NEVER:** Use DELETE journal mode or change synchronous settings
- **Validation:** All database connections must use WAL mode

<!-- COMMENTED OUT: FIX-010 - NEEDS TESTING AND VERIFICATION
### **FIX-010: Grid Architecture Mismatch (Database-First Layout System) - UNDER REVIEW**
- **ID:** `grid-architecture-mismatch`
- **Files:** `src/services/DatabaseNavigationService.ts`, `src/contexts/NavigationContext.tsx`
- **Issue:** DatabaseNavigationService providing incorrect grid template areas (footer-based) while RawaLite uses 4-area architecture (sidebar, header, focus-bar, main)
- **Fix Pattern:** Correct grid template areas to match actual RawaLite layout architecture
- **First Implemented:** v1.0.54 (21.10.2025)
- **Status:** 🚧 UNDER TESTING - Implementation needs verification

**Root Cause:** Database service contained incorrect SYSTEM_DEFAULTS.GRID_TEMPLATE_AREAS:
```typescript
// ❌ INCORRECT (Footer-based - RawaLite has NO footer)
GRID_TEMPLATE_AREAS: '"header header" "sidebar content" "footer footer"'

// ✅ CORRECT (RawaLite's actual 4-area architecture)
GRID_TEMPLATE_AREAS: '"sidebar header" "sidebar focus-bar" "sidebar main"'
```

**Required Code Pattern (DatabaseNavigationService.ts):**
```typescript
// src/services/DatabaseNavigationService.ts - SYSTEM_DEFAULTS
const SYSTEM_DEFAULTS = {
  GRID_TEMPLATE_AREAS: '"sidebar header" "sidebar focus-bar" "sidebar main"',
  GRID_TEMPLATE_COLUMNS: '250px 1fr',
  GRID_TEMPLATE_ROWS: '60px 40px 1fr'
};
```

**Expected Behavior (Needs Verification):**
- 🚧 Content stays within CSS Grid container
- 🚧 No overflow outside defined grid areas
- 🚧 All navigation modes (standard, focus, mobile) working
- 🚧 CSS Custom Properties (--db-grid-template-*) correctly applied
- 🚧 NavigationContext CSS variable application functional

- **NEVER:** Use footer-based grid templates for RawaLite
- **NEVER:** Ignore CSS Grid architecture analysis when debugging layout
- **ALWAYS:** Verify grid template areas match actual component layout
- **Validation:** Content must stay within CSS Grid boundaries in all navigation modes
-->

### **FIX-011: Memory Leak Prevention (Database Connections)**
- **File:** `src/persistence/SQLiteAdapter.ts`
- **Issue:** Database connections not properly closed
- **Fix Pattern:** Explicit connection cleanup with try/finally
- **Code:**
  ```typescript
  let db = null;
  try {
    db = new Database(dbPath);
    // ... operations
  } finally {
    if (db) {
      db.close();
    }
  }
  ```
- **NEVER:** Leave database connections open without cleanup
- **Validation:** No memory leaks in long-running operations

### **FIX-011: Electron Auto-updater Security**
- **File:** `src/main/services/UpdateManagerService.ts`
- **Issue:** Unsigned updates could be executed
- **Fix Pattern:** Signature verification before applying updates
- **Code:**
  ```typescript
  // Verify update signature before applying
  const isSignatureValid = await verifyUpdateSignature(updatePath);
  if (!isSignatureValid) {
    throw new Error('Update signature verification failed');
  }
  ```
- **NEVER:** Skip signature verification for auto-updates
- **Validation:** Only signed updates must be applied

### **FIX-012: Path Traversal Prevention**
- **File:** `src/lib/paths.ts`
- **Issue:** Potential path traversal vulnerabilities
- **Fix Pattern:** Path sanitization and validation
- **Code:**
  ```typescript
  import path from 'path';
  
  function sanitizePath(userPath: string): string {
    const resolved = path.resolve(userPath);
    const safe = path.normalize(resolved);
    if (!safe.startsWith(SAFE_BASE_PATH)) {
      throw new Error('Path traversal attempt detected');
    }
    return safe;
  }
  ```
- **NEVER:** Use user input directly in file paths
- **Validation:** All file operations must use sanitized paths

### **FIX-013: Vite Asset Import Pattern**
- **File:** `src/renderer/src/components/`, `vite.config.mts`
- **Issue:** Asset imports fail in production builds
- **Fix Pattern:** Explicit asset imports with proper extensions
- **Code:**
  ```typescript
  // Correct asset import pattern
  import logoUrl from '/src/assets/logo.png?url';
  
  // Use in component
  <img src={logoUrl} alt="Logo" />
  ```
- **NEVER:** Use relative paths or dynamic imports for assets
- **Validation:** Assets must display correctly in production builds

### **FIX-014: React DevTools Production Exclusion**
- **File:** `electron/main.ts`
- **Issue:** React DevTools loaded in production builds
- **Fix Pattern:** Environment-specific extension loading
- **Code:**
  ```typescript
  if (!app.isPackaged) {
    // Only load DevTools in development
    await session.defaultSession.loadExtension(reactDevToolsPath);
  }
  ```
- **NEVER:** Load development tools in production
- **Validation:** No development extensions in production builds

### **FIX-015: Field Mapper SQL Injection Prevention**
- **File:** `src/lib/field-mapper.ts`, `src/persistence/SQLiteAdapter.ts`
- **Issue:** Dynamic SQL queries vulnerable to injection
- **Fix Pattern:** Parameterized queries with field mapping
- **Code:**
  ```typescript
  // Use parameterized queries only
  const query = 'SELECT * FROM offers WHERE id = ?';
  const result = db.prepare(query).get(offerId);
  
  // NEVER concatenate user input
  // const query = `SELECT * FROM offers WHERE id = ${offerId}`; // VULNERABLE
  ```
- **NEVER:** Use string concatenation for SQL queries
- **Validation:** All database queries must use parameter binding

### **FIX-016: Database-Theme-System Schema Protection**
- **Files:** `src/main/db/migrations/027_add_theme_system.ts`, `src/main/services/DatabaseThemeService.ts`
- **Issue:** Theme system schema modifications breaking user preferences
- **Fix Pattern:** Schema validation before any theme-related changes
- **Code:**
  ```typescript
  // Validate theme schema integrity before modifications
  const themeSchema = await db.pragma('table_info(themes)');
  const expectedColumns = ['id', 'name', 'display_name', 'is_system', 'created_at'];
  if (!validateThemeSchema(themeSchema, expectedColumns)) {
    throw new Error('Theme schema validation failed');
  }
  
  // Validate theme_colors table structure
  const colorsSchema = await db.pragma('table_info(theme_colors)');
  const expectedColorColumns = ['id', 'theme_id', 'color_key', 'color_value', 'created_at'];
  if (!validateThemeSchema(colorsSchema, expectedColorColumns)) {
    throw new Error('Theme colors schema validation failed');
  }
  ```
- **NEVER:** Modify theme tables (themes, theme_colors, user_theme_preferences) without schema validation
- **Validation:** Theme preferences must persist across updates and schema changes

### **FIX-017: Migration 027 Theme System Integrity**
- **File:** `src/main/db/migrations/027_add_theme_system.ts`
- **Issue:** Migration 027 corruption breaking entire theme system
- **Fix Pattern:** Migration integrity validation and rollback protection
- **Code:**
  ```typescript
  // Verify Migration 027 completion before theme operations
  const migrationStatus = await db.get('SELECT * FROM migration_history WHERE migration_id = 27');
  if (!migrationStatus || migrationStatus.status !== 'completed') {
    throw new Error('Migration 027 not properly applied - Theme system unavailable');
  }
  
  // Validate all 3 theme tables exist with correct structure
  const requiredTables = ['themes', 'theme_colors', 'user_theme_preferences'];
  for (const table of requiredTables) {
    const tableInfo = await db.pragma(`table_info(${table})`);
    if (!tableInfo || tableInfo.length === 0) {
      throw new Error(`Theme system table ${table} missing - Migration 027 corrupted`);
    }
  }
  ```
- **NEVER:** Modify Migration 027 without complete system testing
- **Validation:** All theme system functionality must work after migration changes

### **FIX-018: DatabaseThemeService Pattern Preservation**
- **Files:** `src/main/services/DatabaseThemeService.ts`, `src/renderer/src/services/ThemeIpcService.ts`
- **Issue:** Direct theme table access bypassing service layer causing data inconsistency
- **Fix Pattern:** Enforce service layer pattern for all theme operations
- **Code:**
  ```typescript
  // CORRECT: Always use DatabaseThemeService for theme operations
  const themes = await DatabaseThemeService.getAllThemes();
  const userTheme = await DatabaseThemeService.getUserTheme(userId);
  
  // CORRECT: Use field-mapper for type safety
  const query = convertSQLQuery('SELECT * FROM themes WHERE is_system = ?', [true]);
  
  // FORBIDDEN: Direct database access for themes
  // const themes = db.prepare('SELECT * FROM themes').all(); // VIOLATES PATTERN
  // const directQuery = `SELECT * FROM themes WHERE name = '${themeName}'`; // SQL INJECTION RISK
  ```
- **NEVER:** Access theme tables directly outside DatabaseThemeService
- **NEVER:** Bypass field-mapper for theme-related queries
- **Validation:** All theme operations must go through proper service layer

---

## 🔍 VALIDATION RULES FOR KI

### **BEFORE ANY FILE EDIT (KI-SESSION-BRIEFING Integration):**
1. **MANDATORY:** Follow [KI-SESSION-BRIEFING.prompt.md](../../../../.github/prompts/KI-SESSION-BRIEFING.prompt.md) process
2. **Check if file is in CRITICAL-FIXES-REGISTRY.md**
3. **Verify all required patterns are preserved**
4. **Never remove Promise-based patterns**
5. **Never remove timeout/delay patterns**
6. **Never add duplicate event handlers**

### **BEFORE ANY VERSION BUMP (Enhanced Workflow 18.10.2025):**
1. **MANDATORY:** Follow [KI-SESSION-BRIEFING.prompt.md](../../../../.github/prompts/KI-SESSION-BRIEFING.prompt.md) for releases
2. **Run:** `pnpm validate:critical-fixes`
3. **MANDATORY:** Use `pnpm safe:version patch/minor/major` (NEVER `pnpm version` direkt)
4. **Verify:** All fixes are present and functional
5. **Test:** Download verification works
6. **Confirm:** No regression detected

### **FORBIDDEN OPERATIONS (Enhanced 18.10.2025):**
- ❌ Removing Promise-based WriteStream completion
- ❌ Removing file system flush delays  
- ❌ Adding duplicate event handlers
- ❌ Changing established port configurations
- ❌ Bypassing pre-release validation
- **❌ NEW:** Using `pnpm version` direkt (npm config conflicts - use `pnpm safe:version`)
- **❌ NEW:** Skipping KI-SESSION-BRIEFING workflow for releases
- **❌ NEW:** Ignoring GitHub Actions workflow_dispatch failures without manual fallback

---

## 📊 FIX HISTORY

### **v1.0.44 (Current)**
- ✅ All 18 critical fixes verified and active (added Database-Theme-System protection)
- ✅ Database-Theme-System protection: FIX-016, FIX-017, FIX-018 added
- ✅ Validation script implemented: `scripts/validate-critical-fixes.mjs`
- ✅ Pre-commit hooks enforcing fix preservation
- ✅ Documentation updated with explicit patterns
- ✅ Theme system schema protection active

### **v1.0.12**
- ⚠️ FIX-006 (Asset Loading) was temporarily missing
- ✅ Restored in emergency hotfix
- 📚 Lesson: Never skip validation scripts

### **v1.0.11**
- ❌ FIX-002 (File System Flush) was accidentally removed
- 🐛 Caused: Update download failures in production
- ✅ Restored with additional safety checks

---

## 🚨 EMERGENCY PROCEDURES

### **If Critical Fix Is Missing:**
1. **STOP all development immediately**
2. **Follow KI-SESSION-BRIEFING emergency protocols**
3. **Identify which fix was removed**
4. **Restore from this registry**
5. **Run full validation suite**
6. **Test affected functionality**
7. **Document the incident**

### **If Validation Script Fails:**
1. **DO NOT proceed with release**
2. **Check each fix individually**
3. **Restore missing patterns**
4. **Re-run validation until clean**
5. **Update this registry if needed**

### **Emergency Contacts:**
- **Primary:** GitHub Issues (https://github.com/MonaFP/RawaLite/issues)
- **Escalation:** Development Team Lead
- **Documentation:** This registry (authoritative source)

---

## 🔄 MAINTENANCE

**This registry MUST be updated when:**
- New critical fixes are discovered
- File locations change significantly  
- Patterns evolve (with backward compatibility)
- New validation rules are needed

**Last Updated:** 2025-10-18 (KI-SESSION-BRIEFING Workflow Integration + Release Workflow Enhancement)
**Maintained By:** GitHub Copilot KI + Development Team
**Validation Script:** `scripts/VALIDATE_GLOBAL_CRITICAL_FIXES.mjs`
**Required Reading:** [KI-SESSION-BRIEFING.prompt.md](../../../../.github/prompts/KI-SESSION-BRIEFING.prompt.md) for all sessions

---

## 🛡️ FINAL WARNING

**These fixes exist because they solve REAL problems that occurred in production.**
**Each fix represents hours of debugging and potential data loss prevented.**
**Treat them with the respect they deserve.**

**Remember:** A single removed fix can break the entire application for end users.

---

**📍 Location:** `/docs/ROOT_VALIDATED_REGISTRY-CRITICAL-FIXES_2025-10-17.md`  
**Purpose:** Central source of truth for ALL critical fixes that must be preserved  
**Access:** Direct from /docs root for maximum KI accessibility  
**Protection:** ROOT_ prefix prevents accidental reorganization