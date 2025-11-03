# 🚫 Project Core Rules - Unverhandelbare Regeln

> **Erstellt:** 26.10.2025 | **Letzte Aktualisierung:** 03.11.2025 (PowerShell-Redirect-Fehler Troubleshooting + IPC Error Handling)  
> **Status:** Reference | **Typ:** Core Project Rules + Troubleshooting Guide  
> **Schema:** `VALIDATED_REFERENCE-PROJECT-CORE-RULES_2025-10-26.md`  
> **Source:** Original VALIDATED_TEMPLATE-CODING-RULES_2025-10-26.md → Reference Content

## 🤖 **KI-AUTO-DETECTION SYSTEM**

**🎯 STATUS DETECTION KEYWORDS:**
- `Core Project Rules` → **REFERENCE-CRITICAL** - Unverhandelbare Projektregeln
- `Reference` → **STABLE REFERENCE** - Verlässliche KI-Orientierung  
- `Unverhandelbare Regeln` → **NON-NEGOTIABLE** - Absolute Einhaltung erforderlich
- `session-kritische Referenz` → **SESSION-ESSENTIAL** - Für jede KI-Session erforderlich

**📖 TEMPLATE SOURCE:** [VALIDATED_TEMPLATE-KI-AUTO-DETECTION-SYSTEM_2025-10-26.md](../TEMPLATE/VALIDATED_TEMPLATE-KI-AUTO-DETECTION-SYSTEM_2025-10-26.md)  
**🔄 AUTO-UPDATE TRIGGER:** Core rules änderungen, neue Projektregeln, Critical-Fixes Updates  
**🤖 KI-VERHALTENSREGELN (AUTO-AKTIV basierend auf Status):**
- ✅ **REFERENCE-PRIORITY:** Nutze als primäre Regel-Quelle bei allen Code-Änderungen
- ✅ **COMPLIANCE-CHECK:** Überprüfe alle Änderungen gegen diese Regeln
- ✅ **VIOLATION-PREVENTION:** Stoppe bei Regelverletzungen sofort
- ❌ **FORBIDDEN:** Diese Regeln brechen oder umgehen

## 📋 **SCHEMA-ÜBERSICHT nach KI-PRÄFIX-ERKENNUNGSREGELN**

### **STATUS-PRÄFIX:** `VALIDATED_`
- **Bedeutung:** Validierte, stabile Dokumentation (verlässliche Quelle)
- **KI-Verhalten:** Behandelt als verlässliche Quelle für Core Project Rules

### **TYP-KATEGORIE:** `REFERENCE-`
- **Verwendung:** Core project rules als session-kritische Referenz
- **Purpose:** Unverhandelbare Projektregeln für KI-Sessions

> **🎯 QUICK REFERENCE - Unveränderliche Projektregeln**  
> **Zweck:** Core project rules als session-kritische Referenz  
> **Usage:** Read-only reference für jede Session  
> **Current Version:** v1.0.63 (verified 27.10.2025)

## 🚨 **CORE PROJECT RULES (NICHT VERHANDELBAR)**

### **📦 Package Manager:**
- ✅ **ONLY PNPM** - never npm or yarn
- ✅ Use `pnpm safe:version patch/minor/major` - NEVER `pnpm version` directly

### **🗂️ Paths System:**
- ✅ **Renderer Process:** Only via `src/lib/paths.ts` (PATHS)
- ✅ **Main Process:** May use `app.getPath()` (native Electron APIs)
- ✅ **IPC Bridge:** `electron/ipc/paths.ts` for Renderer-Main communication
- ❌ **FORBIDDEN:** Direct `app.getPath()` in Renderer Process

### **🗄️ Database & Persistence:**
- ✅ **Primary:** SQLite (better-sqlite3) - Native module for performance
- ✅ **Entry Point:** `src/persistence/index.ts`
- ✅ **ALWAYS:** Use field-mapper for SQL queries (`convertSQLQuery()`)
- ✅ **ALWAYS:** Use DatabaseThemeService for theme operations
- ❌ **FORBIDDEN:** Direct imports `SQLiteAdapter`/`DexieAdapter`
- ❌ **FORBIDDEN:** Hardcoded snake_case SQL
- ❌ **FORBIDDEN:** String concatenation in SQL queries

### **⚡ Environment Detection:**
- ✅ **Electron:** `!app.isPackaged` for environment detection
- ❌ **FORBIDDEN:** `process.env.NODE_ENV` in Electron context

### **🔒 External Links & Security:**
- ❌ **FORBIDDEN:** `shell.openExternal`, external links, `window.open`, `target="_blank"`
- ✅ **All in-app** - no external navigation

### **🔧 ABI & Native Modules:**
- ✅ **Emergency Fix:** `pnpm remove better-sqlite3 && pnpm add better-sqlite3@12.4.1 && node scripts/BUILD_NATIVE_ELECTRON_REBUILD.cjs`
- ✅ **Before dev start:** Stop all processes: `taskkill /F /IM node.exe && taskkill /F /IM electron.exe`

### **🛡️ CRITICAL FIX PATTERNS (NEVER REMOVE):**
- ✅ Promise-based WriteStream completion patterns
- ✅ File system flush delays (≥100ms)
- ✅ Event handler cleanup before adding new ones
- ✅ Port 5174 consistency in development
- ✅ Theme system schema validation
- ✅ Migration 027 integrity protection

## 🚫 **ANTI-PATTERNS QUICK REFERENCE**

### **NEVER DO (Session Killers):**
❌ Use npm or yarn commands  
❌ Direct app.getPath() in Renderer Process  
❌ External links or shell.openExternal  
❌ Hardcoded SQL strings without field-mapper  
❌ Direct theme table access outside service  
❌ Remove Promise-based WriteStream patterns  
❌ Skip validation scripts before releases  
❌ Change port 5174 in development  
❌ Use pnpm version directly (use pnpm safe:version)  
❌ String concatenation in SQL queries  
❌ Modify Migration 027 without team approval  

## 🚨 **POWERSHELL REDIRECT & IPC FEHLER TROUBLESHOOTING**

### **Problem: PowerShell-Redirect-Fehler bei IPC-Kommunikation**

**Symptome:**
- ❌ `Error: Redirect from ... to ... failed`
- ❌ Fetch-Fehler bei GitHub-Asset-Downloads
- ❌ UpdateManager erhält falsche Content-Type Header
- ❌ Temp-Files werden ohne `.exe` Extension gespeichert
- ❌ IPC-Renderer requests erhalten Redirect-Fehler

**Root Cause:**
```
GitHub Release URLs → HTTP 302 Redirect zu CDN
→ PowerShell/Fetch ohne redirect: 'follow' → Request bricht ab
→ Temp-file wird ohne Extension gespeichert
→ UpdateManager kann Datei nicht ausführen
```

### **SOFORT-FIX: GitHubApiService Download-Handler**

**Korrekt implementiert (v1.0.42+):**
```typescript
// src/main/services/GitHubApiService.ts
const response = await fetch(downloadUrl, {
  headers: { 'Accept': 'application/octet-stream' },
  redirect: 'follow'  // ✅ KRITISCH - GitHub Redirects folgen!
});

if (!response.ok) {
  throw new Error(`Download failed: ${response.status}`);
}

const buffer = await response.arrayBuffer();
const writeStream = fs.createWriteStream(destPath);
await new Promise((resolve, reject) => {
  writeStream.on('finish', resolve);
  writeStream.on('error', reject);
  writeStream.write(Buffer.from(buffer));
  writeStream.end();
});
```

**Häufige Fehler (NEVER DO):**
```typescript
// ❌ FALSCH: Kein redirect: 'follow'
const response = await fetch(downloadUrl);

// ❌ FALSCH: Falsche Content-Type Handling
const response = await fetch(downloadUrl, {
  headers: { 'Accept': 'application/json' }
});

// ❌ FALSCH: Synchroner WriteStream (Race Conditions)
fs.writeFileSync(destPath, buffer);

// ❌ FALSCH: Kein Promise-Wrapper für Completion
writeStream.write(buffer);
writeStream.end(); // Keine Garantie für Completion!
```

### **IPCHANDLER-REDIRECT PATTERN (Async/Await)**

**Korrekt implementiert:**
```typescript
// electron/ipc/database.ts oder electron/ipc/updates.ts
ipcMain.handle('get-release-asset', async (event, { url, filename }) => {
  try {
    // ✅ Mit redirect: 'follow'
    const response = await fetch(url, {
      headers: { 'Accept': 'application/octet-stream' },
      redirect: 'follow'  // MANDATORY für GitHub CDN!
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const buffer = await response.arrayBuffer();
    const destPath = path.join(app.getPath('temp'), filename);
    
    // Promise-wrapped WriteStream
    return new Promise((resolve, reject) => {
      const stream = fs.createWriteStream(destPath);
      stream.on('finish', () => resolve(destPath));
      stream.on('error', reject);
      stream.write(Buffer.from(buffer));
      stream.end();
    });
  } catch (error) {
    return { error: error.message };
  }
});
```

### **RENDERER IPC-CALL PATTERN (Safe Error Handling)**

**Korrekt implementiert:**
```typescript
// src/services/UpdateService.ts oder src/lib/api.ts
export const downloadReleaseAsset = async (
  url: string, 
  filename: string
): Promise<string> => {
  try {
    const result = await window.electronAPI.invoke('get-release-asset', {
      url,
      filename
    });
    
    if (result.error) {
      throw new Error(`Download failed: ${result.error}`);
    }
    
    return result;
  } catch (error) {
    console.error('❌ Asset download error:', error);
    throw error;
  }
};
```

### **Validation Checklist für Download-Funktionen**

- [ ] ✅ `redirect: 'follow'` in allen Fetch-Calls
- [ ] ✅ `'Accept': 'application/octet-stream'` Header gesetzt
- [ ] ✅ Promise-Wrapper um WriteStream (nicht sync!)
- [ ] ✅ `.on('finish')` Resolver für Completion
- [ ] ✅ Error-Handler auf WriteStream registriert
- [ ] ✅ IPC-Handler sind `async` (nicht sync)
- [ ] ✅ Renderer nutzt `window.electronAPI.invoke()` (nicht send)
- [ ] ✅ Temp-filenames enthalten korrekte Extensions (.exe, .zip, etc)

### **Häufige Fehlermeldungen & Lösungen**

| Error | Root Cause | Lösung |
|:--|:--|:--|
| `TypeError: fetch failed` | redirect: 'follow' fehlt | Füge `redirect: 'follow'` hinzu |
| `Content-Type: text/html` | Wrong Accept header | Nutze `'application/octet-stream'` |
| `.tmp statt .exe` | Filename ohne Extension | Übergib vollständigen Filename mit ext |
| `WriteStream not finished` | Keine Promise/completion-wait | Nutze WriteStream Promises |
| `ENOENT: file not found` | Temp-path Rendering-Issue | Nutze `app.getPath('temp')` im Main |
| `Redirect loop detected` | Circular redirect | URL-Validierung vor Request |

### **TESTING: GitHub Redirect Follow-Verhalten**

```powershell
# Test in PowerShell - GitHub Redirect Simulation
$url = "https://github.com/MonaFP/RawaLite/releases/download/v1.0.72/RawaLite-Setup-1.0.72.exe"

# Mit Redirect-Folgen (funktioniert)
$result = Invoke-WebRequest -Uri $url -UseBasicParsing -FollowRelLink
Write-Host "✅ Download erfolgreich mit FollowRelLink"

# Ohne Redirect-Folgen (fehlgeschlagen)
try {
  $result = Invoke-WebRequest -Uri $url -UseBasicParsing
  Write-Host "❌ Sollte fehlschlagen ohne FollowRelLink"
} catch {
  Write-Host "✅ Erwarteter Fehler ohne FollowRelLink: $($_.Exception.Message)"
}
```

### **NodeJS Fetch API vs PowerShell Unterschiede**

| Aspekt | Node.js Fetch | PowerShell | Verhalten |
|:--|:--|:--|:--|
| Redirects | `redirect: 'follow'` | `-FollowRelLink` | Must explicitly enable |
| Headers | `headers: { ... }` | `-Headers @{ ... }` | Different syntax |
| Accept | `'application/octet-stream'` | `application/octet-stream` | Same purpose |
| Temp Files | `fs.createWriteStream()` | `Out-File` | Different APIs |
| Error Handling | try/catch + Promise | try/catch + exceptions | Similar flow |

---

## 🎯 **VALIDATION COMMANDS**

```bash
# Vor jeder Code-Änderung:
pnpm validate:critical-fixes

# Vor Documentation-Änderungen:
pnpm validate:docs-structure

# Vor Releases:
pnpm validate:critical-fixes && pnpm validate:docs-structure

# Sichere Version-Befehle:
pnpm safe:version patch  # MANDATORY - nie pnpm version direkt!  
pnpm safe:dist
```

---

**📍 Location:** `docs/06-handbook/REFERENCE/VALIDATED_REFERENCE-PROJECT-CORE-RULES_2025-10-26.md`  
**Purpose:** Core project rules reference + PowerShell-Redirect troubleshooting guide  
**Access:** 06-handbook reference system  
**Related:** 
- [Filesystem Paths Patterns](VALIDATED_REFERENCE-FILESYSTEM-PATHS-PATTERNS_2025-10-26.md) (Code-Implementierung)
- [Documentation Paths](VALIDATED_REFERENCE-DOCUMENTATION-PATHS_2025-10-26.md) (Dokumentations-Navigation)
- [Database Schema](VALIDATED_REFERENCE-DATABASE-SCHEMA-CURRENT_2025-10-26.md)
- [Critical Fixes](VALIDATED_REFERENCE-CRITICAL-FIXES-CURRENT_2025-10-26.md)
- [IPC Architecture](VALIDATED_REFERENCE-IPC-ARCHITECTURE_2025-10-26.md) (IPC-Pattern Reference)