# Electron Builder File-Locking & Native Module Issues

> **Status:** 🔴 UNGELÖST  
> **Betroffen:** Windows-Development mit VS Code  
> **Erstellt:** 30. September 2025  
> **Letztes Update:** 30. September 2025

---

## 🎯 Problem-Zusammenfassung

Beim Build-Prozess von RawaLite treten zwei kritische Probleme auf:

1. **File-Locking Problem**: electron-builder kann `app.asar` nicht überschreiben
2. **Better-SQLite3 Bindings**: `Cannot find module 'bindings'` bei gepackter App

---

## 🔍 Root Cause Analysis

### Problem 1: File-Locking
```
⨯ remove C:\Users\...\release\win-unpacked\resources\app.asar: 
Der Prozess kann nicht auf die Datei zugreifen, da sie von einem anderen Prozess verwendet wird.
```

**Ursache:** VS Code oder andere Prozesse halten Handles auf die Build-Artefakte.

### Problem 2: Better-SQLite3 Bindings
```
❌ Failed to initialize application: Error: Cannot find module 'bindings'
Require stack:
- app.asar\node_modules\better-sqlite3\lib\database.js
```

**Ursache:** Native Module werden im asar-Archiv gepackt und können zur Laufzeit nicht geladen werden.

---

## 🔧 Lösungsoptionen

### Sofort-Lösungen (File-Locking)

| Option | Aufwand | Empfehlung | Beschreibung |
|--------|---------|------------|-------------|
| **VS Code schließen** | Niedrig | 🟡 Temporär | VS Code vor Build beenden |
| **Anderen Output-Ordner** | Niedrig | 🟢 Empfohlen | `output: dist-release` |
| **Directory Build** | Niedrig | 🟢 Für Tests | `npx electron-builder --dir` |
| **Process Kill Script** | Niedrig | 🟡 Riskant | Automatisches Handle-Cleanup |

### Dauerhaft-Lösungen (Better-SQLite3)

| Option | Aufwand | Empfehlung | Beschreibung |
|--------|---------|------------|-------------|
| **asarUnpack** | Mittel | 🟢 Standard | Native Module aus asar entpacken |
| **Zurück zu sql.js** | Hoch | 🔴 Rückschritt | Wie v1.0.0, aber Performance-Verlust |
| **External Resources** | Hoch | 🟡 Komplex | Native Module als extraFiles |
| **Alternative Library** | Hoch | 🔴 Aufwändig | sqlite3 oder andere Library |

---

## 📋 Aktueller Workaround

**Funktioniert:** Development Mode (`pnpm dev`)  
**Funktioniert nicht:** Production Build (`pnpm dist`)  
**Grund:** better-sqlite3 bindings Problem in gepackter App

---

## 🚀 Empfohlener Lösungsweg

### Phase 1: Sofort (File-Locking)
```yaml
# electron-builder.yml
directories:
  output: dist-release  # Statt 'release'
```

### Phase 2: Dauerhaft (Better-SQLite3)
```yaml
# electron-builder.yml
asarUnpack:
  - "node_modules/better-sqlite3/**/*"
  - "node_modules/bindings/**/*"
  - "node_modules/file-uri-to-path/**/*"
```

### Phase 3: Automation
```powershell
# Vor Build: Prozesse killen
Get-Process | Where-Object {$_.ProcessName -match "electron"} | Stop-Process -Force
pnpm dist
```

---

## 📚 Referenzen

- **Git-Historie:** v1.0.0 (48c2efbb) verwendete sql.js ohne native Module
- **Electron-Builder Docs:** [asarUnpack Configuration](https://www.electron.build/configuration/configuration#configuration)
- **Better-SQLite3 Docs:** [Electron Packaging](https://github.com/WiseLibs/better-sqlite3/blob/master/docs/troubleshooting.md)

---

## ⚠️ Bekannte Einschränkungen

- **File-Locking tritt nur unter Windows auf**
- **VS Code Development Server verschärft das Problem**
- **Better-SQLite3 v12.4.1 hat bekannte Electron-Packaging-Issues**

---

## 🔄 Nächste Schritte

1. **Sofort:** Output-Ordner ändern für Workaround
2. **Kurz:** asarUnpack Konfiguration implementieren
3. **Lang:** CI/CD Pipeline robuster gestalten
4. **Optional:** Zurück zu sql.js als Fallback evaluieren

---

## 📝 Testing-Protokoll

| Test | Status | Notizen |
|------|--------|---------|
| `pnpm build` | ✅ OK | TypeScript/Vite Build erfolgreich |
| `pnpm dev` | ✅ OK | Development Mode funktioniert |
| `npx electron-builder --dir` | ⚠️ Teilweise | Build OK, aber bindings-Fehler |
| `pnpm dist` | ❌ Fehler | File-Locking verhindert Build |
| Installed App | ❌ Fehler | Cannot find module 'bindings' |
