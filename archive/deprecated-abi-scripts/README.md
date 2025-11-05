# DEPRECATED ABI-Problematic Scripts Archive

> **Erstellt:** 22.10.2025 | **Status:** DEPRECATED Scripts Archive  
> **Schema:** `DEPRECATED_REGISTRY-ABI-PROBLEMATIC-SCRIPTS_2025-10-22.md`  
> **Zweck:** Sammlung aller Scripts die ABI-Konflikte zwischen Node.js und Electron verursachen

## 🚨 **ABI-Problem Erklärung**

**Root Cause:**
- better-sqlite3 ist für Electron ABI 125 kompiliert
- Node.js verwendet ABI 127
- .mjs Scripts mit `import Database from 'better-sqlite3'` scheitern im Node.js-Kontext

**Sichere Alternative verfügbar:**
- ✅ `tests/debug/debug-db-sqljs.mjs` - Verwendet sql.js (ABI-unabhängig)
- ✅ sql.js bereits installiert: `"sql.js": "^1.13.0"`

## 📁 **Archivierte Scripts**

**Diese Scripts wurden verschoben wegen ABI-Konflikten:**

### **Root-Level Scripts (DEPRECATED):**
- `DEPRECATED_check-migration-status.mjs` - ❌ Node.js ABI 127 vs Electron ABI 125
- `DEPRECATED_inspect-db-simple.mjs` - ❌ Node.js ABI 127 vs Electron ABI 125  
- `DEPRECATED_inspect-real-db.mjs` - ❌ Node.js ABI 127 vs Electron ABI 125
- `DEPRECATED_test-header-height-fix.mjs` - ❌ Node.js ABI 127 vs Electron ABI 125

### **Tests Debug Scripts (DEPRECATED):**
- `DEPRECATED_debug-db.mjs` - ❌ Node.js ABI 127 vs Electron ABI 125
- `DEPRECATED_debug-db-alt.mjs` - ❌ Node.js ABI 127 vs Electron ABI 125
- `DEPRECATED_debug-db-backup.mjs` - ❌ Node.js ABI 127 vs Electron ABI 125

## ✅ **Sichere Ersatz-Workflows**

**Statt ABI-problematischer Scripts verwenden:**

### **Database Inspection (ABI-Safe):**
```bash
# ✅ VERWENDE DIESE SICHERE ALTERNATIVE:
node tests/debug/debug-db-sqljs.mjs

# ❌ NICHT MEHR VERWENDEN (ABI-Konflikt):
# node inspect-db-simple.mjs
# node check-migration-status.mjs
# node test-header-height-fix.mjs
```

### **Development Workflow (Electron-Context):**
```bash
# ✅ Für Write-Operationen in Electron-Context:
pnpm dev:quick
# Dann in der Anwendung arbeiten
```

### **ABI Fix (bei Bedarf):**
```bash
# ✅ Quick Fix aus ROOT_VALIDATED_GUIDE-KI-INSTRUCTIONS:
pnpm remove better-sqlite3
pnpm add better-sqlite3@12.4.1
node scripts/BUILD_NATIVE_ELECTRON_REBUILD.cjs

# Verifikation:
pnpm dev:quick  # Muss ohne ABI-Errors starten
```

## 🔄 **Migrationsstrategie**

**Wenn ABI-problematische Scripts verwendet werden sollen:**

1. **Konvertiere zu sql.js (Read-Only):**
   ```javascript
   // ❌ Problematisch:
   import Database from 'better-sqlite3';
   const db = new Database(dbPath);
   
   // ✅ ABI-Safe:
   import { createRequire } from 'node:module';
   const requireModule = createRequire(import.meta.url);
   const initSqlJs = requireModule('sql.js');
   const SQL = await initSqlJs();
   const filebuffer = fs.readFileSync(dbPath);
   const db = new SQL.Database(filebuffer);
   ```

2. **Oder: Verwende Electron-Context:**
   - Write-Operationen nur über die Hauptanwendung
   - IPC-Calls für Database-Operationen
   - Tests über Electron Test Runner

## 📊 **Archivierungs-Statistik**

- **Total archivierte Scripts:** 7
- **Root-Level:** 4 Scripts
- **Tests/Debug:** 3 Scripts
- **Sichere Alternative verfügbar:** tests/debug/debug-db-sqljs.mjs
- **ABI-Fix dokumentiert:** ROOT_VALIDATED_REGISTRY-CRITICAL-FIXES_2025-10-17.md (FIX-008)

---

**📍 Location:** `/archive/deprecated-abi-scripts/`  
**Purpose:** Safe archival of ABI-problematic scripts with migration guidance  
**Alternative:** Use sql.js-based tools or Electron context for database operations  
**Documentation:** See FIX-008 in Critical Fixes Registry

*Erstellt: 2025-10-22 - ABI-problematische Scripts systematisch archiviert*