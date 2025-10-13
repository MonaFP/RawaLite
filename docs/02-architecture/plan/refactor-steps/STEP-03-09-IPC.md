# 🔌 Schritt 3-9: IPC Handler Separation

> **IPC-Handler in thematische Module** aufteilen
> 
> **Risiko:** Medium-High | **Dauer:** 5-7 Stunden | **Status:** PENDING

---

## 🎯 **Übersicht**

Aufteilen aller IPC-Handler aus main.ts in thematische Module. **Kritische Schritte 8-9** (DB/PDF) erfordern besondere Aufmerksamkeit für Critical Fixes.

### **IPC Module Mapping**
| Schritt | Modul | Handler | Risiko | Critical Fixes |
|---------|-------|---------|---------|----------------|
| 3 | `paths.ts` | `paths:get*` | Low | - |
| 4 | `fs.ts` | `fs:*` | Low | - |
| 5 | `files.ts` | `files:*` | Low | - |
| 6 | `numbering.ts` | `nummernkreis:*` | Medium | - |
| 7 | `backup.ts` | `backup:*` | Medium | - |
| 8 | `db.ts` | `db:*` | **High** | FIX-012 SQL Binding |
| 9 | `pdf.ts` | `pdf:*` | **High** | FIX-007 Theme System |

---

## 📝 **Schritt 3: Path IPC → ipc/paths.ts**

### **Handler Migration**
```typescript
// In main.ts auskommentieren:
// REFACTORMOVE: ipc/paths.ts
// ipcMain.handle('paths:getUserDataPath', async () => { ... });
// ipcMain.handle('paths:getAppPath', async () => { ... });
// ipcMain.handle('paths:getDownloadsPath', async () => { ... });

// Import hinzufügen:
import './ipc/paths';
```

### **ipc/paths.ts erstellen**
```typescript
/**
 * Path-related IPC handlers
 * Provides secure access to system paths for the renderer process
 */

import { ipcMain, app } from 'electron';
import path from 'node:path';
import os from 'node:os';

/**
 * Get user data directory path
 */
ipcMain.handle('paths:getUserDataPath', async (): Promise<string> => {
  return app.getPath('userData');
});

/**
 * Get application path
 */
ipcMain.handle('paths:getAppPath', async (): Promise<string> => {
  return app.getAppPath();
});

/**
 * Get downloads directory path
 */
ipcMain.handle('paths:getDownloadsPath', async (): Promise<string> => {
  return app.getPath('downloads');
});

/**
 * Get temporary directory path
 */
ipcMain.handle('paths:getTempPath', async (): Promise<string> => {
  return os.tmpdir();
});

// ... weitere Path-Handler ...
```

---

## 📝 **Schritt 4: File System IPC → ipc/fs.ts**

### **Handler Migration**
```typescript
// REFACTORMOVE: ipc/fs.ts
// ipcMain.handle('fs:ensureDir', async (event, dirPath: string) => { ... });
// ipcMain.handle('fs:getCwd', async () => { ... });
// ... alle fs:* Handler ...

import './ipc/fs';
```

### **ipc/fs.ts erstellen**
```typescript
/**
 * File system IPC handlers
 * Provides controlled file system access with security validation
 */

import { ipcMain } from 'electron';
import fs from 'node:fs/promises';
import path from 'node:path';

/**
 * Ensure directory exists, create if not
 */
ipcMain.handle('fs:ensureDir', async (event, dirPath: string): Promise<void> => {
  // TODO: Add path validation/whitelist in future security update
  await fs.mkdir(dirPath, { recursive: true });
});

/**
 * Get current working directory
 */
ipcMain.handle('fs:getCwd', async (): Promise<string> => {
  return process.cwd();
});

/**
 * Read directory contents
 */
ipcMain.handle('fs:readDir', async (event, dirPath: string): Promise<string[]> => {
  // TODO: Add path validation/whitelist in future security update
  return await fs.readdir(dirPath);
});

// ... weitere FS-Handler mit 1:1 Logik aus main.ts ...
```

---

## 📝 **Schritt 5: Files IPC → ipc/files.ts**

### **Handler Migration**
```typescript
// REFACTORMOVE: ipc/files.ts
// ipcMain.handle('files:saveImage', async (event, { fileName, base64Data }) => { ... });
// ... files:* Handler ...

import './ipc/files';
```

### **Security Considerations**
- Upload-Root Validierung **MUSS** erhalten bleiben
- Base64-Verarbeitung unverändert
- File-Extension Validierung beibehalten

---

## 📝 **Schritt 6: Numbering IPC → ipc/numbering.ts**

### **Handler Migration**
```typescript
// REFACTORMOVE: ipc/numbering.ts
// ipcMain.handle('nummernkreis:getAll', async () => { ... });
// ... nummernkreis:* Handler ...

import './ipc/numbering';
```

### **Dev-Smoke Test**
Nach Schritt 6: Nummernkreise-Funktionalität testen
```bash
# App starten
pnpm dev:all

# Manuell testen:
# 1. Einstellungen → Nummernkreise öffnen
# 2. Neuen Nummernkreis erstellen
# 3. getNext() aufrufen
# Erwartung: Funktioniert wie vorher
```

---

## 📝 **Schritt 7: Backup IPC → ipc/backup.ts**

### **Handler Migration**
```typescript
// REFACTORMOVE: ipc/backup.ts
// ipcMain.handle('backup:create', async () => { ... });
// ... backup:* Handler ...

import './ipc/backup';
```

### **Backup Service Integration**
- `BackupService` Import beibehalten
- Alle Backup-Methoden 1:1 übernehmen
- Error-Handling unverändert

---

## 🚨 **Schritt 8: Database IPC → ipc/db.ts [CRITICAL]**

### **⚠️ CRITICAL FIX-012 ACHTUNG**
**SQLite Parameter Binding Null Conversion** muss erhalten bleiben:

```typescript
// MUSS ERHALTEN BLEIBEN:
stmt.run(
  sessionId,
  eventType,
  eventData !== undefined ? JSON.stringify(eventData) : null,
  notes !== undefined ? notes : null,
  durationMs !== undefined ? durationMs : null,
  new Date().toISOString()
);
```

### **Handler Migration**
```typescript
// REFACTORMOVE: ipc/db.ts
// ipcMain.handle('db:query', async (event, sql: string, params: any[] = []) => { ... });
// ... db:* Handler ...

import './ipc/db';
```

### **Validation nach Schritt 8**
```bash
# Standard Guards
pnpm typecheck && pnpm lint && pnpm test && pnpm validate:critical-fixes

# SPEZIELL für DB:
pnpm test:critical-fixes

# Manual DB Test:
# - Kunde erstellen
# - Angebot erstellen  
# - Rechnung erstellen
# Erwartung: Keine SQLite Binding Errors
```

---

## 🚨 **Schritt 9: PDF IPC → ipc/pdf.ts [CRITICAL]**

### **⚠️ CRITICAL FIX-007 ACHTUNG**
**Parameter-based Theme System** muss 1:1 erhalten bleiben:

```typescript
// MUSS ERHALTEN BLEIBEN in ipc/pdf.ts:
private getThemeColor(theme: string): string {
  const themeColors: Record<string, string> = {
    'default': '#2D5016',     // Standard - Tannengrün
    'sage': '#9CAF88',        // Salbeigrün  
    'sky': '#87CEEB',         // Himmelblau
    'lavender': '#DDA0DD',    // Lavendel
    'peach': '#FFCBA4',       // Pfirsich
    'rose': '#FFB6C1'         // Rosé
  };
  return themeColors[theme] || themeColors['default'];
}

getCurrentPDFTheme(): string {
  return this.currentTheme || 'default';
}
```

### **Handler Migration**
```typescript
// REFACTORMOVE: ipc/pdf.ts
// ipcMain.handle('pdf:generate', async (event, { type, data, options }) => { ... });
// ... pdf:* Handler + HTML-Generatoren ...

import './ipc/pdf';
```

### **Dependencies Migration**
```typescript
// In ipc/pdf.ts lokal importieren:
import { dialog } from 'electron';
import sharp from 'sharp';
import os from 'node:os';
import path from 'node:path';
// ... alle PDF-bezogenen Dependencies
```

### **Dev-Smoke Test nach Schritt 9**
```bash
# Standard Guards + FIX-007 Validation
pnpm validate:critical-fixes

# PDF-Smoke Test:
# 1. Angebot erstellen
# 2. PDF exportieren
# 3. Theme-Farbe prüfen (sollte korrekt sein)
# Erwartung: PDF mit korrekter Theme-Farbe
```

---

## ✅ **Acceptance Criteria pro Schritt**

### **Allgemeine Kriterien (3-7):**
- [ ] Handler in main.ts auskommentiert mit REFACTORMOVE-Marker
- [ ] Neues IPC-Modul erstellt mit JSDoc
- [ ] Import in main.ts hinzugefügt  
- [ ] 1:1 Logik-Übertragung (keine Änderungen)
- [ ] TypeScript-Typen erhalten
- [ ] Guards grün

### **Kritische Kriterien (8-9):**
- [ ] **Schritt 8:** FIX-012 SQLite Parameter Binding erhalten
- [ ] **Schritt 9:** FIX-007 PDF Theme System erhalten
- [ ] Critical Fixes Validation erfolgreich
- [ ] Dev-Smoke Tests erfolgreich

---

## 🧪 **Testing Strategy**

### **Standard Testing (Schritte 3-7)**
```bash
# Nach jedem Schritt:
pnpm typecheck && pnpm lint && pnpm test && pnpm guard:cjs && pnpm guard:pkgtype && pnpm guard:assets && pnpm validate:critical-fixes
```

### **Critical Testing (Schritte 8-9)**
```bash
# Standard + Critical Fixes:
pnpm typecheck && pnpm lint && pnpm test && pnpm validate:critical-fixes
pnpm test:critical-fixes

# Manual Testing:
# Schritt 8: DB-Operationen (CRUD für alle Entitäten)
# Schritt 9: PDF-Export mit Theme-Validierung
```

---

## 📊 **Commit Messages**

```bash
# Schritt 3
refactor(ipc): extract path handlers to separate module

# Schritt 4  
refactor(ipc): extract file system handlers to separate module

# Schritt 5
refactor(ipc): extract file upload handlers to separate module

# Schritt 6
refactor(ipc): extract numbering system handlers to separate module

# Schritt 7
refactor(ipc): extract backup handlers to separate module

# Schritt 8
refactor(ipc): extract database handlers to separate module [CRITICAL-FIX-012]

# Schritt 9
refactor(ipc): extract PDF handlers to separate module [CRITICAL-FIX-007]
```

---

## 🔄 **Rollback Procedures**

### **Standard Rollback (Schritte 3-7)**
```bash
# Einzelschritt zurück:
git reset --hard HEAD~1

# Modul löschen:
Remove-Item -Path "electron/ipc/[modulname].ts" -Force
```

### **Critical Rollback (Schritte 8-9)**
```bash
# SOFORTIGER ROLLBACK bei Critical Fix Verlust:
git reset --hard HEAD~1

# Validation:
pnpm validate:critical-fixes
```

---

## ➡️ **Next Steps**

Nach Schritt 9 Abschluss: [STEP-10-13-INTEGRATION.md](./STEP-10-13-INTEGRATION.md) - Integration & Cleanup

---

## 🔍 **Technical Notes**

### **File Size Targets**
- Jedes IPC-Modul: < 300 Zeilen
- Klare thematische Trennung
- Minimale Abhängigkeiten zwischen Modulen

### **Security Considerations**
- Path-Validierung: TODO-Marker für spätere Security-Updates
- Upload-Root Validation: In files.ts erhalten
- SQL-Injection Prevention: In db.ts erhalten

### **Critical Fix Preservation**
- **FIX-007:** Theme-Mapping vollständig übertragen
- **FIX-012:** undefined→null Konvertierung erhalten
- **Alle SQL-Fixes:** Bei DB-Migration besonders achten

---

*Erstellt: 13. Oktober 2025 | Teil des [Main.ts Refactor Plans](../MAIN-TS-REFACTOR-PLAN.md)*