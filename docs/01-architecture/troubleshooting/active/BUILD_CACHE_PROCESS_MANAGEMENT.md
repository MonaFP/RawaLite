# Build Cache & Process Management - Lösungen für RawaLite
**Problem-Behebung und Präventionsstrategien**

## 🔥 **Problem**: File-Locking bei Electron Builds

### Symptome:
```
⨯ remove C:\...\release\win-unpacked\resources\app.asar: 
  The process cannot access the file because it is being used by another process.
```

### Ursachen:
1. **Laufende Electron-Prozesse** halten `app.asar` und andere Dateien geöffnet
2. **Node.js Dev-Server** (Vite) blockiert Build-Artefakte
3. **Windows File-Locking** bei schnell aufeinanderfolgenden Builds
4. **IDE/Editor-Prozesse** scannen Build-Verzeichnisse
5. **Antivirus-Software** prüft neu erstellte `.exe` Dateien

## 🛠️ **Lösung 1**: Erweiterte Bereinigungsscripts

### Verfügbare Cleanup-Commands:

```bash
# Standard Cleanup (schnell)
pnpm clean

# Erweiterte Cleanup (mit Prozess-Management)
pnpm clean:advanced

# Force Cleanup (Windows PowerShell)
pnpm clean:force

# Vollständige Cleanup (Kombination aller Methoden)
pnpm clean:full

# Sichere Builds (mit automatischer Bereinigung)
pnpm build:safe
pnpm dist:safe
```

### Script-Hierarchie:
```
clean               → Basis-Cleanup (fast)
├── clean:advanced  → Node.js basierte erweiterte Cleanup
├── clean:force     → PowerShell Force-Cleanup (Windows)
└── clean:full      → Kombiniert alle Methoden
```

## 🛠️ **Lösung 2**: Build-Workflow Optimierung

### Empfohlene Build-Reihenfolge:

```bash
# 1. Entwicklung starten
pnpm dev                  # Normale Entwicklung

# 2. Bei Build-Problemen
pnpm clean:full          # Vollständige Bereinigung
pnpm build               # Normaler Build

# 3. Für Distribution
pnpm dist:safe           # Sichere Distribution mit Cleanup

# 4. Im Notfall (locked files)
pnpm clean:force         # Windows PowerShell Force-Cleanup
```

### Automatisierte Workflows:
- `build:safe` = Bereinigung + Build
- `dist:safe` = Bereinigung + Build + Distribution

## 🛠️ **Lösung 3**: Präventive Maßnahmen

### A) Process Management
```javascript
// Automatisches Stoppen von Electron-Prozessen vor Build
killProcesses: ['electron', 'node', 'rawalite', 'vite']
```

### B) IDE-Konfiguration
```json
// VSCode settings.json
{
  "files.watcherExclude": {
    "**/release/**": true,
    "**/dist/**": true,
    "**/dist-web/**": true,
    "**/dist-electron/**": true,
    "**/.vite/**": true
  }
}
```

### C) Antivirus-Ausnahmen
```
Verzeichnisse zur Antivirus-Whitelist hinzufügen:
- C:\Users\[USER]\Desktop\RawaLite\release\
- C:\Users\[USER]\Desktop\RawaLite\dist*\
- C:\Users\[USER]\AppData\Local\Temp\electron-*
```

## 🛠️ **Lösung 4**: Platform-spezifische Strategien

### Windows (PowerShell):
```powershell
# Robocopy Mirror-Methode (ersetzt gesperrte Verzeichnisse)
robocopy $tempDir $lockedDir /MIR /R:0 /W:0

# Handle.exe für Prozess-Identifikation
handle.exe app.asar  # Zeigt welcher Prozess die Datei sperrt
```

### ⚠️ **PowerShell Mehrzeiler-Problem**

**Problem**: PowerShell-Commands in `package.json` haben Probleme mit mehrzeiligen Befehlen, da:
- JSON-Escaping kompliziert mehrzeilige Strings
- Shell-Interpretation von Zeilenumbrüchen inkonsistent
- Cross-Platform Kompatibilität leidet

**Lösung**: Externe PowerShell-Scripts nutzen:

```json
// Schlecht: Mehrzeiler in package.json
"clean:ps": "powershell -Command \"Get-Process electron -ErrorAction SilentlyContinue | Stop-Process -Force; Remove-Item release -Recurse -Force -ErrorAction SilentlyContinue\""

// Gut: Externe Script-Datei
"clean:ps": "powershell -ExecutionPolicy Bypass -File scripts/build-cleanup.ps1"
```

### Cross-Platform (Node.js):
```javascript
// Retry-Logic mit exponential backoff
const retryCleanup = async (path, maxRetries = 3) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      await fs.rm(path, { recursive: true, force: true });
      return true;
    } catch (error) {
      await sleep(Math.pow(2, i) * 500); // 500ms, 1s, 2s
    }
  }
  return false;
};
```

## 🔧 **Build-Strategien**

### Strategie 1: "Graceful Cleanup"
```bash
# Normale Entwicklung
pnpm dev              # Standard-Entwicklung
pnpm build            # Bei sauberer Umgebung

# Problemfall
pnpm clean:advanced   # Erweiterte Bereinigung
pnpm build            # Retry Build
```

### Strategie 2: "Force Cleanup"
```bash
# Bei hartnäckigen Lock-Problemen
pnpm clean:force      # PowerShell Force-Cleanup
pnpm dist             # Distribution
```

### Strategie 3: "Safe Build"
```bash
# Produktions-Workflow
pnpm build:safe       # Sichere Build
pnpm dist:safe        # Sichere Distribution
```

## 📋 **Troubleshooting Checklist**

### Bei Build-Fehlern:
- [ ] 1. **Prozesse prüfen**: `pnpm clean:advanced`
- [ ] 2. **IDE neustarten**: VSCode/Editor schließen
- [ ] 3. **Terminal neustarten**: PowerShell/Terminal neu öffnen
- [ ] 4. **Force cleanup**: `pnpm clean:force`
- [ ] 5. **System-Neustart**: Als letzte Option

### Debugging-Commands:
```bash
# Windows: Welcher Prozess hält die Datei?
Get-Process | Where-Object {$_.Name -like "*electron*"}

# Datei-Handles anzeigen (Sysinternals Handle.exe)
handle.exe app.asar

# Verzeichnis-Permissions prüfen
icacls release\win-unpacked\resources\app.asar
```

## ⚡ **Performance-Optimierungen**

### Build-Cache Management:
```javascript
// .gitignore Ergänzungen
release/
dist/
dist-web/
dist-electron/
.vite/
node_modules/.vite/
.cache/
*.tsbuildinfo
```

### Electron-Builder Optimierungen:
```yaml
# electron-builder.yml
buildCacheDir: ".build-cache"
nodeGypRebuild: false
buildDependenciesFromSource: false
```

## 📊 **Monitoring & Alerts**

### Success Metrics:
- ✅ Build ohne File-Lock Errors
- ✅ Distribution in < 30 Sekunden
- ✅ Cleanup entfernt alle Artefakte

### Warning Signs:
- ⚠️ "Process cannot access file" Errors
- ⚠️ Build-Zeit > 2 Minuten
- ⚠️ Cleanup schlägt fehl

---

## 🎯 **Quick Reference - AKTUALISIERT nach Problemlösung**

| Problem | Command | Beschreibung |
|---------|---------|--------------|
| Standard Build | `pnpm build` | Normale Builds |
| Build Fehler | `pnpm build:safe` | Build mit Cleanup |
| **File-Lock app.asar** | **`pnpm dist:retry`** | **Distribution mit automatischem Retry** |
| **Sichere Distribution** | **`pnpm dist:safe`** | **Distribution mit Force-Cleanup** |
| Force Release Cleanup | `pnpm clean:release:force` | Entfernt gesperrte release/ Dateien |
| Debugging | `pnpm clean:advanced` | Detaillierte Cleanup |

## 🚨 **AKTUELLE BLOCKADE (30.09.2025)**

**Problem:** NSIS Installer funktioniert nicht nach erfolgreichem Build
- ✅ `pnpm dist` erstellt erfolgreich Setup-Datei (87MB)
- ❌ Setup.exe startet nicht: UAC erscheint → wird bestätigt → Installer verschwindet
- 📍 **Status:** Problem analysiert, Lösung geplant in `LESSONS-LEARNED-NSIS-INSTALLER-PROBLEMS.md`
- 🔧 **Nächster Schritt:** electron-builder.yml NSIS-Konfiguration erweitern

**Workaround:** Portable Distribution oder alternative Installer-Formate verwenden

---

## 🚨 **WICHTIGE ERKENNTNISSE**

**Problem war NICHT PowerShell-Scripts, sondern File-Handle-Management:**
- ✅ `app.asar` File-Locking durch electron-builder Prozesse
- ✅ Retry-Pattern nach 2 Sekunden löst das Problem zuverlässig  
- ✅ Force-Cleanup für release/ Verzeichnis als Backup-Lösung
- ✅ VS Code schließen vor Build als Workaround (funktioniert)

**💡 Neue Empfehlung**: Nutze `pnpm dist:retry` oder `pnpm dist:safe` als Standard!

---
**Erstellt**: 30. September 2025  
**Version**: 1.0  
**Status**: Production Ready