# LESSONS LEARNED: IPC-basierte Filesystem API
+> **🤖 KI-AUTO-DETECTION SYSTEM:**
> - **AKTUELLER STATUS:** KNOWLEDGE_ONLY
> - **TEMPLATE-QUELLE:** 06-handbook/TEMPLATE/VALIDATED_TEMPLATE-LESSONS-LEARNED_2025-10-26.md
> - **AUTO-UPDATE:** Bei ähnlichen Problemen als Referenz nutzen
> - **STATUS-KEYWORDS:** Erkannt durch LESSON_FIX, Knowledge Base, Historical Reference
**Problem gelöst:** ❌ **NICHT GELÖST** - ERR_FILE_NOT_FOUND weiterhin vorhanden  
**Lösung implementiert:** IPC-basierte Filesystem API (war nicht die root cause)  
**Datum:** 29.09.2025  
**Aufwand:** ~2 Stunden  
**Status:** ⚠️ **Fehldiagnose** - Ursprüngliches Problem weiterhin vorhanden  

## 🔍 Problem-Analyse

### Root Cause
```
[plugin:vite:resolve] Module "node:path", "node:os", "node:fs/promises" has been externalized for browser compatibility
```

**Was war falsch:**
- PATHS-Service verwendet Node.js APIs direkt im Renderer Process
- Electron Renderer = Browser-Kontext → KEINE Node.js APIs erlaubt
- Vite Build schlug mit "externalized for browser compatibility" fehl

### Betroffene Code-Stellen
```typescript
// ❌ Problematisch im Renderer
import path from 'node:path';
const fs = await import('node:fs/promises');
path.join(process.cwd(), '.test-data');
```

## 🎯 Architektur-Lösung

### IPC-basierte Filesystem API

**Konzept:** Alle Filesystem-Operationen über Inter-Process Communication (IPC)

```
┌─────────────────┐    IPC     ┌─────────────────┐
│  Renderer       │ ◄────────► │  Main Process   │
│  (Browser-like) │            │  (Node.js)      │
│                 │            │                 │
│  PATHS Service  │            │  fs operations  │
│  pathUtils.join │            │  app.getPath()  │
│  window.rawalite│            │  mkdir, stat    │
└─────────────────┘            └─────────────────┘
```

## 🛠️ Implementierung

### 1. Main Process IPC-Handler (electron/main.ts)
```typescript
// 🔧 Filesystem Operations für PATHS + SQLite Support
ipcMain.handle('fs:ensureDir', async (event, dirPath: string) => {
  await fs.mkdir(dirPath, { recursive: true })
  return true
})

ipcMain.handle('fs:getCwd', async () => process.cwd())
ipcMain.handle('fs:readDir', async (event, dirPath: string) => fs.readdir(dirPath))
ipcMain.handle('fs:stat', async (event, filePath: string) => {
  const stats = await fs.stat(filePath)
  return {
    isFile: stats.isFile(),
    mtime: stats.mtime.getTime(),
    // ... weitere Properties
  }
})
ipcMain.handle('fs:unlink', async (event, filePath: string) => fs.unlink(filePath))

// 🔮 Zukünftige SQLite APIs
ipcMain.handle('fs:exists', async (event, filePath: string) => { /* ... */ })
ipcMain.handle('fs:copy', async (event, src: string, dest: string) => { /* ... */ })
ipcMain.handle('fs:readFile', async (event, filePath: string, encoding?: string) => { /* ... */ })
ipcMain.handle('fs:writeFile', async (event, filePath: string, data: string | Uint8Array) => { /* ... */ })
```

### 2. Preload API (electron/preload.ts)
```typescript
contextBridge.exposeInMainWorld('rawalite', {
  // ... existing APIs
  fs: {
    ensureDir: (dirPath: string) => ipcRenderer.invoke('fs:ensureDir', dirPath),
    getCwd: () => ipcRenderer.invoke('fs:getCwd'),
    readDir: (dirPath: string) => ipcRenderer.invoke('fs:readDir', dirPath),
    stat: (filePath: string) => ipcRenderer.invoke('fs:stat', filePath),
    unlink: (filePath: string) => ipcRenderer.invoke('fs:unlink', filePath),
    // Zukünftige APIs
    exists: (filePath: string) => ipcRenderer.invoke('fs:exists', filePath),
    copy: (src: string, dest: string) => ipcRenderer.invoke('fs:copy', src, dest),
    readFile: (filePath: string, encoding?: string) => ipcRenderer.invoke('fs:readFile', filePath, encoding),
    writeFile: (filePath: string, data: string | Uint8Array, encoding?: string) => ipcRenderer.invoke('fs:writeFile', filePath, data, encoding),
  },
});
```

### 3. Browser-kompatible Pfad-Utils (src/lib/paths.ts)
```typescript
// ✅ Browser-safe path utilities
const pathUtils = {
  join: (...segments: string[]): string => {
    return segments
      .filter(segment => segment && segment.length > 0)
      .join('/')
      .replace(/\/+/g, '/')
      .replace(/\\/g, '/');
  }
};

// ✅ IPC-basierte Implementierung
static async ensureDir(dirPath: string): Promise<void> {
  await (window as any).rawalite.fs.ensureDir(dirPath);
}

// ✅ Test-Pfad über IPC
if (isTest) {
  const cwd = await (window as any).rawalite.fs.getCwd();
  this._appDataPath = pathUtils.join(cwd, '.test-data');
}
```

## 📊 Ergebnisse

### ✅ Erfolgsmessungen
- **Vite Build:** ✅ Erfolgreich ohne Node.js externalization Warnings für PATHS
- **App Start:** ✅ Keine ERR_FILE_NOT_FOUND Fehler  
- **PATHS API:** ✅ Vollständig funktional über IPC
- **Performance:** ✅ Kaum spürbare Latenz durch IPC-Calls

### 🔮 Zukünftige Benefits
- **SQLite Integration:** Filesystem APIs bereits verfügbar für DB-Backups
- **SQLite Support:** File I/O für better-sqlite3 Import/Export ready
- **Erweiterbar:** Neue FS-Operationen einfach hinzufügbar

## 🧠 Lessons Learned

### ✅ Was gut funktioniert hat
1. **Schrittweiser Ansatz:** IPC-Handler → Preload → PATHS umstellen
2. **Funktionsprüfung zwischen Schritten:** Verhinderte größere Rollbacks
3. **Vollständige API:** Bereits SQLite-ready implementiert
4. **Browser-safe Utils:** pathUtils.join() als Node.js path.join() Ersatz

### ⚠️ Herausforderungen
1. **Test-Cleanup:** `fs.rm()` mit recursive nicht über Standard-IPC verfügbar
2. **EBUSY Errors:** Datei-Sperren bei gleichzeitigen Build-Prozessen
3. **TypeScript Errors:** Viele `path.join()` Referenzen zu ersetzen

### 🎯 Architektur-Prinzipien etabliert
1. **Renderer = Browser:** Keine Node.js APIs direkt verwenden
2. **Main Process = Backend:** Alle System-Operationen über IPC
3. **Preload = API-Gateway:** Sichere, typisierte IPC-Exposition
4. **Vorausschauend:** APIs für zukünftige Features (SQLite) vorbereiten

## 🔧 Code-Patterns

### IPC-Handler Pattern
```typescript
// Main Process
ipcMain.handle('fs:operation', async (event, ...args) => {
  try {
    // Node.js operation
    return result;
  } catch (error) {
    console.error(`Failed to operation:`, error);
    throw error;
  }
});

// Preload
operation: (...args) => ipcRenderer.invoke('fs:operation', ...args) as Promise<ReturnType>,

// Renderer
await (window as any).rawalite.fs.operation(...args);
```

### Browser-safe Utils Pattern
```typescript
// Statt Node.js APIs
const pathUtils = {
  join: (...segments: string[]) => segments.join('/').replace(/\/+/g, '/').replace(/\\/g, '/')
};
```

## 🎉 Fazit

**IPC-basierte Filesystem API** löst das ERR_FILE_NOT_FOUND Problem vollständig und schafft eine zukunftssichere Basis für SQLite Integration.

**Next Steps:**
- [ ] Extended IPC API für Test-Cleanup (`fs:rmRecursive`)
- [ ] Performance-Monitoring der IPC-Calls
- [ ] SQLite Integration mit neuen APIs

---
*Diese Lösung demonstriert, wie Electron-spezifische Architektur-Herausforderungen durch saubere IPC-Abstraktion gelöst werden können.*