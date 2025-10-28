# 🚫 Project Core Rules - Unverhandelbare Regeln

> **Erstellt:** 26.10.2025 | **Letzte Aktualisierung:** 27.10.2025 (KI-AUTO-DETECTION SYSTEM Integration)  
> **Status:** Reference | **Typ:** Core Project Rules  
> **Schema:** `VALIDATED_REFERENCE-PROJECT-CORE-RULES_2025-10-26.md`  
> **Source:** Original VALIDATED_TEMPLATE-CODING-RULES_2025-10-26.md → Reference Content

## 🤖 **KI-AUTO-DETECTION SYSTEM**

**🎯 STATUS DETECTION KEYWORDS:**
- `Core Project Rules` → **REFERENCE-CRITICAL** - Unverhandelbare Projektregeln
- `Reference` → **STABLE REFERENCE** - Verlässliche KI-Orientierung  
- `Unverhandelbare Regeln` → **NON-NEGOTIABLE** - Absolute Einhaltung erforderlich
- `session-kritische Referenz` → **SESSION-ESSENTIAL** - Für jede KI-Session erforderlich

**📖 TEMPLATE SOURCE:** [VALIDATED_TEMPLATE-KI-AUTO-DETECTION-SYSTEM_2025-10-26.md](../TEMPLATE/VALIDATED_TEMPLATE-KI-AUTO-DETECTION-SYSTEM_2025-10-26.md)  
**🔄 AUTO-UPDATE TRIGGER:** Core rules änderungen, neue Projektregeln, Critical-Fixes Updates  
**🤖 KI-VERHALTENSREGELN (AUTO-AKTIV basierend auf Status):**
- ✅ **REFERENCE-PRIORITY:** Nutze als primäre Regel-Quelle bei allen Code-Änderungen
- ✅ **COMPLIANCE-CHECK:** Überprüfe alle Änderungen gegen diese Regeln
- ✅ **VIOLATION-PREVENTION:** Stoppe bei Regelverletzungen sofort
- ❌ **FORBIDDEN:** Diese Regeln brechen oder umgehen

## 📋 **SCHEMA-ÜBERSICHT nach KI-PRÄFIX-ERKENNUNGSREGELN**

### **STATUS-PRÄFIX:** `VALIDATED_`
- **Bedeutung:** Validierte, stabile Dokumentation (verlässliche Quelle)
- **KI-Verhalten:** Behandelt als verlässliche Quelle für Core Project Rules

### **TYP-KATEGORIE:** `REFERENCE-`
- **Verwendung:** Core project rules als session-kritische Referenz
- **Purpose:** Unverhandelbare Projektregeln für KI-Sessions

> **🎯 QUICK REFERENCE - Unveränderliche Projektregeln**  
> **Zweck:** Core project rules als session-kritische Referenz  
> **Usage:** Read-only reference für jede Session  
> **Current Version:** v1.0.63 (verified 27.10.2025)

## 🚨 **CORE PROJECT RULES (NICHT VERHANDELBAR)**

### **📦 Package Manager:**
- ✅ **ONLY PNPM** - never npm or yarn
- ✅ Use `pnpm safe:version patch/minor/major` - NEVER `pnpm version` directly

### **🗂️ Paths System:**
- ✅ **Renderer Process:** Only via `src/lib/paths.ts` (PATHS)
- ✅ **Main Process:** May use `app.getPath()` (native Electron APIs)
- ✅ **IPC Bridge:** `electron/ipc/paths.ts` for Renderer-Main communication
- ❌ **FORBIDDEN:** Direct `app.getPath()` in Renderer Process

### **🗄️ Database & Persistence:**
- ✅ **Primary:** SQLite (better-sqlite3) - Native module for performance
- ✅ **Entry Point:** `src/persistence/index.ts`
- ✅ **ALWAYS:** Use field-mapper for SQL queries (`convertSQLQuery()`)
- ✅ **ALWAYS:** Use DatabaseThemeService for theme operations
- ❌ **FORBIDDEN:** Direct imports `SQLiteAdapter`/`DexieAdapter`
- ❌ **FORBIDDEN:** Hardcoded snake_case SQL
- ❌ **FORBIDDEN:** String concatenation in SQL queries

### **⚡ Environment Detection:**
- ✅ **Electron:** `!app.isPackaged` for environment detection
- ❌ **FORBIDDEN:** `process.env.NODE_ENV` in Electron context

### **🔒 External Links & Security:**
- ❌ **FORBIDDEN:** `shell.openExternal`, external links, `window.open`, `target="_blank"`
- ✅ **All in-app** - no external navigation

### **🔧 ABI & Native Modules:**
- ✅ **Emergency Fix:** `pnpm remove better-sqlite3 && pnpm add better-sqlite3@12.4.1 && node scripts/BUILD_NATIVE_ELECTRON_REBUILD.cjs`
- ✅ **Before dev start:** Stop all processes: `taskkill /F /IM node.exe && taskkill /F /IM electron.exe`

### **🛡️ CRITICAL FIX PATTERNS (NEVER REMOVE):**
- ✅ Promise-based WriteStream completion patterns
- ✅ File system flush delays (≥100ms)
- ✅ Event handler cleanup before adding new ones
- ✅ Port 5174 consistency in development
- ✅ Theme system schema validation
- ✅ Migration 027 integrity protection

## 🚫 **ANTI-PATTERNS QUICK REFERENCE**

### **NEVER DO (Session Killers):**
❌ Use npm or yarn commands  
❌ Direct app.getPath() in Renderer Process  
❌ External links or shell.openExternal  
❌ Hardcoded SQL strings without field-mapper  
❌ Direct theme table access outside service  
❌ Remove Promise-based WriteStream patterns  
❌ Skip validation scripts before releases  
❌ Change port 5174 in development  
❌ Use pnpm version directly (use pnpm safe:version)  
❌ String concatenation in SQL queries  
❌ Modify Migration 027 without team approval  

## 🎯 **VALIDATION COMMANDS**

```bash
# Vor jeder Code-Änderung:
pnpm validate:critical-fixes

# Vor Documentation-Änderungen:
pnpm validate:docs-structure

# Vor Releases:
pnpm validate:critical-fixes && pnpm validate:docs-structure

# Sichere Version-Befehle:
pnpm safe:version patch  # MANDATORY - nie pnpm version direkt!  
pnpm safe:dist
```

---

**📍 Location:** `docs/06-handbook/REFERENCE/VALIDATED_REFERENCE-PROJECT-CORE-RULES_2025-10-26.md`  
**Purpose:** Read-only reference für unveränderliche Projektregeln  
**Access:** 06-handbook reference system  
**Related:** 
- [Filesystem Paths Patterns](VALIDATED_REFERENCE-FILESYSTEM-PATHS-PATTERNS_2025-10-26.md) (Code-Implementierung)
- [Documentation Paths](VALIDATED_REFERENCE-DOCUMENTATION-PATHS_2025-10-26.md) (Dokumentations-Navigation)
- [Database Schema](VALIDATED_REFERENCE-DATABASE-SCHEMA-CURRENT_2025-10-26.md)
- [Critical Fixes](VALIDATED_REFERENCE-CRITICAL-FIXES-CURRENT_2025-10-26.md)