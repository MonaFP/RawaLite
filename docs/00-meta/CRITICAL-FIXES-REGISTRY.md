# CRITICAL FIXES REGISTRY

**NEVER REMOVE OR MODIFY THESE FIXES WITHOUT EXPLICIT APPROVAL**

This registry contains all critical fixes that must be preserved across ALL versions.
Any KI session MUST validate these patterns before making changes.

---

## 🚨 ACTIVE CRITICAL FIXES (Status: PROTECTED)

### **FIX-001: WriteStream Race Condition**
- **ID:** `writestream-race-condition`
- **File:** `src/main/services/GitHubApiService.ts`
- **Pattern:** Promise-based `writeStream.end()` completion
- **Location:** ~Line 156 in `downloadAsset()` method
- **First Implemented:** v1.0.11
- **Last Verified:** v1.0.13
- **Status:** ✅ ACTIVE

**Required Code Pattern:**
```typescript
// Ensure WriteStream is properly closed with Promise-based completion
await new Promise<void>((resolve, reject) => {
  writeStream.end((error?: Error) => {
    if (error) {
      reject(error);
    } else {
      resolve();
    }
  });
});
```

**FORBIDDEN Pattern:**
```typescript
writeStream.end(); // ❌ RACE CONDITION - NEVER USE
```

---

### **FIX-002: File System Flush Delay**
- **ID:** `file-system-flush-delay`
- **File:** `src/main/services/UpdateManagerService.ts`
- **Pattern:** 100ms delay before `fs.stat()` in `verifyDownload()`
- **Location:** ~Line 488 in `verifyDownload()` method
- **First Implemented:** v1.0.11
- **Last Verified:** v1.0.13
- **Status:** ✅ ACTIVE

**Required Code Pattern:**
```typescript
// Wait for file system to flush WriteStream to disk
// This prevents race condition between WriteStream.end() and fs.stat()
await new Promise(resolve => setTimeout(resolve, 100));
debugLog('UpdateManagerService', 'file_system_flush_delay_complete', { delayMs: 100 });

const stats = await fs.stat(filePath);
```

**FORBIDDEN Pattern:**
```typescript
const stats = await fs.stat(filePath); // ❌ WITHOUT DELAY - RACE CONDITION
```

---

### **FIX-003: Installation Event Handler Race Condition**
- **ID:** `installation-event-handler-race`
- **File:** `src/main/services/UpdateManagerService.ts`
- **Pattern:** Single `close` event handler with timeout cleanup
- **Location:** ~Line 583 in `runInstaller()` method
- **First Implemented:** v1.0.12
- **Last Verified:** v1.0.13
- **Status:** ✅ ACTIVE

**Required Code Pattern:**
```typescript
process.on('close', (code) => {
  clearTimeout(timeout); // Cleanup first
  if (code === 0) {
    resolve();
  } else {
    reject(new Error(`Installation failed with exit code ${code}: ${stderr}`));
  }
});
```

**FORBIDDEN Pattern:**
```typescript
process.on('close', (code) => { /* handler 1 */ });
// ... other code ...
process.on('close', () => clearTimeout(timeout)); // ❌ DOUBLE HANDLER
```

---

### **FIX-004: Port Consistency**
- **ID:** `port-consistency-5174`
- **Files:** `vite.config.mts`, `electron/main.ts`
- **Pattern:** Unified port 5174 for dev environment
- **Location:** vite.config.mts line 20, main.ts line 33
- **First Implemented:** v1.0.12
- **Last Verified:** v1.0.13
- **Status:** ✅ ACTIVE

**Required Code Pattern:**
```typescript
// vite.config.mts
server: { port: 5174 },

// electron/main.ts
win.loadURL('http://localhost:5174')
```

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

| Version | WriteStream Fix | File Flush Fix | Event Handler Fix | Port Fix | Status |
|---------|----------------|----------------|-------------------|----------|---------|
| v1.0.11 | ✅ Added | ✅ Added | ❌ Missing | ❌ Missing | Partial |
| v1.0.12 | ❌ LOST | ❌ LOST | ✅ Added | ✅ Added | Regression |
| v1.0.13 | ✅ Restored | ✅ Restored | ✅ Present | ✅ Present | Complete |

---

## 🚨 EMERGENCY PROCEDURES

### **If Critical Fix Lost:**
1. **STOP** all development immediately
2. **Identify** when fix was lost (git diff)
3. **Re-implement** exact pattern from this registry
4. **Test** functionality thoroughly
5. **Update** validation script if needed

### **If Registry Becomes Outdated:**
1. **Audit** all listed files against current code
2. **Update** line numbers and patterns
3. **Test** validation script
4. **Document** any changes made

---

## 🔄 MAINTENANCE

**This registry MUST be updated when:**
- New critical fixes are discovered
- File locations change significantly  
- Patterns evolve (with backward compatibility)
- New validation rules are needed

**Last Updated:** 2025-10-03
**Maintained By:** GitHub Copilot KI + Development Team
**Validation Script:** `scripts/validate-critical-fixes.mjs`