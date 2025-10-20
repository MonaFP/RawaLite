# Dev-Prod Separation Implementation - RawaLite

**Status:** ✅ **PRODUCTION VALIDATED**  
**Version:** v1.0.42.4  
**Author:** RawaLite Team  
**Updated:** 2025-10-12  

## 📋 **Übersicht**

Dieses Dokument beschreibt die **tatsächlich implementierte** Dev-Prod-Unterscheidung im RawaLite-Workspace. Basiert auf Code-Analyse der aktuellen Implementierung (v1.0.42.4).

---

## 🔧 **1. Environment Detection**

### **Primary Pattern: app.isPackaged**
```typescript
// electron/main.ts (Zeile 19)
const isDev = !app.isPackaged;

// Verwendet in:
// - Main Process Bootstrap
// - Window DevTools Control
// - Path Resolution Logic
```

**Charakteristika:**
- ✅ **Kein NODE_ENV** - Electron-native Detection
- ✅ **Zuverlässig** - Built-in Electron API
- ✅ **Binary Decision** - Development vs Production Package

---

## 🔄 **2. Update System (VOLLSTÄNDIG IMPLEMENTIERT)**

### **AutoDownload Behavior**
```typescript
// src/services/AutoUpdateService.ts
if (this.preferences?.autoDownload) {
  await this.startSilentDownload(updateInfo);
} else {
  // Show notification without download
  this.emit('updateNotification', { ... });
}
```

### **Development Mock System**
```typescript
// src/main/services/UpdateManagerService.ts (Zeile 369+)
const isDev = !app.isPackaged;
const isUpdateManagerDev = process.argv.includes('--update-manager-dev');

if (isDev && isUpdateManagerDev) {
  // Use Mock Progress Service - MUCH SLOWER for testing
  await mockProgressService.startMockDownload(50, 0.3, (progress) => {
    // 0.3 MB/s for ~3 minutes duration
  });
}
```

**Development Features:**
- ✅ **Mock Progress Service** - Simulated downloads
- ✅ **Realistic Speed Simulation** - 0.3 MB/s for testing
- ✅ **UI/UX Validation** - Testing without real downloads
- ✅ **Security Validation** - Development-specific checks

**Production Behavior:**
- ✅ **Real GitHub API** - Actual release downloads
- ✅ **Security Validation** - Production-grade checks
- ✅ **User Consent Required** - No silent installs without permission

---

## 🛡️ **3. Build System & Guards (EXTENSIV IMPLEMENTIERT)**

### **Validation Pipeline**
```json
// package.json - Pre-Release Scripts
{
  "pre:release": "pnpm validate:critical-fixes && pnpm validate:docs-structure && pnpm validate:path-compliance && pnpm typecheck && pnpm lint && pnpm build",
  "safe:dist": "pnpm pre:release && pnpm dist",
  "safe:version": "pnpm validate:pre-release && pnpm version"
}
```

### **Guard Scripts (15+ Implementiert)**
```bash
# Critical Validation Scripts
scripts/validate-critical-fixes.mjs      # Preserves essential fixes
scripts/validate-path-compliance.mjs     # Path system validation  
scripts/validate-migration-index.mjs     # Database consistency
scripts/validate-release-assets.mjs      # Release validation
scripts/pre-release-validation.mjs       # Comprehensive pre-release

# ABI Protection System
scripts/abi-guard.cjs                    # ABI compatibility
scripts/validate-native-modules.mjs      # Native module validation
scripts/validate-electron-abi.mjs        # Electron ABI check

# Development Tools
scripts/force-dev-all.cjs               # Prevents `pnpm dev`
scripts/rebuild-native-electron.cjs      # Forces ABI rebuild
```

**Development-Only Guards:**
- ✅ **ABI-Safe Database Tools** - sql.js for safe analysis
- ✅ **Mock-Hook Prevention** - Prevents production Mock-Hooks
- ✅ **Path Compliance Validation** - Enforces PATHS system
- ✅ **Anti-Pattern Detection** - Catches dangerous patterns

**Production Guards:**
- ✅ **Critical Fixes Registry** - Preserves essential fixes
- ✅ **Asset Validation** - Validates release assets
- ✅ **Binary Validation** - Ensures correct binaries

---

## 🗂️ **4. Path System (VOLLSTÄNDIG GETRENNT)**

### **Architecture Separation**
```typescript
// MAIN PROCESS (erlaubt)
import { join, dirname } from 'path';
import { app } from 'electron';

const userDataPath = app.getPath('userData');
const downloadPath = join(userDataPath, 'downloads');

// RENDERER PROCESS (verboten - nur PATHS System)
// ❌ import path from 'path';        // FORBIDDEN
// ❌ app.getPath('userData');        // FORBIDDEN  
// ✅ await window.rawalite.paths.getUserData(); // CORRECT
```

### **Validation Implementation**
```javascript
// scripts/validate-path-compliance.mjs
const forbiddenPatterns = [
  { pattern: /import.*from ['"]path['"]/, name: 'Node.js path import' },
  { pattern: /require\(['"]path['"]\)/, name: 'require path' },
  { pattern: /app\.getPath\(/, name: 'app.getPath() call' },
  { pattern: /process\.cwd\(/, name: 'process.cwd() call' }
];
```

**Implementation Status:**
- ✅ **Main Process** - Full Node.js path API access
- ✅ **Renderer Process** - Restricted to PATHS system
- ✅ **Update Services** - Validated path compliance
- ✅ **CI/CD Guards** - Automated path validation

---

## 🚀 **5. Development Tools & Workflows**

### **ABI-Safe Development**
```bash
# Development Database Analysis (ABI-Safe)
scripts/analyze-database-sqljs.cjs      # Uses sql.js (no native deps)
scripts/inspect-sqljs.mjs               # Safe inspection

# Production Database Tools (ABI-Dependent)  
scripts/analyze-database.cjs            # Uses better-sqlite3
```

### **Development-Specific Scripts**
```bash
# Parallel Development
scripts/dev-parallel.ps1                # Multi-process dev mode
scripts/dev-starter.cjs                 # Development bootstrap

# Native Module Management
scripts/fix-sqlite.ps1                  # SQLite ABI fixes
scripts/fix-native-addons.ps1           # Native addon repairs
```

### **Git Hooks & Automation**
```bash
# Pre-commit Validation
scripts/setup-git-hooks.js              # Installs validation hooks
scripts/setup-git-hooks.ps1             # PowerShell version

# Automated Cleanup
scripts/build-cleanup.ps1               # Development cleanup
scripts/clean-full.cmd                  # Full workspace reset
```

---

## 📊 **6. Security & IPC Patterns**

### **IPC Handler Registration**
```typescript
// electron/main.ts - IPC Handlers
// Registriert in beiden Umgebungen, aber unterschiedliche Implementierung

if (isDev) {
  // Development: Extended logging, mock services
  console.log('[IPC] Development mode - extended handlers');
} else {
  // Production: Minimal logging, production services
  console.log('[IPC] Production mode - standard handlers');
}
```

### **Security Validation**
```typescript
// src/services/AutoUpdateSecurityMonitor.ts
const securityValidation = await this.securityMonitor.validateUpdateSecurity(updateInfo);

if (!securityValidation.isValid) {
  // Development: Detailed security logs
  // Production: User-friendly error messages
}
```

---

## 🎯 **7. PDF SERVICE (TEILWEISE IMPLEMENTIERT - v1.0.42.5)**

### **PDF Template Consistency** 
✅ **Dev-Prod Konsistenz implementiert** in `electron/main.ts`
- Sub-Items verwenden jetzt einheitliche Data-URL Strategie
- Eliminiert temporäre Dateien für Production-Kompatibilität
- Identische PDF-Generierung in beiden Umgebungen

### **Attachment Rendering**
```typescript
// KONSISTENZ-FIX v1.0.42.5: Einheitliche Data-URL Strategie
// Vorher: Parent-Items (Data-URLs) vs Sub-Items (temporäre Dateien)
// Nachher: Beide verwenden Data-URLs für Dev-Prod Kompatibilität

if (attachment.base64Data) {
  let dataUrl = attachment.base64Data;
  if (!dataUrl.startsWith('data:')) {
    const mimeType = attachment.fileType || 'image/png';
    dataUrl = `data:${mimeType};base64,${dataUrl}`;
  }
  return `<img src="${dataUrl}" ...>`;  // ✅ Funktioniert überall
}
```

**Implementation Status:**
- ✅ **Attachment Consistency** - Einheitliche Data-URL Strategie
- ❌ **Template Variants** - Keine Development-spezifischen Templates
- ❌ **Debug Features** - Keine Dev-only PDF Debug-Features

---

## 🎯 **8. Database Persistence**
## 🎯 **8. Database Persistence**
❌ **Keine separaten Datenpfade** für Dev/Prod
- Einheitliche SQLite-Implementierung
- Keine Development-spezifische Datenpersistierung

---

## 🎯 **9. Theme System**
❌ **Keine Development-spezifischen Theme-Features**
- Identisches Theme-System in beiden Umgebungen
- Keine Production-Einschränkungen

---

## 📋 **Implementation Summary**

| Bereich | Status | Implementierung |
|---------|---------|-----------------|
| **Environment Detection** | ✅ **VOLLSTÄNDIG** | `app.isPackaged` Pattern |
| **Update System** | ✅ **VOLLSTÄNDIG** | Mock Service + Security Validation |
| **Build System & Guards** | ✅ **EXTENSIV** | 15+ Validation Scripts |
| **Path System** | ✅ **VOLLSTÄNDIG** | Main/Renderer Separation |
| **Development Tools** | ✅ **UMFANGREICH** | ABI-Safe Tools + Workflows |
| **Security/IPC** | ✅ **IMPLEMENTIERT** | Handler Registration + Validation |
| **PDF Service** | ✅ **TEILWEISE** | Attachment Consistency (v1.0.42.5) |
| **Database Persistence** | ❌ **NICHT GETRENNT** | Einheitliche SQLite-Nutzung |
| **Theme System** | ❌ **NICHT GETRENNT** | Keine Dev-Spezifik |

**Gesamtstatus: 7/9 Bereiche implementiert (78%)**

---

## 🔗 **Referenzen**

- **[Build Pipeline](../BUILD-INSTALLATION-MATRIX.md)** - Build-Unterschiede Details
- **[ABI-Safe Tools](../ABI-SAFE-DATABASE-TOOLS.md)** - Development Database Tools
- **[Path System](../../01-core/final/VALIDATED_GUIDE-PATHS-SYSTEM-DOCUMENTATION.md)** - PATHS Implementation
- **[Update System](../../05-deploy/final/VALIDATED_GUIDE-UPDATER-UPDATE-SYSTEM-ARCHITECTURE.md)** - Update Development Guide
- **[Critical Fixes Registry](../../00-meta/CRITICAL-FIXES-REGISTRY.md)** - Fix Preservation

---

**Status:** ✅ **PRODUCTION VALIDATED** - Dokumentiert auf Basis von Code-Analyse v1.0.42.4