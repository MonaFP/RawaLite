# 🪟 Schritt 1-2: Window Management

> **Fenster-Creation Module** extrahieren aus main.ts
> 
> **Risiko:** Low-Medium | **Dauer:** 1-2 Stunden | **Status:** ✅ COMPLETED

---

## 🎯 **Ziele**

### **Schritt 1: Main Window Extraktion**
- `createWindow()` Funktion → `windows/mainWindow.ts`
- Clean interface mit TypeScript
- Security-Settings beibehalten

### **Schritt 2: Update Manager Window Extraktion**  
- `createUpdateManagerWindow()` → `windows/updateManagerWindow.ts`
- Modal-Verhalten erhalten
- Dev-Modus Unterstützung

---

## 📝 **Schritt 1: Main Window**

### **1. Code auskommentieren in main.ts**
```typescript
// REFACTORMOVE: windows/mainWindow.ts
// function createWindow() {
//   // ... entire function ...
// }

// Import hinzufügen:
import { createMainWindow } from './windows/mainWindow';
```

### **2. windows/mainWindow.ts erstellen**
```typescript
/**
 * Main application window creation and configuration
 * Handles dev/prod loading, security settings, and window lifecycle
 */

import { BrowserWindow, app } from 'electron';
import path from 'node:path';
import { existsSync } from 'node:fs';

interface CreateMainWindowOptions {
  isDev: boolean;
}

/**
 * Creates and configures the main application window
 * @param options Configuration options including dev/prod mode
 * @returns Configured BrowserWindow instance
 */
export function createMainWindow({ isDev }: CreateMainWindowOptions): BrowserWindow {
  // Projekt-Root ermitteln:
  const rootPath = isDev ? process.cwd() : app.getAppPath();

  // Preload: im Dev aus <root>/dist-electron, im Prod neben main.cjs
  const preloadPath = isDev
    ? path.join(rootPath, 'dist-electron', 'preload.js')
    : path.join(__dirname, 'preload.js');

  // Icon-Pfad definieren - konsistent mit PATHS-System aber Main-Process kompatibel
  let iconPath: string;
  if (isDev) {
    // Development: Verwende public/ Ordner aus Projekt-Root
    iconPath = path.join(rootPath, 'public', 'rawalite-logo.png');
  } else {
    // Production: Verwende assets/ aus extraResources (definiert in electron-builder.yml)
    iconPath = path.join(process.resourcesPath, 'assets', 'icon.png');
  }

  console.log('🎯 [DEBUG] App Icon Path:', iconPath);
  console.log('🎯 [DEBUG] Icon exists:', existsSync(iconPath));

  const win = new BrowserWindow({
    width: 1280,
    height: 900,
    icon: iconPath, // App-Icon setzen
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false,
      webSecurity: true,
    },
  });

  // Security: Prevent opening external URLs
  win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));

  // Development vs Production loading
  if (isDev) {
    win.loadURL('http://localhost:5174'); // FIX-004: Port Consistency
  } else {
    win.loadFile(path.join(rootPath, 'dist-web', 'index.html'));
  }

  return win;
}
```

### **3. main.ts Aufruf anpassen**
```typescript
// ERSETZE:
// const mainWindow = createWindow();

// MIT:
const mainWindow = createMainWindow({ isDev });
```

---

## 📝 **Schritt 2: Update Manager Window**

### **1. Code auskommentieren in main.ts**
```typescript
// REFACTORMOVE: windows/updateManagerWindow.ts
// export function createUpdateManagerWindow(): BrowserWindow {
//   // ... entire function ...
// }

// Import hinzufügen:
import { createUpdateManagerWindow } from './windows/updateManagerWindow';
```

### **2. windows/updateManagerWindow.ts erstellen**
```typescript
/**
 * Update Manager window creation and configuration
 * Handles modal update manager window for update operations
 */

import { BrowserWindow, app } from 'electron';
import path from 'node:path';

/**
 * Creates the Update Manager modal window
 * @returns Configured modal BrowserWindow for update management
 */
export function createUpdateManagerWindow(): BrowserWindow {
  const isDev = !app.isPackaged;
  const rootPath = isDev ? process.cwd() : app.getAppPath();
  
  const preloadPath = isDev
    ? path.join(rootPath, 'dist-electron', 'preload.js')
    : path.join(__dirname, 'preload.js');

  const updateWindow = new BrowserWindow({
    width: 600,
    height: 500,
    modal: true,
    resizable: false,
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false,
      webSecurity: true,
    },
  });

  // Load Update Manager page
  if (isDev) {
    updateWindow.loadURL('http://localhost:5174/#/update-manager');
  } else {
    updateWindow.loadFile(path.join(rootPath, 'dist-web', 'index.html'), {
      hash: 'update-manager'
    });
  }

  return updateWindow;
}
```

---

## ✅ **Acceptance Criteria**

### **Schritt 1:**
- [ ] `createWindow()` in main.ts auskommentiert mit REFACTORMOVE-Marker
- [ ] `windows/mainWindow.ts` erstellt mit vollständiger JSDoc
- [ ] Import in main.ts hinzugefügt
- [ ] Aufruf zu `createMainWindow({ isDev })` geändert
- [ ] Security-Settings unverändert (`contextIsolation: true`, `sandbox: true`)
- [ ] FIX-004 Port 5174 erhalten
- [ ] Guards grün
- [ ] App startet erfolgreich

### **Schritt 2:**
- [ ] `createUpdateManagerWindow()` in main.ts auskommentiert
- [ ] `windows/updateManagerWindow.ts` erstellt mit JSDoc
- [ ] Modal-Verhalten erhalten
- [ ] Hash-Route für Update Manager erhalten
- [ ] Dev-Test mit `--update-manager-dev` erfolgreich
- [ ] Guards grün

---

## 🧪 **Testing Strategy**

### **Nach Schritt 1:**
```bash
# Standard Guards
pnpm typecheck && pnpm lint && pnpm test && pnpm guard:cjs && pnpm guard:pkgtype && pnpm guard:assets && pnpm validate:critical-fixes

# Dev-Smoke Test
pnpm dev:all
# Erwartung: Hauptfenster öffnet sich normal
```

### **Nach Schritt 2:**
```bash
# Standard Guards (wie oben)

# Update Manager Dev-Test
pnpm dev:all
# In separatem Terminal:
pnpm run electron:dev -- --update-manager-dev
# Erwartung: Update Manager Modal öffnet sich
```

---

## 📊 **Status Report Templates**

### **Schritt 1:**
```
[STEP 1 DONE]
Was getan: createWindow() nach windows/mainWindow.ts extrahiert, TypeScript interface, JSDoc
Risiko: low
Tests: typecheck ✅, lint ✅, test ✅, guards ✅, dev-smoke ✅
Diff-Vorschau: 
  - main.ts (createWindow auskommentiert, import hinzugefügt)
  - windows/mainWindow.ts (neu, ~80 Zeilen)
Commit: refactor(windows): extract main window creation to separate module
Bereit für Step 2? (Ja/Nein)
```

### **Schritt 2:**
```
[STEP 2 DONE]
Was getan: createUpdateManagerWindow() nach windows/updateManagerWindow.ts extrahiert
Risiko: low-medium
Tests: typecheck ✅, lint ✅, test ✅, guards ✅, update-manager-dev ✅
Diff-Vorschau:
  - main.ts (createUpdateManagerWindow auskommentiert, import hinzugefügt)
  - windows/updateManagerWindow.ts (neu, ~60 Zeilen)
Commit: refactor(windows): extract update manager window to separate module
Bereit für Step 3? (Ja/Nein)
```

---

## 🔄 **Rollback Procedures**

### **Bei Problemen in Schritt 1:**
```bash
git checkout -- electron/main.ts
Remove-Item -Path "electron/windows/mainWindow.ts" -Force
```

### **Bei Problemen in Schritt 2:**
```bash
git reset --hard HEAD~1  # Zurück zu Schritt 1
# Oder nur:
git checkout -- electron/main.ts
Remove-Item -Path "electron/windows/updateManagerWindow.ts" -Force
```

---

## ➡️ **Next Steps**

Nach Schritt 2 Abschluss: [STEP-03-09-IPC.md](./STEP-03-09-IPC.md) - IPC Handler Separation

---

## 🔍 **Technical Notes**

### **Security Considerations**
- `setWindowOpenHandler({ action: 'deny' })` verhindert externe URL-Öffnungen
- `contextIsolation: true` und `sandbox: true` müssen erhalten bleiben
- Preload-Pfad-Logik exakt beibehalten (Dev/Prod-Unterschiede)

### **Icon Path Logic**
- Dev-Modus: `public/rawalite-logo.png`
- Prod-Modus: `extraResources/assets/icon.png`
- Existenz-Check beibehalten für Debugging

### **Port Configuration**
- **CRITICAL FIX-004:** Port 5174 hardcoded erhalten
- Dev-URL: `http://localhost:5174`
- Keine Konfigurierbarkeit einführen

---

*Erstellt: 13. Oktober 2025 | Teil des [Main.ts Refactor Plans](../MAIN-TS-REFACTOR-PLAN.md)*
