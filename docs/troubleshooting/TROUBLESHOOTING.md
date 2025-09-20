# 🛠️ RawaLite - Troubleshooting Guide

> **Systematische Problemlösung für Development & Production** - Version 1.8.5+ (September 2025)

## 📋 **Überblick**

Dieser Guide bietet systematische Lösungsansätze für die häufigsten Probleme bei der RawaLite-Entwicklung und -Nutzung. Alle Lösungen sind getestet und basieren auf realen Debugging-Erfahrungen aus dem Projekt.

## 🚨 **Critical Issues (Production)**

### **🔥 Auto-Update Failures**

#### **Problem: "Update verfügbar" aber Download schlägt fehl**
```
Symptome:
- UpdateManagement zeigt neue Version an
- Download/Install Button funktioniert nicht
- Benutzer bleibt auf alter Version
```

**Root Cause & Solution:**
```powershell
# 1. Prüfe GitHub Release Assets
gh release view v1.8.6 --repo MonaFP/RawaLite

# MUSS enthalten:
# ✅ RawaLite-Setup-1.8.6.exe
# ✅ RawaLite-Setup-1.8.6.exe.blockmap  
# ✅ latest.yml

# 2. Falls latest.yml fehlt → Re-Release
pnpm dist  # Generiert neue latest.yml
gh release upload v1.8.6 "release\latest.yml" --clobber
```

#### **Problem: latest.yml mit falscher SHA512**
```yaml
# Symptom in latest.yml:
version: 1.8.6
files:
  - url: RawaLite-Setup-1.8.6.exe
    sha512: ABC123...  ← Falsche SHA512
    size: 12345678
```

**Solution:**
```powershell
# 1. Neue EXE generieren
pnpm dist

# 2. Prüfe SHA512 in latest.yml
Get-Content "release\latest.yml" | Select-String "sha512"

# 3. Re-Upload mit korrekter latest.yml
gh release upload v1.8.6 "release\latest.yml" --clobber
```

### **🔥 IPC Communication Failures**

#### **Problem: "window.rawalite is undefined"**
```javascript
// Symptom im Browser DevTools:
TypeError: Cannot read property 'updater' of undefined
  at VersionService.getElectronUpdaterVersion
```

**Root Cause & Solution:**
```typescript
// 1. Prüfe Preload-Integration (electron/main.ts)
const mainWindow = new BrowserWindow({
  webPreferences: {
    preload: path.join(__dirname, 'preload.js'),  ← Muss existieren
    contextIsolation: true,
    nodeIntegration: false
  }
});

// 2. Validiere Preload-Build (package.json)
"build:preload": "esbuild electron/preload.ts --bundle --platform=node --outfile=dist-electron/preload.js"

// 3. Prüfe Namespace-Exposure (electron/preload.ts)
contextBridge.exposeInMainWorld('rawalite', {  ← Muss 'rawalite' sein
  updater: {...},
  pdf: {...}
  // ...
});
```

#### **Problem: Mixed IPC Namespaces**
```javascript
// Symptom: Code verwendet verschiedene Namespaces
window.electronAPI.something()  ← DEPRECATED
window.api.something()          ← DEPRECATED  
window.rawalite.something()     ← CURRENT (1.8.5+)
```

**Migration Solution:**
```typescript
// Finde alle veralteten Namespaces
grep -r "window\.electronAPI\|window\.api" src/

// Ersetze mit einheitlichem Namespace
window.electronAPI.updater     → window.rawalite.updater
window.api.pdf                 → window.rawalite.pdf
window.electronAPI.app         → window.rawalite.app
```

## ⚠️ **Build & Development Issues**

### **🔧 TypeScript Compilation Errors**

#### **Problem: "Cannot find module" für SQL.js**
```typescript
// Error:
Cannot find module 'sql.js/dist/sql-wasm.wasm?url' or its corresponding type declarations.
```

**Solution:**
```typescript
// 1. Prüfe sql.js Installation
pnpm install sql.js@1.13.0

# 2. Validiere WASM-Datei
ls public/sql-wasm.wasm  # Muss existieren

# 3. Prüfe Vite-Konfiguration (vite.config.mts)
export default defineConfig({
  // ...
  assetsInclude: ['**/*.wasm']  ← Wichtig für WASM-Support
});
```

#### **Problem: "Property does not exist on type 'Window'"**
```typescript
// Error:
Property 'rawalite' does not exist on type 'Window & typeof globalThis'.
```

**Solution:**
```typescript
// Prüfe Type Definitions (src/global.d.ts)
declare global {
  interface Window {
    rawalite: {
      updater: {
        checkForUpdates(): Promise<UpdateInfo>;
        getVersion(): Promise<{current: string}>;
      };
      pdf: {
        generateInvoicePDF(data: any): Promise<string>;
      };
      app: {
        getVersion(): Promise<string>;
      };
      backup: {
        exportData(): Promise<string>;
      };
    };
  }
}
```

### **🔧 Build Process Failures**

#### **Problem: "electron-builder fails with NSIS errors"**
```
Error:
NSIS is not set as executable. Please use "Binaries" option or copy NSIS to ...
```

**Solution:**
```powershell
# 1. Clear Build Cache
Remove-Item -Recurse -Force .\dist, .\release, .\node_modules\.cache

# 2. Reinstall Dependencies  
pnpm install

# 3. Check electron-builder Config (electron-builder.yml)
nsis:
  oneClick: false
  perMachine: false      ← Wichtig: User-Installation 
  allowToChangeInstallationDirectory: true
  createDesktopShortcut: true
  createStartMenuShortcut: true

# 4. Rebuild
pnpm build && pnpm dist
```

#### **Problem: "Build succeeds but EXE doesn't start"**
```
Symptom: Setup.exe wird erstellt, aber RawaLite.exe startet nicht
```

**Debug Steps:**
```powershell
# 1. Prüfe EXE in release/win-unpacked/
.\release\win-unpacked\RawaLite.exe  # Direkt testen

# 2. Check Electron Main Process (electron/main.ts)
# Validiere App-Ready Handler
app.whenReady().then(createWindow);

# 3. Prüfe Ressourcen-Pfade
const isDev = process.env.NODE_ENV === 'development';
const indexPath = isDev 
  ? 'http://localhost:5173'  # Dev Server
  : `file://${path.join(__dirname, '../dist/index.html')}`;  # Production
```

### **🔧 Database Issues**

#### **Problem: "Database is locked" oder "SQLITE_BUSY"**
```
Error: SQLITE_BUSY: database is locked
```

**Solutions:**
```javascript
// 1. Connection Pooling (src/persistence/sqlite/db.ts)
let dbInstance: Database | null = null;

export function getDatabase(): Database {
  if (!dbInstance) {
    dbInstance = new sql.Database();  // Singleton Pattern
    // Setup transactions with proper cleanup
  }
  return dbInstance;
}

// 2. Transaction Wrapping
export async function withTransaction<T>(operation: () => Promise<T>): Promise<T> {
  const db = getDatabase();
  try {
    db.exec('BEGIN TRANSACTION;');
    const result = await operation();
    db.exec('COMMIT;');
    return result;
  } catch (error) {
    db.exec('ROLLBACK;');
    throw error;
  }
}

// 3. Proper Cleanup in Electron (electron/main.ts)
app.on('before-quit', () => {
  // Close DB connections
  if (dbInstance) {
    dbInstance.close();
  }
});
```

#### **Problem: Schema-Migration Failures**
```
Error: no such column: newColumn
```

**Solution:**
```sql
-- Sichere Migration-Pattern (sqlite/db.ts)
try {
  db.exec(`ALTER TABLE settings ADD COLUMN designSettings TEXT DEFAULT '{}'`);
  console.log('Migration: designSettings column added');
} catch (error) {
  // Column already exists - safe to ignore
  console.warn('Migration warning (expected):', error.message);
}

-- Validierung nach Migration
const columns = db.exec(`PRAGMA table_info(settings);`);
const hasColumn = columns[0]?.values?.some(row => row[1] === 'designSettings');
console.log('designSettings column exists:', hasColumn);
```

## 🔄 **Version & Release Issues**

### **🏷️ Version Synchronization Problems**

#### **Problem: package.json vs. VersionService mismatch**
```json
// package.json
{"version": "1.8.6"}

// VersionService.ts  
return "1.8.5";  ← OUT OF SYNC
```

**Solution:**
```powershell
# 1. Prüfe Synchronisation
pnpm version:check

# 2. Auto-Korrektur mit version-bump Script
pnpm version:bump 1.8.6  # Setzt beide Dateien auf 1.8.6

# 3. Validierung
pnpm version:check  # Should show "✅ Versions synchronized"
```

#### **Problem: Git Tag vs. Package Version Mismatch**
```
Git Tag: v1.8.5
package.json: "version": "1.8.6"
```

**Solution:**
```powershell
# Option A: Fix Git Tag
git tag -d v1.8.5               # Delete local tag
git push origin :v1.8.5         # Delete remote tag
git tag v1.8.6                  # Create correct tag
git push origin main --tags     # Push corrected tag

# Option B: Fix Package Version
pnpm version:bump 1.8.5         # Revert package.json to match git tag
```

### **🏷️ Release Asset Problems**

#### **Problem: "Release created but no files attached"**
```powershell
# Symptom: GitHub Release exists but no Setup.exe
gh release view v1.8.6  # Shows: "No assets"
```

**Solution:**
```powershell
# 1. Generate Assets
pnpm dist

# 2. Verify Files Exist
ls release/  # Should show: Setup.exe, .blockmap, latest.yml

# 3. Upload to Existing Release
gh release upload v1.8.6 \
  "release\RawaLite-Setup-1.8.6.exe" \
  "release\RawaLite-Setup-1.8.6.exe.blockmap" \
  "release\latest.yml" \
  --clobber --repo MonaFP/RawaLite
```

## 🎨 **Theme & UI Issues**

### **🎨 Theme Persistence Problems**

#### **Problem: "Theme resets to default after restart"**
```typescript
// Symptom: DesignSettings nicht persistent
```

**Solution:**
```typescript
// 1. Prüfe Settings Storage (SettingsAdapter.ts)
async updateSettings(updates: Partial<Settings>): Promise<Settings> {
  // Validiere dass designSettings included ist
  const currentSettings = await this.getSettings();
  const updatedSettings = {
    ...currentSettings,
    ...updates,
    designSettings: updates.designSettings || currentSettings.designSettings
  };
  // Save to SQLite, not localStorage!
}

// 2. Validiere Theme Application (App.tsx)
useEffect(() => {
  const applyTheme = async () => {
    const settings = await getSettings();
    const theme = settings.designSettings?.theme || 'salbeigrün';
    applyThemeToDOM(theme);  // Must be called on startup
  };
  applyTheme();
}, []);
```

#### **Problem: "Navigation Mode doesn't switch properly"**
```css
/* Symptom: Sidebar/Header switching broken */
```

**Solution:**
```css
/* Prüfe CSS Variables (index.css) */
:root {
  --sidebar-width: 240px;  /* Fixed width in BOTH modes */
}

/* Header Mode */
.layout-header-nav .sidebar {
  width: var(--sidebar-width);  /* Keep consistent width */
}

/* Sidebar Mode */  
.layout-sidebar-nav .sidebar {
  width: var(--sidebar-width);  /* Same width, no jumping */
}
```

## 🐛 **Runtime Debugging**

### **🔍 Development Debugging**

#### **Enable Comprehensive Logging**
```typescript
// 1. Electron Main Process Debugging (electron/main.ts)
if (process.env.NODE_ENV === 'development') {
  console.log('[Main] Starting RawaLite in development mode');
  require('electron-debug')({
    showDevTools: true,
    devToolsMode: 'detach'
  });
}

// 2. Renderer Process Debugging (Browser DevTools)
// F12 → Console → Enable "Verbose" level
// Network Tab → Check IPC communication

// 3. IPC Message Debugging
ipcMain.handle('test', (event, ...args) => {
  console.log('[IPC] Received:', args);
  return 'IPC working';
});
```

#### **Performance Debugging**
```typescript
// 1. Database Query Performance
console.time('query-customers');
const customers = await adapter.getCustomers();
console.timeEnd('query-customers');  // Should be < 100ms

// 2. Component Render Performance  
import { Profiler } from 'react';

<Profiler id="CustomerList" onRender={(id, phase, actualDuration) => {
  if (actualDuration > 100) {  // > 100ms is slow
    console.warn(`[Performance] ${id} took ${actualDuration}ms`);
  }
}}>
  <CustomerList />
</Profiler>
```

### **🔍 Production Debugging**

#### **Remote Debugging Setup**
```typescript
// electron/main.ts - Production Error Logging
process.on('uncaughtException', (error) => {
  console.error('[Main] Uncaught Exception:', error);
  // In production: Send to error tracking service
});

app.on('render-process-gone', (event, webContents, details) => {
  console.error('[Main] Renderer process crashed:', details);
  // Automatic restart logic
});
```

#### **User Data Debugging**
```powershell
# 1. Locate User Data (Windows)
echo $env:APPDATA\RawaLite\
# Contains: database.sqlite, logs, etc.

# 2. Backup User Data Before Debugging
Copy-Item "$env:APPDATA\RawaLite\" "$env:APPDATA\RawaLite_backup\" -Recurse

# 3. Database Inspection
sqlite3.exe "$env:APPDATA\RawaLite\database.sqlite"
.schema  -- Show all tables
SELECT * FROM settings LIMIT 1;  -- Check settings
```

## 🧪 **Testing & Quality Assurance**

### **🧪 Pre-Release Testing Checklist**

```powershell
# 1. Code Quality
pnpm lint          # ESLint compliance
pnpm typecheck     # TypeScript validation
pnpm version:check # Version synchronization

# 2. Build Testing
pnpm build         # Vite build successful
pnpm dist          # Electron-builder successful

# 3. Functional Testing
# - Create/Edit/Delete Customer
# - Generate Invoice PDF
# - Theme switching
# - Navigation mode switching
# - Version check in About dialog

# 4. Release Asset Validation
ls release/        # Verify: Setup.exe, .blockmap, latest.yml
# Check file sizes: Setup.exe should be ~100-200MB
```

### **🧪 Update Testing**
```powershell
# 1. Install Previous Version
.\release\RawaLite-Setup-1.8.5.exe

# 2. Create Test Data
# Add customers, create invoices, adjust settings

# 3. Release New Version
pnpm version:bump patch
pnpm build && pnpm dist
gh release create v1.8.6 --title "Test Update" release\*

# 4. Test Auto-Update
# Start old version → Should detect update → Download → Install → Verify data preserved
```

## 📋 **Emergency Procedures**

### **🚨 Rollback Release**
```powershell
# 1. Delete GitHub Release
gh release delete v1.8.6 --yes --repo MonaFP/RawaLite

# 2. Delete Git Tag
git tag -d v1.8.6
git push origin :v1.8.6

# 3. Revert Version
pnpm version:bump 1.8.5  # Back to previous version

# 4. Inform Users (if necessary)
# Update website, send notifications
```

### **🚨 Critical Bug Hotfix**
```powershell
# 1. Fast Version Bump
pnpm version:bump patch  # 1.8.6 → 1.8.7

# 2. Apply Fix + Test
# Make minimal changes, test thoroughly

# 3. Emergency Release
pnpm build && pnpm dist
git add -A && git commit -m "v1.8.7: HOTFIX - Critical bug"
git tag v1.8.7 && git push origin main --tags

# 4. Immediate GitHub Release
gh release create v1.8.7 --title "RawaLite v1.8.7 - HOTFIX" \
  "release\RawaLite-Setup-1.8.7.exe" \
  "release\RawaLite-Setup-1.8.7.exe.blockmap" \
  "release\latest.yml" \
  --notes "Critical bugfix release"
```

## 📞 **Getting Help**

### **Debug Information Collection**
```powershell
# System Information
echo "OS: $(Get-ComputerInfo -Property WindowsProductName | Select -ExpandProperty WindowsProductName)"
echo "Node: $(node --version)"
echo "pnpm: $(pnpm --version)"
echo "Electron: $(Get-Content package.json | ConvertFrom-Json | Select -ExpandProperty devDependencies.electron)"

# App Version
Get-Content "src/services/VersionService.ts" | Select-String "BUILD_DATE|return"

# Build Output
pnpm build 2>&1 | Out-File build-log.txt
pnpm dist 2>&1 | Out-File dist-log.txt
```

### **Common Support Questions**
1. **"App doesn't start"** → Check Build Process (Section: Build Process Failures)
2. **"Update doesn't work"** → Check Auto-Update Assets (Section: Auto-Update Failures)  
3. **"Database errors"** → Check SQLite Issues (Section: Database Issues)
4. **"Theme not saving"** → Check Theme Persistence (Section: Theme & UI Issues)
5. **"Build fails"** → Check TypeScript/Build Errors (Section: Build & Development Issues)

---

## 🎯 **Prevention Best Practices**

### **DO's** ✅
- **Run `pnpm version:check`** vor jedem Release
- **Teste Auto-Update** mit lokaler Release-Simulation  
- **Validiere Assets** vor GitHub Release Upload
- **Nutze TypeScript strict mode** für frühe Fehlererkennung
- **Implementiere Error Boundaries** für graceful degradation
- **Backup User Data** vor kritischen Updates

### **DON'Ts** ❌
- **Mixed IPC Namespaces** (nur `window.rawalite` verwenden)
- **Manual Version Edits** (immer `pnpm version:bump`)
- **Releases ohne latest.yml** (bricht Auto-Update)
- **Breaking Changes** ohne Migration-Guide
- **Production Debugging** ohne User Data Backup

---

**💡 Tipp:** Viele Probleme lassen sich durch **systematisches Vorgehen** und **saubere Tooling-Integration** vermeiden. Bei persistenten Problemen: Erst **reproduzieren**, dann **root cause** finden, dann **systematisch lösen**.

---

*Letzte Aktualisierung: 18. September 2025*  
*Version: 1.0.0*