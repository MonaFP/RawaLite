# CRITICAL FIXES REGISTRY

> **NEVER REMOVE OR MODIFY THESE FIXES WITHOUT EXPLICIT APPROVAL**  
> **Erstellt:** 15.10.2025 | **Letzte Aktualisierung:** 17.10.2025 (ROOT_ Migration für KI-Accessibility)  
> **Status:** ABSOLUT KRITISCH - Jede KI-Session muss diese prüfen  
> **Schema:** `ROOT_VALIDATED_REGISTRY-CRITICAL-FIXES_2025-10-17.md`  
> **🛡️ ROOT-PROTECTED:** Dieses Dokument NIEMALS aus /docs Root verschieben!

This registry contains all critical fixes that must be preserved across ALL versions.
Any KI session MUST validate these patterns before making changes.

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

### **FIX-008: Better-sqlite3 ABI Compatibility**
- **File:** `package.json`, `scripts/prebuild-better-sqlite3.cjs`
- **Issue:** ABI mismatch between Node.js and Electron versions
- **Fix Pattern:** Explicit rebuild for Electron ABI
- **Code:**
  ```bash
  # Rebuild for Electron ABI
  npm rebuild better-sqlite3 --runtime=electron --target=25.3.0 --cache=/tmp/.electron-gyp --dist-url=https://electronjs.org/headers
  ```
- **NEVER:** Skip ABI rebuild or use Node.js ABI for Electron
- **Validation:** better-sqlite3 must load successfully in Electron

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

### **FIX-010: Memory Leak Prevention (Database Connections)**
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

---

## 🔍 VALIDATION RULES FOR KI

### **BEFORE ANY FILE EDIT:**
1. **Check if file is in CRITICAL-FIXES-REGISTRY.md**
2. **Verify all required patterns are preserved**
3. **Never remove Promise-based patterns**
4. **Never remove timeout/delay patterns**
5. **Never add duplicate event handlers**

### **BEFORE ANY VERSION BUMP:**
1. **Run:** `pnpm validate:critical-fixes`
2. **Verify:** All fixes are present and functional
3. **Test:** Download verification works
4. **Confirm:** No regression detected

### **FORBIDDEN OPERATIONS:**
- ❌ Removing Promise-based WriteStream completion
- ❌ Removing file system flush delays  
- ❌ Adding duplicate event handlers
- ❌ Changing established port configurations
- ❌ Bypassing pre-release validation

---

## 📊 FIX HISTORY

### **v1.0.13 (Current)**
- ✅ All 15 critical fixes verified and active
- ✅ Validation script implemented: `scripts/validate-critical-fixes.mjs`
- ✅ Pre-commit hooks enforcing fix preservation
- ✅ Documentation updated with explicit patterns

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
2. **Identify which fix was removed**
3. **Restore from this registry**
4. **Run full validation suite**
5. **Test affected functionality**
6. **Document the incident**

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

**Last Updated:** 2025-10-17 (ROOT_ Migration - improved KI accessibility and anti-move protection)
**Maintained By:** GitHub Copilot KI + Development Team
**Validation Script:** `scripts/validate-critical-fixes.mjs`

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