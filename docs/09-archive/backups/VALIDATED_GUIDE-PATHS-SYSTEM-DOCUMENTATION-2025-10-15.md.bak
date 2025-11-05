# 🗂️ PATHS System Dokumentation - RawaLite

> **Zentrale Pfadabstraktion und sichere Filesystem-Integration**  
> **Erstellt:** 2025-10-02 | **Status:** Production Ready

---

## 🎯 **Übersicht**

Das PATHS System ist die **zentrale Pfadabstraktion** in RawaLite und stellt sicher, dass:
- Renderer Process **niemals** direkte Node.js APIs verwendet
- Alle Pfade konsistent über IPC vom Main Process bezogen werden
- Entwicklungsumgebung vs. Produktionsumgebung transparent behandelt wird
- Testing mit isolierten Pfaden funktioniert

**⚠️ KRITISCH:** Renderer Process darf **NIEMALS** `app.getPath()` oder Node.js `path` direkt verwenden!

---

## 🏗️ **Architektur**

### **IPC Pipeline**
```
Renderer Process          IPC Bridge              Main Process
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│ PATHS.getPath() │ ──── │ preload.ts      │ ──── │ main.ts         │
│                 │      │ paths.get()     │      │ app.getPath()   │
│ paths.ts        │      │                 │      │                 │
└─────────────────┘      └─────────────────┘      └─────────────────┘
```

### **Sicherheitsmodell**
- **Main Process:** Vollzugriff auf Node.js APIs ✅
- **Renderer Process:** Nur PATHS System, niemals direkte APIs ❌
- **IPC Bridge:** Sichere, typisierte Pfad-Übertragung

---

## 📁 **Implementierung**

### **Core Files**
```
src/lib/paths.ts           # PATHS Klasse - Renderer Process API
electron/preload.ts        # IPC Bridge für Pfad-Übertragung  
electron/main.ts           # paths:get IPC Handler im Main Process
src/global.d.ts           # TypeScript Definitionen für window.rawalite.paths
```

### **PATHS Klasse API**
```typescript
// ✅ RICHTIG: Alle Renderer Components verwenden PATHS
import PATHS from '../lib/paths';

// Basis-Pfade
const appData = await PATHS.getAppDataPath();     // %APPDATA%/RawaLite
const documents = await PATHS.getDocumentsPath(); // %USERPROFILE%/Documents  
const downloads = await PATHS.getDownloadsPath(); // %USERPROFILE%/Downloads

// Spezifische Pfade
const dbFile = await PATHS.DATABASE_FILE();       // userData/database/rawalite.db
const logFile = await PATHS.LOG_FILE();           // userData/logs/rawalite-2025-10-02.log
const backupDir = await PATHS.BACKUPS_DIR();      // Documents/RawaLite-Backups

// Utility Methods
await PATHS.ensureDir(somePath);                  // Verzeichnis erstellen
await PATHS.cleanTempDir();                       // Temp-Dateien aufräumen
const allPaths = await PATHS.getAllPaths();       // Debug: Alle Pfade anzeigen
```

### **IPC Handler (Main Process)**
```typescript
// electron/main.ts - PFLICHT für PATHS System
ipcMain.handle('paths:get', async (event, pathType: 'userData' | 'documents' | 'downloads') => {
  try {
    switch (pathType) {
      case 'userData':
        return app.getPath('userData')
      case 'documents':
        return app.getPath('documents')  
      case 'downloads':
        return app.getPath('downloads')
      default:
        throw new Error(`Unsupported path type: ${pathType}`)
    }
  } catch (error) {
    console.error(`Failed to get path ${pathType}:`, error)
    throw error
  }
})
```

### **Preload Bridge**
```typescript
// electron/preload.ts - Sichere IPC Übertragung
const rawaliteAPI = {
  paths: {
    get: (pathType: 'userData' | 'documents' | 'downloads') =>
      ipcRenderer.invoke('paths:get', pathType) as Promise<string>,
  },
  fs: {
    // Filesystem APIs für PATHS Support
    ensureDir: (path: string) => ipcRenderer.invoke('fs:ensureDir', path),
    readDir: (path: string) => ipcRenderer.invoke('fs:readDir', path),
    // ... weitere fs APIs
  }
};

contextBridge.exposeInMainWorld('rawalite', rawaliteAPI);
```

---

## 🚨 **Compliance Rules**

### **✅ ERLAUBT**
```typescript
// ✅ Renderer Process - PATHS System verwenden
import PATHS from '../lib/paths';
const dbPath = await PATHS.DATABASE_FILE();

// ✅ Main Process - Node.js APIs direkt verwenden  
import path from 'node:path';
import { app } from 'electron';
const dbPath = path.join(app.getPath('userData'), 'database', 'rawalite.db');
```

### **❌ VERBOTEN**
```typescript
// ❌ Renderer Process - NIEMALS Node.js APIs direkt
import path from 'path';                    // ❌ FALSCH
import { app } from 'electron';             // ❌ FALSCH  
const userData = app.getPath('userData');   // ❌ FALSCH

// ❌ Renderer Process - NIEMALS window.require
const path = window.require('path');        // ❌ FALSCH
```

---

## 🧪 **Testing & Development**

### **Test Environment Setup**
```typescript
// PATHS System automatisch für Tests konfiguriert
if (process.env.NODE_ENV === 'test') {
  // Isolierte Test-Pfade verwenden
  const testDataDir = await PATHS.TEST_DATA_DIR(); // .test-data/
  await PATHS.ensureDir(testDataDir);
}

// Test Utilities verfügbar
import { PathsTestUtils } from '../lib/paths';

await PathsTestUtils.setupTestPaths();    // Test-Umgebung vorbereiten
await PathsTestUtils.cleanupTestPaths();  // Nach Tests aufräumen
```

### **Development Debugging**
```typescript
// Alle konfigurierten Pfade anzeigen
const allPaths = await PATHS.getAllPaths();
console.log('PATHS Configuration:', allPaths);

// Output Beispiel:
// {
//   appData: "C:\\Users\\User\\AppData\\Roaming\\RawaLite",
//   documents: "C:\\Users\\User\\Documents", 
//   downloads: "C:\\Users\\User\\Downloads",
//   database: "C:\\Users\\User\\AppData\\Roaming\\RawaLite\\database\\rawalite.db",
//   logs: "C:\\Users\\User\\AppData\\Roaming\\RawaLite\\logs",
//   backups: "C:\\Users\\User\\Documents\\RawaLite-Backups"
// }
```

---

## 🔧 **Verwendung in Services**

### **✅ Korrekte Integration**
```typescript
// services/ExportService.ts
import PATHS from "../lib/paths";

export class ExportService {
  static async exportToPDF(documentType: string, number: string): Promise<string> {
    const exportsDir = await PATHS.EXPORTS_DIR();
    await PATHS.ensureDir(exportsDir);
    
    const fileName = await PATHS.PDF_EXPORT_FILE(documentType, number);
    // ... PDF Export Logik
    return fileName;
  }
}

// services/LoggingService.ts  
import PATHS from '../lib/paths';

export class LoggingService {
  static async log(message: string): Promise<void> {
    try {
      const logFile = await PATHS.LOG_FILE();
      const logsDir = await PATHS.LOGS_DIR();
      await PATHS.ensureDir(logsDir);
      
      // Write via IPC
      await (window as any).rawalite.fs.appendFile(logFile, message + '\n');
    } catch (error) {
      console.warn('File logging failed, console only:', error);
    }
  }
}
```

---

## 📊 **Path Categories**

### **Database & Core Data**
```typescript
await PATHS.DATABASE_DIR()           // userData/database/
await PATHS.DATABASE_FILE()          // userData/database/rawalite.db  
await PATHS.DATABASE_BACKUP_FILE()   // userData/database/backups/backup-[timestamp].db
```

### **Logging & Diagnostics**
```typescript
await PATHS.LOGS_DIR()               // userData/logs/
await PATHS.LOG_FILE()               // userData/logs/rawalite-[date].log
await PATHS.ERROR_LOG_FILE()         // userData/logs/errors.log
```

### **Settings & Configuration**
```typescript
await PATHS.SETTINGS_DIR()           // userData/settings/
await PATHS.SETTINGS_FILE()          // userData/settings/app-settings.json
await PATHS.USER_PREFERENCES_FILE()  // userData/settings/user-preferences.json
```

### **Templates & Resources**
```typescript
await PATHS.TEMPLATES_DIR()          // userData/templates/
await PATHS.INVOICE_TEMPLATE_FILE()  // userData/templates/invoice-template.html
await PATHS.OFFER_TEMPLATE_FILE()    // userData/templates/offer-template.html
```

### **Backups & Recovery**
```typescript
await PATHS.BACKUPS_DIR()            // Documents/RawaLite-Backups/
await PATHS.FULL_BACKUP_FILE()       // Documents/RawaLite-Backups/rawalite-full-backup-[timestamp].zip
await PATHS.DATA_EXPORT_FILE(type)   // Documents/RawaLite-Backups/[type]-export-[date].csv
```

### **Exports & Downloads**
```typescript
await PATHS.EXPORTS_DIR()            // Downloads/RawaLite-Exports/
await PATHS.PDF_EXPORT_FILE(type, num) // Downloads/RawaLite-Exports/[type]-[num]-[date].pdf
await PATHS.CSV_EXPORT_FILE(type)    // Downloads/RawaLite-Exports/[type]-[date].csv
```

### **Assets & Media**
```typescript
await PATHS.ASSETS_DIR()             // userData/assets/
await PATHS.COMPANY_LOGO_FILE()      // userData/assets/company-logo.png
await PATHS.USER_UPLOADS_DIR()       // userData/assets/uploads/
```

---

## 🛡️ **Validation & Guards**

### **CI/CD Guards**
```json
{
  "guard:path-compliance": "node scripts/validate-path-compliance.mjs",
  "validate:paths-system": "node scripts/validate-paths-system.mjs"
}
```

### **Path Compliance Validation**
```javascript
// scripts/validate-path-compliance.mjs
import fs from 'fs';
import path from 'path';

// Check for illegal Node.js path usage in renderer process
const rendererFiles = glob.sync('src/**/*.ts', { ignore: 'src/main/**' });

for (const file of rendererFiles) {
  const content = fs.readFileSync(file, 'utf8');
  
  // VERBOTEN: Node.js path imports in renderer
  if (content.includes("import path from 'path'") || 
      content.includes("import { join } from 'path'") ||
      content.includes("require('path')")) {
    console.error(`❌ Illegal path usage in ${file}`);
    process.exit(1);
  }
  
  // VERBOTEN: Direct app.getPath usage in renderer
  if (content.includes("app.getPath")) {
    console.error(`❌ Direct app.getPath usage in ${file}`);
    process.exit(1);
  }
}

console.log('✅ Path compliance verified');
```

---

## 🚨 **Troubleshooting**

### **Problem: PATHS System nicht verfügbar**
```typescript
// Symptom: Cannot read property 'paths' of undefined
// Ursache: preload.ts nicht geladen oder contextBridge fehlgeschlagen

// Debug:
console.log('window.rawalite:', window.rawalite);
if (!window.rawalite?.paths) {
  console.error('❌ PATHS system not available - preload.ts issue');
}
```

### **Problem: IPC Handler fehlt**
```typescript
// Symptom: "No handler registered for 'paths:get'"
// Ursache: ipcMain.handle('paths:get') nicht in main.ts registriert

// Lösung: main.ts prüfen
ipcMain.handle('paths:get', async (event, pathType) => {
  return app.getPath(pathType);
});
```

### **Problem: Pfad-Zugriff im falschen Process**
```typescript
// ❌ FALSCH: Renderer Process versucht direkten Dateisystem-Zugriff
import fs from 'fs';  // ❌ Security Violation

// ✅ RICHTIG: Über IPC und PATHS System
const content = await window.rawalite.fs.readFile(
  await PATHS.SETTINGS_FILE()
);
```

---

## 📋 **Migration Guide**

### **Von direkten Pfaden zu PATHS**
```typescript
// ❌ ALT: Direkte Node.js APIs (nur Main Process erlaubt)
import path from 'path';
import { app } from 'electron';
const dbPath = path.join(app.getPath('userData'), 'database', 'rawalite.db');

// ✅ NEU: PATHS System (für Renderer Process PFLICHT)
import PATHS from '../lib/paths';
const dbPath = await PATHS.DATABASE_FILE();
```

### **Service Migration Checklist**
- [ ] `import path from 'path'` entfernt
- [ ] `import PATHS from '../lib/paths'` hinzugefügt
- [ ] Alle `path.join()` durch `PATHS.SPECIFIC_PATH()` ersetzt
- [ ] `app.getPath()` durch entsprechende PATHS Methode ersetzt
- [ ] Error Handling für async PATHS Aufrufe hinzugefügt

---

## 📚 **Best Practices**

### **1. Immer PATHS verwenden (Renderer)**
```typescript
// ✅ DO: Für alle Pfade PATHS verwenden
const dbPath = await PATHS.DATABASE_FILE();
const logPath = await PATHS.LOG_FILE();

// ❌ DON'T: Pfade manuell zusammenbauen
const badPath = userData + '/database/rawalite.db'; // ❌
```

### **2. Error Handling**
```typescript
// ✅ DO: PATHS Aufrufe können fehlschlagen
try {
  const dbPath = await PATHS.DATABASE_FILE();
  // ... use dbPath
} catch (error) {
  console.error('Failed to get database path:', error);
  // Fallback oder Error UI zeigen
}
```

### **3. Path Caching berücksichtigen**
```typescript
// ✅ DO: PATHS cacht Pfade automatisch
const path1 = await PATHS.DATABASE_FILE(); // IPC call
const path2 = await PATHS.DATABASE_FILE(); // Cached, kein IPC

// ✅ DO: Cache für Tests zurücksetzen
PATHS.resetCache(); // Nach jedem Test
```

### **4. Directory Creation**
```typescript
// ✅ DO: Verzeichnisse vor Verwendung erstellen
const logsDir = await PATHS.LOGS_DIR();
await PATHS.ensureDir(logsDir);
await window.rawalite.fs.writeFile(logFile, content);
```

---

## 🔗 **Verwandte Dokumentation**

- **[API Bereinigung](../05-database/LESSONS-LEARNED-API-PATH-COMPLIANCE.md)** - Lessons Learned zum PATH System
- **[Persistence Architecture](../05-database/INDEX.md)** - Database Integration mit PATHS
- **[Security Guidelines](../10-security/INDEX.md)** - Renderer/Main Process Isolation
- **[Debugging Standards](../00-standards/debugging.md)** - PATH-bezogenes Debugging

---

*Diese Dokumentation reflektiert den aktuellen, produktionsreifen Zustand des PATHS Systems (Stand: 2025-10-02)*