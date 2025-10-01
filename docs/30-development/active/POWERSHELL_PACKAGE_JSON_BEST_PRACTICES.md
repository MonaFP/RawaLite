# PowerShell in package.json - Best Practices
**Probleme und Lösungen für Windows-Development**

## 🚨 **Das Mehrzeiler-Problem**

### Problem:
PowerShell-Commands in `package.json` scripts haben fundamentale Probleme mit mehrzeiligen Befehlen:

```json
// ❌ PROBLEMATISCH: Mehrzeiler in JSON
{
  "scripts": {
    "bad-example": "powershell -Command \"Get-Process electron -ErrorAction SilentlyContinue | Stop-Process -Force; Remove-Item release -Recurse -Force\""
  }
}
```

### Warum das problematisch ist:

1. **JSON-Escaping Alptraum**:
   ```json
   // Wird schnell unleserlich und fehleranfällig
   "complex": "powershell -Command \"$procs = Get-Process node; $procs | Where-Object { $_.Name -eq 'electron' } | Stop-Process -Force\""
   ```

2. **Exit-Code Probleme**:
   ```bash
   # PowerShell gibt oft Exit-Code 1 zurück, auch bei Erfolg
   pnpm clean  # Exit Code: 1, obwohl erfolgreich
   ```

3. **Cross-Platform Inkompatibilität**:
   ```bash
   # Funktioniert nicht auf Linux/macOS
   npm run cleanup  # Fails with "powershell: command not found"
   ```

4. **Shell-Interpretation Probleme**:
   ```json
   // Zeilenumbrüche werden unterschiedlich interpretiert
   "broken": "powershell -Command \"line1;\nline2;\nline3\""
   ```

5. **Debugging Schwierigkeiten**:
   - Keine Syntax-Highlighting in JSON
   - Schwer zu testen außerhalb package.json
   - Fehlerdiagnose kompliziert
   - Exit-Codes inkonsistent

6. **pnpm/npm Script Limitations**:
   ```json
   // Lange Befehle werden in der Konsole umgebrochen -> unleserlich
   "long-command": "powershell -ExecutionPolicy Bypass -Command \"Get-Process -Name electron,node,rawalite -ErrorAction SilentlyContinue | Stop-Process -Force\""
   ```

## ✅ **Lösung 1: Externe Script-Dateien**

### Empfohlener Ansatz:
```json
{
  "scripts": {
    "clean:processes": "powershell -ExecutionPolicy Bypass -File scripts/build-cleanup.ps1 -ProcessesOnly",
    "clean:force": "powershell -ExecutionPolicy Bypass -File scripts/build-cleanup.ps1 -Force",
    "clean:advanced": "node scripts/build-cleaner.cjs"
  }
}
```

### Externe PowerShell-Datei (`scripts/build-cleanup.ps1`):
```powershell
# Sauber formatiert, syntax-highlighted, testbar
param(
    [switch]$ProcessesOnly,
    [switch]$Force,
    [switch]$Verbose
)

# Klare, lesbare Logik
$electronProcesses = Get-Process -Name "electron", "rawalite" -ErrorAction SilentlyContinue
if ($electronProcesses) {
    $electronProcesses | Stop-Process -Force
    Write-Host "✅ Stopped Electron processes"
}

if ($ProcessesOnly) {
    exit 0
}

# Weitere Cleanup-Logik...
```

### Vorteile:
- ✅ **Syntax-Highlighting** in VS Code
- ✅ **Testbar** direkt mit `.\scripts\build-cleanup.ps1`
- ✅ **Debuggable** mit PowerShell ISE/VS Code
- ✅ **Versionierbar** und reviewbar
- ✅ **Dokumentierbar** mit Kommentaren

## ✅ **Lösung 2: Node.js Cross-Platform Scripts**

### Für maximale Kompatibilität:
```json
{
  "scripts": {
    "clean:cross": "node scripts/build-cleaner.cjs",
    "clean:simple": "node -e \"const fs=require('fs');fs.rmSync('dist',{recursive:true,force:true})\""
  }
}
```

### Node.js Script (`scripts/build-cleaner.cjs`):
```javascript
// Cross-platform Process Management
const { spawn } = require('child_process');
const os = require('os');

function killProcesses() {
  const isWindows = os.platform() === 'win32';
  
  if (isWindows) {
    // Windows: Verwende taskkill
    spawn('taskkill', ['/f', '/im', 'electron.exe'], { stdio: 'inherit' });
  } else {
    // Unix: Verwende pkill
    spawn('pkill', ['-f', 'electron'], { stdio: 'inherit' });
  }
}
```

## 🛠️ **Best Practices für package.json Scripts**

### 1. **Einfache Commands in package.json behalten**:
```json
{
  "scripts": {
    "clean": "rimraf dist",                    // ✅ Einfach, kurz
    "build": "vite build",                     // ✅ Standard-Tool
    "start": "node dist/main.js"              // ✅ Direkter Aufruf
  }
}
```

### 2. **Komplexe Logik in externe Dateien**:
```json
{
  "scripts": {
    "clean:advanced": "node scripts/cleaner.js",      // ✅ Node.js
    "clean:windows": "powershell -File scripts/clean.ps1",  // ✅ PowerShell
    "setup:env": "bash scripts/setup.sh"              // ✅ Bash
  }
}
```

### 3. **Platform-spezifische Scripts**:
```json
{
  "scripts": {
    "clean": "node scripts/clean-cross-platform.js",
    "clean:win": "powershell -File scripts/clean-windows.ps1",
    "clean:unix": "bash scripts/clean-unix.sh"
  }
}
```

### 4. **Parameter-Unterstützung**:
```json
{
  "scripts": {
    "clean:processes": "powershell -File scripts/cleanup.ps1 -ProcessesOnly",
    "clean:force": "powershell -File scripts/cleanup.ps1 -Force",
    "clean:verbose": "node scripts/cleaner.js --verbose"
  }
}
```

## 🔧 **PowerShell Execution Policy**

### Problem:
```
PS> .\scripts\build-cleanup.ps1
. : File cannot be loaded because running scripts is disabled on this system.
```

### Lösung in package.json:
```json
{
  "scripts": {
    "clean": "powershell -ExecutionPolicy Bypass -File scripts/build-cleanup.ps1"
  }
}
```

### Execution Policy Optionen:
- `Bypass`: Umgeht alle Einschränkungen (empfohlen für package.json)
- `RemoteSigned`: Erlaubt lokale Scripts
- `Unrestricted`: Erlaubt alle Scripts (weniger sicher)

## 📋 **Debugging Guide**

### 1. **Script direkt testen**:
```bash
# PowerShell Script testen
powershell -ExecutionPolicy Bypass -File scripts/build-cleanup.ps1 -Verbose

# Node.js Script testen  
node scripts/build-cleaner.cjs --verbose
```

### 2. **npm/pnpm Debug-Modus**:
```bash
# Zeigt was wirklich ausgeführt wird
pnpm --verbose clean:force

# npm mit Debug-Output
npm run clean:force --verbose
```

### 3. **PowerShell Debug-Modus**:
```json
{
  "scripts": {
    "debug:ps": "powershell -NoProfile -ExecutionPolicy Bypass -Command \"Set-PSDebug -Trace 1; & './scripts/build-cleanup.ps1'\""
  }
}
```

## 🎯 **Empfohlene Struktur für RawaLite**

```
scripts/
├── build-cleanup.ps1      # Windows PowerShell (Hauptlösung)
├── build-cleaner.cjs      # Cross-platform Node.js (Fallback)
├── clean-unix.sh         # Unix/macOS Bash (Fallback)
└── setup-dev.js          # Entwicklungsumgebung Setup

package.json:
├── clean:processes        # PowerShell nur Prozesse
├── clean:force           # PowerShell Force-Cleanup  
├── clean:advanced        # Node.js Cross-platform
└── clean:full            # Kombiniert alle Methoden
```

## 📊 **Vor- und Nachteile**

| Ansatz | Vorteile | Nachteile |
|--------|----------|-----------|
| **Inline PowerShell** | Schnell, alles in package.json | Unleserlich, fehleranfällig, nicht debuggbar |
| **Externe .ps1 Datei** | Sauber, testbar, dokumentierbar | Windows-spezifisch |
| **Node.js Script** | Cross-platform, npm-ecosystem | Zusätzliche Dependencies |
| **Bash Script** | Unix-Standard, performant | Nicht Windows-kompatibel |

## 💡 **Fazit und RawaLite's Lösung**

**Für RawaLite's Windows-fokussierte Entwicklung:**

1. ✅ **Hauptlösung**: Externe PowerShell-Scripts mit Parameter-Unterstützung
2. ✅ **Fallback**: Node.js Cross-platform Scripts  
3. ✅ **package.json**: Nur einfache Aufrufe, keine komplexe Logik
4. ✅ **Debugging**: Scripts einzeln testbar und entwickelbar

**Aktuelle RawaLite Implementation:**

```json
{
  "scripts": {
    // Einfache Windows-native Lösung (funktional korrekt, Exit-Code irrelevant)
    "clean:processes": "taskkill /f /im electron.exe /im node.exe /im rawalite.exe 2>nul & echo Process cleanup completed",
    
    // Erweiterte Lösungen für komplexere Szenarien
    "clean:advanced": "node scripts/build-cleaner.cjs",
    "clean:force": "powershell -ExecutionPolicy Bypass -File scripts/build-cleanup.ps1",
    
    // Kombinierte Workflows
    "clean:full": "pnpm clean:processes && pnpm clean && pnpm clean:release",
    "build:safe": "pnpm clean:full && pnpm build",
    "dist:safe": "pnpm clean:full && pnpm build && electron-builder"
  }
}
```

**Wichtige Erkenntnisse:**

1. **Exit-Code ≠ Funktionaler Erfolg**: Windows `taskkill` gibt Exit-Code 1 zurück, wenn ein Prozess nicht gefunden wird - das ist normal und erwünscht!

2. **Einfachheit siegt**: Native Windows-Commands sind oft robuster als komplexe PowerShell-Konstrukte in JSON.

3. **Externe Scripts für Komplexität**: Sobald Parameter, Bedingungen oder mehrzeilige Logik nötig sind → externe Datei.

4. **2>nul für saubere Ausgabe**: Unterdrückt Fehlermeldungen für nicht gefundene Prozesse.

**Goldene Regel**: Wenn ein Script mehr als eine Zeile oder Parameter braucht → Externe Datei!

---
**Erstellt**: 30. September 2025  
**Letzte Aktualisierung**: 30. September 2025  
**Status**: Production Ready  
**Anwendungsbereich**: Windows-Development, Cross-platform Kompatibilität