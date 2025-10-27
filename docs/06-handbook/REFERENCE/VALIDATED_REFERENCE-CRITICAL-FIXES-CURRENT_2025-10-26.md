# 🚨 Critical Fixes - Current Session Reference

> **Erstellt:** 26.10.2025 | **Letzte Aktualisierung:** 27.10.2025 (KI-PRÄFIX Schema compliance)  
> **Status:** Live Reference | **Typ:** Session-Critical Info  
> **Schema:** `VALIDATED_REFERENCE-CRITICAL-FIXES-CURRENT_2025-10-26.md`  
> **Source:** ROOT_VALIDATED_REGISTRY-CRITICAL-FIXES_2025-10-17.md

## 📋 **SCHEMA-ÜBERSICHT nach KI-PRÄFIX-ERKENNUNGSREGELN**

### **STATUS-PRÄFIX:** `VALIDATED_`
- **Bedeutung:** Validierte, stabile Dokumentation (verlässliche Quelle)
- **KI-Verhalten:** Behandelt als verlässliche Quelle für Critical Fixes

### **TYP-KATEGORIE:** `REFERENCE-`
- **Verwendung:** Session-start critical fixes check für KI
- **Purpose:** Live reference für kritische Bug-Fixes und Patterns

> **⚠️ LIVE REFERENCE - Immer aktuell halten**  
> **Zweck:** Session-start critical fixes check für KI  
> **Update Pattern:** Automatisch aus ROOT-Registry synchronisiert

## 🎯 **QUICK SESSION-START CHECKLIST**

**MANDATORY vor jeder Code-Änderung:**
- [ ] ✅ `pnpm validate:critical-fixes` ausführen
- [ ] 🔍 Betroffene Dateien in FIX-Liste prüfen
- [ ] 🛡️ Critical patterns identifizieren
- [ ] ⚠️ Patterns NIEMALS entfernen oder modifizieren

## 🚨 **ACTIVE CRITICAL FIXES (Status: PROTECTED)**

### **Top-Priority Session-Killer Prevention:**

#### **FIX-001: WriteStream Race Condition** 
- **File:** `src/main/services/GitHubApiService.ts`
- **Critical Pattern:** Promise-based WriteStream completion
- **NEVER:** Remove Promise wrapper
- **Quick Test:** Asset downloads must complete

#### **FIX-002: File System Flush Delay**
- **File:** `src/main/services/UpdateManagerService.ts` 
- **Critical Pattern:** `setTimeout(resolve, 100)` after file ops
- **NEVER:** Remove delays or reduce below 100ms
- **Quick Test:** File operations must be atomic

#### **FIX-003: Event Handler Duplication Prevention**
- **File:** `src/main/services/UpdateManagerService.ts`
- **Critical Pattern:** `removeAllListeners()` before adding
- **NEVER:** Add handlers without cleanup
- **Quick Test:** Only one handler per event

#### **FIX-004: Port Consistency (Dev)**
- **Files:** `vite.config.mts`, `electron/main.ts`
- **Critical Pattern:** Port 5174 across all dev configs
- **NEVER:** Change dev port 5174
- **Quick Test:** `pnpm dev:all` must start clean

#### **FIX-008: better-sqlite3 ABI Compatibility** ⭐
- **Files:** `scripts/BUILD_NATIVE_ELECTRON_REBUILD.cjs`
- **Critical Pattern:** Electron ABI 125 targeting
- **Emergency Fix:** `pnpm remove better-sqlite3 && pnpm add better-sqlite3@12.4.1 && node scripts/BUILD_NATIVE_ELECTRON_REBUILD.cjs`
- **Quick Test:** Database operations work in Electron

#### **FIX-015: Field Mapper SQL Injection Prevention**
- **File:** `src/lib/field-mapper.ts`
- **Critical Pattern:** Parameterized queries only
- **NEVER:** String concatenation in SQL
- **Quick Test:** No direct user input in queries

### **Database-Theme-System Protection (FIX-016/017/018):**

#### **FIX-016: Schema Protection**
- **Files:** `src/main/db/migrations/027_add_theme_system.ts`
- **Critical Pattern:** Schema validation before modifications
- **NEVER:** Modify theme tables without validation
- **Quick Test:** Theme preferences persist

#### **FIX-017: Migration 027 Integrity**
- **Pattern:** Migration completion validation
- **NEVER:** Modify Migration 027 without testing
- **Quick Test:** All 3 theme tables exist and functional

#### **FIX-018: Service Layer Pattern**
- **Files:** `src/main/services/DatabaseThemeService.ts`
- **Critical Pattern:** Always use service layer
- **NEVER:** Direct theme table access
- **Quick Test:** Theme operations via service only

## ⚡ **INSTANT EMERGENCY FIXES**

### **ABI Problem (Most Common):**
```bash
# INSTANT SOLUTION - Copy & Paste:
pnpm remove better-sqlite3
pnpm add better-sqlite3@12.4.1
node scripts/BUILD_NATIVE_ELECTRON_REBUILD.cjs

# Verify:
pnpm dev:all  # Should start without errors
```

### **Development Port Issues:**
```bash
# Check current dev setup:
grep -r "5174" vite.config.mts electron/main.ts

# If wrong port found - CRITICAL ERROR - DO NOT CHANGE!
# Port 5174 is MANDATORY for dev mode
```

### **Theme System Broken:**
```bash
# Validate Migration 027:
pnpm analyze:database-schema | grep -E "(themes|theme_colors|user_theme_preferences)"

# If tables missing - Migration 027 corrupted
# STOP immediately - Contact development team
```

## 🚫 **FORBIDDEN OPERATIONS (Session-Killers)**

- ❌ Remove Promise wrapper from WriteStreams
- ❌ Remove file system delays (< 100ms)
- ❌ Add duplicate event handlers
- ❌ Change port 5174 in development
- ❌ Use `pnpm version` directly (use `pnpm safe:version`)
- ❌ Skip validation scripts before releases
- ❌ Direct theme table access outside service
- ❌ String concatenation in SQL queries
- ❌ Modify Migration 027 without team approval

## 🔍 **PRE-SESSION VALIDATION**

```bash
# MANDATORY Session-Start Commands:
pnpm validate:critical-fixes        # Must be green ✅
pnpm validate:docs-structure        # Documentation check
pnpm analyze:database-schema        # Database integrity

# If ANY command fails - DO NOT PROCEED
# Fix issues first, then continue session
```

## 📋 **SESSION SUCCESS CRITERIA**

- [ ] ✅ All critical fixes preserved
- [ ] ✅ Validation scripts pass
- [ ] ✅ No forbidden patterns introduced
- [ ] ✅ Database schema integrity maintained
- [ ] ✅ Development environment stable
- [ ] ✅ No ABI conflicts detected

## 🔄 **SYNC STATUS**

- **Source:** ROOT_VALIDATED_REGISTRY-CRITICAL-FIXES_2025-10-17.md
- **Last Sync:** 26.10.2025
- **Fix Count:** 18 active critical fixes
- **Validation:** scripts/VALIDATE_GLOBAL_CRITICAL_FIXES.mjs
- **Status:** ✅ All fixes active and verified

---

**📍 Location:** `docs/06-handbook/REFERENCE/VALIDATED_REFERENCE-CRITICAL-FIXES-CURRENT_2025-10-26.md`  
**Purpose:** Live session-start reference für critical fix prevention  
**Access:** 06-handbook quick navigation system  
**Update:** Maintain sync with ROOT-Registry critical fixes (archived)