# ABI-Problem Lösung - PowerShell 7 Build Issues
+> **🤖 KI-AUTO-DETECTION SYSTEM:**
> - **AKTUELLER STATUS:** KNOWLEDGE_ONLY
> - **TEMPLATE-QUELLE:** 06-handbook/TEMPLATE/VALIDATED_TEMPLATE-LESSONS-LEARNED_2025-10-26.md
> - **AUTO-UPDATE:** Bei ähnlichen Problemen als Referenz nutzen
> - **STATUS-KEYWORDS:** Erkannt durch LESSON_FIX, Knowledge Base, Historical Reference
## 🚨 Problem Beschreibung

Wenn du RawaLite mit **PowerShell 7** buildest, bekommst du ABI (Application Binary Interface) Fehler bei better-sqlite3:

```
Error: The module '...\better-sqlite3\build\Release\better_sqlite3.node'
was compiled against a different Node.js version using
NODE_MODULE_VERSION 127. This version of Node.js requires
NODE_MODULE_VERSION 125.
```

## 🔍 Ursache

Das Problem entsteht weil:

1. **Deine PowerShell 7 Session** verwendet Node.js v22.18.0 (ABI 127)
2. **Electron v31.7.7** verwendet intern Node.js mit ABI 125  
3. **better-sqlite3** wird für deine Node.js Version kompiliert, nicht für Electron's Node.js Version

## ✅ Lösung

### 1. Einmalige Installation von electron-rebuild

```powershell
pnpm add -D electron-rebuild
```

### 2. Native Module für Electron neu kompilieren

Jedes Mal bevor du buildest:

```powershell
pnpm rebuild:electron
```

Oder verwende die integrierten Build-Scripts:

```powershell
# Automatisch mit electron-rebuild
pnpm build:clean
pnpm build:safe
```

### 3. Vollständiger Build-Workflow

```powershell
# 1. Alles sauber machen
pnpm clean:full

# 2. Native Module für Electron kompilieren  
pnpm rebuild:electron

# 3. Build durchführen
pnpm build

# 4. Distribution erstellen
pnpm dist
```

## 🛠️ Was passiert intern

- `electron-rebuild` kompiliert better-sqlite3 mit Electron's Node.js ABI (125)
- Statt mit deiner PowerShell Node.js ABI (127)
- Dadurch funktioniert better-sqlite3 in der Electron App

## 📋 Neue Package.json Scripts

```json
{
  "scripts": {
    "rebuild:electron": "electron-rebuild",
    "build:clean": "pnpm clean && pnpm rebuild:electron && pnpm build",
    "build:safe": "pnpm clean:full && pnpm rebuild:electron && pnpm build"
  }
}
```

## 🚀 Empfohlener Workflow für dich

Immer wenn du in PowerShell 7 buildest:

```powershell
# Sicherer Build mit automatischem ABI-Fix
pnpm build:safe
```

Das führt automatisch electron-rebuild aus und löst das ABI-Problem.

## ⚠️ Warum passiert das nur bei dir?

- VS Code/CI verwenden oft dieselbe Node.js Version wie Electron
- Deine PowerShell 7 hat neueste Node.js v22 installiert  
- Electron ist noch bei einer älteren Node.js Version

**Lösung ist einfach:** Immer `pnpm rebuild:electron` vor dem Build! 🎯

---

## 🔥 EBUSY: Resource Busy or Locked (Windows File Lock Issue)

### 🚨 Problem

Beim `pnpm dist` erscheint folgender Fehler:

```
EBUSY: resource busy or locked, copyfile 
'C:\Users\ramon\Desktop\RawaLite\dist-web\icon.png' 
=> 'C:\Users\ramon\Desktop\RawaLite\dist-release\win-unpacked\resources\icon.png'

Command failed with exit code 1
```

**Symptom:** `icon.png` kann nicht kopiert werden, weil die Datei gesperrt ist.

### 🔍 Ursache

Häufige Ursachen für Windows File Locks:

1. **Electron Dev Server läuft noch** → `icon.png` ist geladen
2. **Antivirus scannt gerade die Datei** → Windows Defender/andere AV Software
3. **Windows Explorer Thumbnail Cache** → Vorschau hält Datei offen
4. **Vorheriger Build-Prozess nicht sauber beendet** → electron-builder hält Dateien

### ✅ Lösung

#### Option 1: Prozesse sauber beenden (EMPFOHLEN)

```powershell
# Alle Electron/Node Prozesse beenden
pnpm run clean-processes

# Dann neu bauen
pnpm dist
```

#### Option 2: Vollständiger Clean Build

```powershell
# 1. Alle Prozesse killen
Get-Process | Where-Object {$_.ProcessName -match "electron|node"} | Stop-Process -Force

# 2. Vollständiger Clean
pnpm clean:full

# 3. Rebuild Native Modules
pnpm rebuild:electron

# 4. Build + Dist
pnpm build && pnpm dist
```

#### Option 3: Windows File Lock umgehen

```powershell
# Temporär Antivirus für dist-release Ordner ausschließen
# Oder: dist-release löschen und neu erstellen
Remove-Item -Path "dist-release" -Recurse -Force -ErrorAction SilentlyContinue
pnpm dist
```

### 🛠️ Permanent Fix: Pre-Dist Cleanup Script

Füge folgendes Script zu `package.json` hinzu:

```json
{
  "scripts": {
    "predist": "node scripts/prebuild-cleanup.mjs && pnpm rebuild:electron",
    "dist:safe": "pnpm clean:full && pnpm build && pnpm dist"
  }
}
```

**Vorteil:** `predist` Hook wird automatisch vor `pnpm dist` ausgeführt.

### 📋 Prävention - Best Practices

1. **Immer Dev Server stoppen vor Build:**
   ```powershell
   # Ctrl+C im Dev Terminal, dann:
   pnpm dist
   ```

2. **Windows Defender Ausnahmen setzen:**
   - `C:\Users\ramon\Desktop\RawaLite\node_modules\`
   - `C:\Users\ramon\Desktop\RawaLite\dist-release\`
   - Schnellerer Build + keine File Locks

3. **Nutze `dist:safe` statt `dist`:**
   ```powershell
   pnpm dist:safe  # Führt automatisch Cleanup durch
   ```

### 🚀 Empfohlener Dist-Workflow

```powershell
# 1. Dev Server beenden (falls läuft)
# Ctrl+C im Terminal

# 2. Vollständiger Clean + Dist
pnpm dist:safe

# Oder manuell:
pnpm clean:full
pnpm rebuild:electron
pnpm build
pnpm dist
```

### ⚠️ Wenn nichts hilft

```powershell
# Neustart hilft immer (released alle File Locks)
# Oder: Einzelne Datei entsperren mit PowerShell
$file = "C:\Users\ramon\Desktop\RawaLite\dist-release\win-unpacked\resources\icon.png"
if (Test-Path $file) { 
  Remove-Item $file -Force 
}
pnpm dist
```

**Zusammenfassung:** Hauptursache ist meist laufender Dev Server oder Antivirus. Lösung: `pnpm clean-processes` vor dist! 🎯