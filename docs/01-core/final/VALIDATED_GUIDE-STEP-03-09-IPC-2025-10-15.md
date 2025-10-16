# 🔌 Schritt 3-9: IPC Handler Separation

> **IPC-Handler in thematische Module** aufteilen
> 
> **Risiko:** Medium-High | **Dauer:** 5-7 Stunden | **Status:** ✅ COMPLETED

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
| 9a | `pdf-core.ts` | `pdf:generate`, `pdf:getStatus` | **Critical** | FIX-007 Theme Core |
| 9b | `pdf-templates.ts` | Template generators | **High** | FIX-007 Theme HTML |
| 9c | `pdf-attachments.ts` | Attachment systems | **High** | Field-Mapping |
| 9d | `pdf-images.ts` | Image processing | **High** | Sharp Integration |
| 9e | `validation` | Cross-references | **Medium** | Integration Tests |

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

## 🚨 **Schritt 9a: PDF Core Handlers → ipc/pdf-core.ts [CRITICAL-PHASE-1]**

### **⚠️ CRITICAL FIX-007 PHASE 1**
**PDF Core Handler** - Haupthandler `pdf:generate` und `pdf:getStatus`:

```typescript
// REFACTORMOVE: ipc/pdf-core.ts (PHASE 1)
// ipcMain.handle('pdf:generate', async (event, options: { ... }) => { ... });
// ipcMain.handle('pdf:getStatus', async () => { ... });

import './ipc/pdf-core';
```

### **FIX-007 Theme Color Extraction - MUST PRESERVE**
```typescript
// KRITISCH: Diese Zeile MUSS 1:1 erhalten bleiben in pdf-core.ts:
const primaryColor = options.theme?.theme?.primary || options.theme?.primary || '#7ba87b';
const accentColor = options.theme?.theme?.accent || options.theme?.accent || '#6b976b';
```

### **Phase 1 Scope**
- ✅ `pdf:generate` Handler (Zeilen 174-330)
- ✅ `pdf:getStatus` Handler (Zeilen 331-340)
- ✅ FIX-007 Theme-Verarbeitung
- ✅ PDF-Window Management

---

## 🚨 **Schritt 9b: PDF Template Generators → ipc/pdf-templates.ts [PHASE-2]**

### **Template Function Migration**
```typescript
// REFACTORMOVE: ipc/pdf-templates.ts (PHASE 2)
// function generateTemplateHTML(options: any): string { ... }
// function convertMarkdownToHtml(markdown: string): string { ... }

import './ipc/pdf-templates';
```

### **Phase 2 Scope**
- ✅ `generateTemplateHTML()` (Zeilen 1250-1900)
- ✅ `convertMarkdownToHtml()` (Zeilen 1375-1420)
- ✅ HTML-Template-Generierung
- ✅ Markdown-zu-HTML Konvertierung

---

## 🚨 **Schritt 9c: PDF Attachments System → ipc/pdf-attachments.ts [PHASE-3]**

### **Attachment Functions Migration**
```typescript
// REFACTORMOVE: ipc/pdf-attachments.ts (PHASE 3)
// function generateAttachmentsPage(entity: any, templateType: string): string { ... }
// function generateFullSizeAttachmentsPage(...): string { ... }
// function generateCompactAttachmentsPage(...): string { ... }

import './ipc/pdf-attachments';
```

### **Phase 3 Scope**
- ✅ `generateAttachmentsPage()` (Zeilen 580-620)
- ✅ `generateFullSizeAttachmentsPage()` (Zeilen 1125-1250)
- ✅ `generateCompactAttachmentsPage()` (Zeilen 1320-1420)
- ✅ Attachment Layout-Entscheidung

---

## 🚨 **Schritt 9d: PDF Image Processing → ipc/pdf-images.ts [PHASE-4]**

### **Image Processing Migration**
```typescript
// REFACTORMOVE: ipc/pdf-images.ts (PHASE 4)
// async function preprocessEntityAttachments(entity: any): Promise<any> { ... }
// async function optimizeImageForPDFAsync(base64Data: string): Promise<string> { ... }
// async function compressImageWithSharpAsync(...): Promise<string> { ... }

import './ipc/pdf-images';
```

### **Phase 4 Scope**
- ✅ `preprocessEntityAttachments()` (Zeilen 700-800)
- ✅ `optimizeImageForPDFAsync()` (Zeilen 650-700)
- ✅ Sharp-basierte Bildkompression
- ✅ Thumbnail-Erstellung
- ✅ Placeholder-Generierung

---

## 🚨 **Schritt 9e: PDF File Management → existing files.ts [FINAL-PHASE]**

### **File Handler Migration**
```typescript
// Diese Handler sind bereits in files.ts, nur Validierung:
// ipcMain.handle('files:saveImage', async (...) => { ... });
// ipcMain.handle('files:deleteFile', async (...) => { ... });
// ipcMain.handle('files:getImageAsBase64', async (...) => { ... });
```

### **Phase 5 Scope**
- ✅ File-Handler bereits extrahiert
- ✅ Nur Validierung der Integration
- ✅ Cross-Reference Tests

---

## ✅ **Revised Acceptance Criteria PDF (Schritte 9a-9e)**

### **Phase 1 (9a) - Core Handlers:**
- [ ] `pdf:generate` Handler mit FIX-007 erhalten
- [ ] `pdf:getStatus` Handler funktional
- [ ] Theme-Color-Extraktion 1:1 übertragen
- [ ] PDF-Window-Management erhalten

### **Phase 2 (9b) - Templates:**
- [ ] `generateTemplateHTML()` vollständig übertragen
- [ ] Markdown-Konvertierung erhalten
- [ ] Template-Styling mit Theme-Colors

### **Phase 3 (9c) - Attachments:**
- [ ] Attachment-Seiten-Generierung erhalten
- [ ] Layout-Entscheidung (Full-Size vs Compact)
- [ ] Field-Mapping Integration

### **Phase 4 (9d) - Images:**
- [ ] Sharp-basierte Kompression erhalten
- [ ] Async-Preprocessing erhalten
- [ ] Placeholder-System funktional

### **Phase 5 (9e) - Files:**
- [ ] File-Handler Integration validiert
- [ ] Cross-Module-Referenzen korrekt

### **Critical Testing nach allen Phasen:**
```bash
# Nach jeder Phase:
pnpm validate:critical-fixes

# Nach Phase 5 (komplett):
pnpm typecheck && pnpm lint && pnpm test && pnpm validate:critical-fixes

# PDF-Smoke Test:
# 1. Angebot mit Attachments erstellen
# 2. PDF exportieren mit Theme
# 3. Attachment-Seite prüfen
# 4. Theme-Farbe validieren
# Erwartung: PDF mit korrekter Theme-Farbe und Attachments
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

### **Kritische Kriterien (8, 9a-9e):**
- [ ] **Schritt 8:** FIX-012 SQLite Parameter Binding erhalten
- [ ] **Schritt 9a:** FIX-007 PDF Theme Core erhalten
- [ ] **Schritt 9b:** Template-Generierung vollständig
- [ ] **Schritt 9c:** Attachment-System vollständig  
- [ ] **Schritt 9d:** Image-Processing vollständig
- [ ] **Schritt 9e:** File-Integration validiert
- [ ] Critical Fixes Validation erfolgreich
- [ ] Dev-Smoke Tests erfolgreich

---

## 🧪 **Testing Strategy**

### **Standard Testing (Schritte 3-7)**
```bash
# Nach jedem Schritt:
pnpm typecheck && pnpm lint && pnpm test && pnpm guard:cjs && pnpm guard:pkgtype && pnpm guard:assets && pnpm validate:critical-fixes
```

### **Critical Testing (Schritte 8, 9a-9e)**
```bash
# Standard + Critical Fixes nach jeder Phase:
pnpm typecheck && pnpm lint && pnpm test && pnpm validate:critical-fixes

# Manual Testing:
# Schritt 8: DB-Operationen (CRUD für alle Entitäten)
# Schritt 9a: PDF-Core mit Theme-Validierung
# Schritt 9b: Template-HTML-Generierung
# Schritt 9c: Attachment-Seiten mit Field-Mapping
# Schritt 9d: Sharp-Bildkompression
# Schritt 9e: Complete PDF-Export Integration
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

# Schritt 9a
refactor(ipc): extract PDF core handlers to separate module [CRITICAL-FIX-007-PHASE-1]

# Schritt 9b
refactor(ipc): extract PDF template generators to separate module [FIX-007-PHASE-2]

# Schritt 9c
refactor(ipc): extract PDF attachments system to separate module [FIX-007-PHASE-3]

# Schritt 9d
refactor(ipc): extract PDF image processing to separate module [FIX-007-PHASE-4]

# Schritt 9e
refactor(ipc): validate PDF file integration completeness [FIX-007-PHASE-5]
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

### **Critical Rollback (Schritte 8, 9a-9e)**
```bash
# SOFORTIGER ROLLBACK bei Critical Fix Verlust:
git reset --hard HEAD~1

# Multi-Phase Rollback (bei PDF-Phasen):
git reset --hard HEAD~[anzahl_der_phasen]

# Validation:
pnpm validate:critical-fixes
```

---

## ➡️ **Next Steps**

Nach Schritt 9e Abschluss: [STEP-10-13-INTEGRATION.md](./STEP-10-13-INTEGRATION.md) - Integration & Cleanup

---

## 🔍 **Technical Notes**

### **File Size Targets**
- Jedes IPC-Modul: < 300 Zeilen (PDF aufgeteilt in 4 Module à ~200-250 Zeilen)
- Klare thematische Trennung
- Minimale Abhängigkeiten zwischen Modulen

### **PDF Module Breakdown**
- **pdf-core.ts:** Haupt-IPC-Handler (~250 Zeilen)
- **pdf-templates.ts:** HTML-Generierung (~280 Zeilen)  
- **pdf-attachments.ts:** Attachment-Layouts (~200 Zeilen)
- **pdf-images.ts:** Sharp-Verarbeitung (~250 Zeilen)

### **Security Considerations**
- Path-Validierung: TODO-Marker für spätere Security-Updates
- Upload-Root Validation: In files.ts erhalten
- SQL-Injection Prevention: In db.ts erhalten

### **Critical Fix Preservation**
- **FIX-007 Phase 1:** Theme-Color-Extraktion in pdf-core.ts
- **FIX-007 Phase 2:** Template-Theme-Integration in pdf-templates.ts
- **FIX-007 Phase 3:** Field-Mapping in pdf-attachments.ts
- **FIX-007 Phase 4:** Sharp-Integration in pdf-images.ts
- **FIX-012:** undefined→null Konvertierung in db.ts erhalten

---

*Erstellt: 13. Oktober 2025 | Teil des [Main.ts Refactor Plans](../MAIN-TS-REFACTOR-PLAN.md)*