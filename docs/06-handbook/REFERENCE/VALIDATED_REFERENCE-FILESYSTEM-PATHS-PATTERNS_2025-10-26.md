# 🗂️ Filesystem Paths - Code Implementation Patterns

> **Erstellt:** 26.10.2025 | **Letzte Aktualisierung:** 27.10.2025 (KI-PRÄFIX Schema compliance)  
> **Status:** Reference | **Typ:** Code Implementation Patterns  
> **Schema:** `VALIDATED_REFERENCE-FILESYSTEM-PATHS-PATTERNS_2025-10-26.md`  
> **Distinct from:** VALIDATED_REFERENCE-DOCUMENTATION-PATHS_2025-10-26.md (Documentation Navigation)

## 📋 **SCHEMA-ÜBERSICHT nach KI-PRÄFIX-ERKENNUNGSREGELN**

### **STATUS-PRÄFIX:** `VALIDATED_`
- **Bedeutung:** Validierte, stabile Dokumentation (verlässliche Quelle)
- **KI-Verhalten:** Behandelt als verlässliche Quelle für Filesystem Path Patterns

### **TYP-KATEGORIE:** `REFERENCE-`
- **Verwendung:** Code implementation patterns für filesystem paths
- **Purpose:** Copy & paste ready code patterns für verschiedene Prozess-Kontexte

> **🎯 CODE PATTERNS - Filesystem path usage in different contexts**  
> **Zweck:** Korrekte Implementierung von Pfad-Zugriff in Electron-Architektur  
> **Usage:** Copy & paste ready code patterns für verschiedene Prozess-Kontexte

## 🔍 **PATHS SYSTEM OVERVIEW**

### **🎯 Two Different Path Systems:**
1. **Documentation Paths** → `VALIDATED_REFERENCE-DOCUMENTATION-PATHS_2025-10-26.md` (Wo sind die Doku-Dateien)
2. **Filesystem Paths** → **Diese Datei** (Wie verwende ich Pfade im Code)

## 🗂️ **FILESYSTEM PATHS CODE PATTERNS**

### **✅ CORRECT: Renderer Process**
```typescript
// In Renderer Process - ALWAYS use PATHS service
import { PATHS } from 'src/lib/paths.ts'

const userDataPath = PATHS.USER_DATA_DIR
const documentsPath = PATHS.DOCUMENTS_DIR
const appDataPath = PATHS.APP_DATA_DIR
const tempPath = PATHS.TEMP_DIR
const downloadsPath = PATHS.DOWNLOADS_DIR

// Example: Database path construction
import path from 'path'
const dbPath = path.join(PATHS.USER_DATA_DIR, 'database', 'rawalite.db')
```

### **✅ CORRECT: Main Process**  
```typescript
// In Main Process - May use native Electron APIs
import { app } from 'electron'

const userDataPath = app.getPath('userData')
const documentsPath = app.getPath('documents')
const appDataPath = app.getPath('appData')
const tempPath = app.getPath('temp')
const downloadsPath = app.getPath('downloads')

// Example: Backup path construction
import path from 'path'
const backupPath = path.join(app.getPath('documents'), 'RawaLite-Backups')
```

### **✅ CORRECT: IPC Bridge**
```typescript
// For Renderer-Main communication
import { pathsIpc } from 'electron/ipc/paths.ts'

// Use IPC service for cross-process path access
const paths = await pathsIpc.getAllPaths()
const userDataPath = await pathsIpc.getUserDataPath()
const documentsPath = await pathsIpc.getDocumentsPath()
```

### **✅ CORRECT: Standalone Path Utils**
```typescript
// For utility functions (process-agnostic)
import { getAppDataPath, getUserDataPath } from 'src/lib/path-utils.ts'

const appData = await getAppDataPath()
const userData = await getUserDataPath()
```

## ❌ **FORBIDDEN PATTERNS**

### **❌ WRONG: Direct app.getPath() in Renderer**
```typescript
// CRASHES in Renderer Process!
import { app } from 'electron'
const userDataPath = app.getPath('userData')  // ERROR: app is undefined!
```

### **❌ WRONG: Hardcoded Paths**
```typescript
// Platform-specific, breaks cross-platform compatibility
const userDataPath = 'C:\\Users\\user\\AppData\\Roaming\\MyApp'  // WRONG!
const documentsPath = '/home/user/Documents'  // WRONG!
const macDocuments = '/Users/user/Documents'  // WRONG!
```

### **❌ WRONG: Node.js path in Renderer without proper setup**
```typescript
// Node.js APIs not available in Renderer without nodeIntegration
import { homedir } from 'os'
const homeDir = homedir()  // MAY FAIL in sandboxed renderer!
```

## 🎯 **CONTEXT-SPECIFIC IMPLEMENTATION PATTERNS**

### **Database File Paths:**
```typescript
// ✅ CORRECT: Database location (Renderer)
import { PATHS } from 'src/lib/paths.ts'
import path from 'path'
const dbPath = path.join(PATHS.USER_DATA_DIR, 'database', 'rawalite.db')

// ✅ CORRECT: Database location (Main)
import { app } from 'electron'
import path from 'path'
const dbPath = path.join(app.getPath('userData'), 'database', 'rawalite.db')
```

### **Backup File Paths:**
```typescript
// ✅ CORRECT: Backup location (Renderer)
import { PATHS } from 'src/lib/paths.ts'
import path from 'path'
const backupDir = path.join(PATHS.DOCUMENTS_DIR, 'RawaLite-Backups')
const backupFile = path.join(backupDir, `backup-${Date.now()}.db`)

// ✅ CORRECT: Backup location (Main)
import { app } from 'electron'
import path from 'path'
const backupDir = path.join(app.getPath('documents'), 'RawaLite-Backups')
const backupFile = path.join(backupDir, `backup-${Date.now()}.db`)
```

### **PDF Export Paths:**
```typescript
// ✅ CORRECT: PDF export location (Renderer)
import { PATHS } from 'src/lib/paths.ts'
import path from 'path'
const pdfDir = path.join(PATHS.DOCUMENTS_DIR, 'RawaLite-PDFs')
const pdfFile = path.join(pdfDir, `export-${Date.now()}.pdf`)

// ✅ CORRECT: PDF export location (Main)
import { app } from 'electron'
import path from 'path'
const pdfDir = path.join(app.getPath('documents'), 'RawaLite-PDFs')
const pdfFile = path.join(pdfDir, `export-${Date.now()}.pdf`)
```

### **Log File Paths:**
```typescript
// ✅ CORRECT: Log file location (Renderer)
import { PATHS } from 'src/lib/paths.ts'
import path from 'path'
const logDir = path.join(PATHS.APP_DATA_DIR, 'logs')
const logFile = path.join(logDir, 'rawalite.log')

// ✅ CORRECT: Log file location (Main)
import { app } from 'electron'
import path from 'path'
const logDir = path.join(app.getPath('appData'), 'logs')
const logFile = path.join(logDir, 'rawalite.log')
```

### **Temporary File Paths:**
```typescript
// ✅ CORRECT: Temporary files (Renderer)
import { PATHS } from 'src/lib/paths.ts'
import path from 'path'
const tempDir = path.join(PATHS.TEMP_DIR, 'rawalite-temp')
const tempFile = path.join(tempDir, `temp-${Date.now()}.tmp`)

// ✅ CORRECT: Temporary files (Main)
import { app } from 'electron'
import path from 'path'
const tempDir = path.join(app.getPath('temp'), 'rawalite-temp')
const tempFile = path.join(tempDir, `temp-${Date.now()}.tmp`)
```

## 🔧 **PATH VALIDATION PATTERNS**

### **Cross-Platform Path Validation:**
```typescript
// ✅ CORRECT: Platform-safe path handling
import path from 'path'

function createSafePath(basePath: string, ...segments: string[]): string {
  // Normalize path separators for current platform
  return path.resolve(basePath, ...segments)
}

// Usage
const safePath = createSafePath(PATHS.USER_DATA_DIR, 'subfolder', 'file.db')
```

### **Directory Creation Pattern:**
```typescript
// ✅ CORRECT: Ensure directory exists before file operations
import fs from 'fs/promises'
import path from 'path'

async function ensureDirectoryExists(filePath: string): Promise<void> {
  const dir = path.dirname(filePath)
  try {
    await fs.mkdir(dir, { recursive: true })
  } catch (error) {
    if (error.code !== 'EEXIST') {
      throw error
    }
  }
}

// Usage
const dbPath = path.join(PATHS.USER_DATA_DIR, 'database', 'rawalite.db')
await ensureDirectoryExists(dbPath)
```

## 🎯 **ENVIRONMENT-SPECIFIC PATTERNS**

### **Development vs Production:**
```typescript
// ✅ CORRECT: Environment-aware path selection
import { PATHS } from 'src/lib/paths.ts'
import path from 'path'

const isDev = !app.isPackaged // In Main Process
// OR
const isDev = process.env.NODE_ENV === 'development' // In Node.js context

const dbPath = isDev 
  ? path.join(process.cwd(), 'db', 'rawalite.db') // Dev: project folder
  : path.join(PATHS.USER_DATA_DIR, 'database', 'rawalite.db') // Prod: user data
```

### **Portable vs Installed Mode:**
```typescript
// ✅ CORRECT: Portable application support
import { app } from 'electron'
import path from 'path'
import fs from 'fs'

function getDataPath(): string {
  const execPath = path.dirname(app.getPath('exe'))
  const portableMarker = path.join(execPath, 'portable.flag')
  
  if (fs.existsSync(portableMarker)) {
    // Portable mode: data in app directory
    return path.join(execPath, 'data')
  } else {
    // Installed mode: data in user directory
    return app.getPath('userData')
  }
}
```

---

**📍 Location:** `docs/06-handbook/REFERENCE/VALIDATED_REFERENCE-FILESYSTEM-PATHS-PATTERNS_2025-10-26.md`  
**Purpose:** Code examples für korrekte Filesystem-Pfad-Implementierung  
**Access:** 06-handbook reference system  
**Distinct from:** `VALIDATED_REFERENCE-DOCUMENTATION-PATHS_2025-10-26.md` (Documentation navigation)  
**Related:** 
- [Project Core Rules](VALIDATED_REFERENCE-PROJECT-CORE-RULES_2025-10-26.md)
- [Documentation Paths](VALIDATED_REFERENCE-DOCUMENTATION-PATHS_2025-10-26.md)