# ABI-Problem Lösung - PowerShell 7 Build Issues

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