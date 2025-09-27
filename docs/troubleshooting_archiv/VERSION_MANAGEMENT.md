# 🏷️ RawaLite - Version Management System

> **Automatisierte Versionierung und Release-Synchronisation** - Version 1.8.5+ (September 2025)

## 📋 **Überblick**

RawaLite verwendet ein **automatisiertes Version-Management System**, das alle versionsbezogenen Dateien synchron hält und manuelle Fehler bei der Versionierung verhindert. Das System basiert auf **Semantic Versioning** und unterstützt sowohl automatische als auch manuelle Versionierung.

## 🚀 **Version-Bump System (v1.8.5+)**

### **Automatische Versionierung (Empfohlen)**
```powershell
# Patch Release (1.8.5 → 1.8.6)
pnpm version:bump patch

# Minor Release (1.8.5 → 1.9.0)  
pnpm version:bump minor

# Major Release (1.8.5 → 2.0.0)
pnpm version:bump major

# Pre-Release (1.8.5 → 1.8.6-alpha.0)
pnpm version:bump prerelease --preid alpha
```

### **Dry-Run für Vorschau**
```powershell
# Vorschau ohne Datei-Änderungen
pnpm version:bump patch --dry-run

# Output:
# — Version-Bump —
#   package.json: 1.8.5 → 1.8.6
#   BUILD_DATE:   2025-09-18 → 2025-09-18
# 
# [Dry-Run] No files written.
```

## 📁 **Synchronisierte Dateien**

Das Version-Bump System aktualisiert automatisch alle relevanten Dateien:

### **1. package.json**
```json
{
  "name": "rawalite", 
  "version": "1.8.6",  ← Automatisch aktualisiert
  // ...
}
```

### **2. src/services/VersionService.ts**
```typescript
export class VersionService {
  private readonly BUILD_DATE = "2025-09-18";  ← Automatisch aktualisiert
  
  private async getPackageJsonFallback(): Promise<string | null> {
    try {
      return "1.8.6"; // ← Automatisch aktualisiert (Fallback)
    } catch (error) {
      console.error("[VersionService] Package.json fallback failed:", error);
      return null;
    }
  }
}
```

## � **Script-Integration**

### **Package.json Scripts**
```json
{
  "scripts": {
    "version:bump": "node scripts/version-bump.mjs",
    "version:bump:patch": "pnpm version:bump patch",
    "version:bump:minor": "pnpm version:bump minor", 
    "version:bump:major": "pnpm version:bump major",
    "version:check": "node validate-version-sync.mjs"
  }
}
```

### **Version-Bump Script (scripts/version-bump.mjs)**
```javascript
// Semantic Versioning Parser
function parseSemver(version) {
  const [core, pre = ""] = version.split("-");
  const [major, minor, patch] = core.split(".").map(Number);
  return { major, minor, patch, pre };
}

// Version Increment Logic
function incSemver(current, type, preid) {
  const s = parseSemver(current);
  switch (type) {
    case "major": s.major += 1; s.minor = 0; s.patch = 0; s.pre = ""; break;
    case "minor": s.minor += 1; s.patch = 0; s.pre = ""; break;
    case "patch": s.patch += 1; s.pre = ""; break;
    case "prerelease": 
      if (!s.pre) { s.patch += 1; s.pre = `${preid}.0`; }
      else {
        const [id, num] = s.pre.split(".");
        s.pre = id === preid ? `${id}.${+num + 1}` : `${preid}.0`;
      }
      break;
  }
  return `${s.major}.${s.minor}.${s.patch}${s.pre ? "-" + s.pre : ""}`;
}

// File Synchronization
async function syncFiles(newVersion) {
  // Update package.json
  const pkg = JSON.parse(await readFile("package.json", "utf8"));
  pkg.version = newVersion;
  await writeFile("package.json", JSON.stringify(pkg, null, 2) + "\n", "utf8");
  
  // Update VersionService.ts BUILD_DATE and fallback
  const serviceContent = await readFile("src/services/VersionService.ts", "utf8");
  const updatedContent = serviceContent
    .replace(/BUILD_DATE\s*=\s*["']\d{4}-\d{2}-\d{2}["']/, `BUILD_DATE = "${ISO_DATE}"`)
    .replace(/return\s+["'](\d+\.\d+\.\d+)["'];(.*)\/\/.*fallback/, `return "${newVersion}"; $2// Current package.json version as absolute fallback`);
    
  await writeFile("src/services/VersionService.ts", updatedContent, "utf8");
}
```

## 🎯 **Version-Detection System**

### **Multi-Source Version Detection**
RawaLite verwendet eine **Fallback-Kaskade** für robuste Versionserkennung:

```typescript
async getCurrentVersion(): Promise<VersionInfo> {
  // 1. PRIMARY: electron-updater IPC (most current after updates)
  let version = await this.getElectronUpdaterVersion();
  
  // 2. FALLBACK: Legacy Electron IPC
  if (!version) {
    version = await this.getElectronVersion(); 
  }
  
  // 3. EMERGENCY: Package.json fallback
  if (!version) {
    version = await this.getPackageJsonFallback();
  }
  
  // 4. ABSOLUTE: Emergency fallback
  if (!version) {
    version = "1.0.0";
  }
  
  return {
    version,
    buildNumber: await this.getBuildNumber(),
    buildDate: this.BUILD_DATE,
    isDevelopment: this.isDevelopmentMode()
  };
}
```

### **Electron IPC Version Sources**
```typescript
// Primary Source: electron-updater (post-update accurate)
private async getElectronUpdaterVersion(): Promise<string | null> {
  try {
    if (typeof window !== "undefined" && window.rawalite?.updater) {
      const versionInfo = await window.rawalite.updater.getVersion();
      return versionInfo.current;
    }
  } catch (error) {
    console.warn("[VersionService] electron-updater IPC failed:", error);
  }
  return null;
}

// Fallback: Direct Electron app.getVersion()
private async getElectronVersion(): Promise<string | null> {
  try {
    if (typeof window !== "undefined" && window.rawalite?.app) {
      return await window.rawalite.app.getVersion();
    }
  } catch (error) {
    console.warn("[VersionService] Electron IPC failed:", error);
  }
  return null;
}
```

## 📊 **Version Validation**

### **Synchronisation-Check**
```bash
# Prüfe Version-Synchronisation zwischen Dateien
pnpm version:check

# Output bei Synchronisation:
# ✅ Versions synchronized:
#    package.json: 1.8.6
#    VersionService.ts fallback: 1.8.6
#    BUILD_DATE: 2025-09-18

# Output bei Desynchronisation:
# ❌ Version mismatch detected:
#    package.json: 1.8.6
#    VersionService.ts fallback: 1.8.5  ← OUT OF SYNC
#    Fix: pnpm version:bump 1.8.6
```

### **Pre-Commit Validation**
```json
{
  "scripts": {
    "precommit": "pnpm typecheck && pnpm lint && pnpm version:check && ...",
  }
}
```

## 🔄 **Development Workflow Integration**

### **Standard Release Workflow**
```powershell
# 1. Version erhöhen
pnpm version:bump patch

# 2. Build erstellen
pnpm build && pnpm dist

# 3. Git versionieren  
git add -A
git commit -m "v1.8.6: Feature-Beschreibung"
git tag v1.8.6
git push origin main --tags

# 4. GitHub Release erstellen
gh release create v1.8.6 --title "RawaLite v1.8.6" --generate-notes \
  "release\RawaLite-Setup-1.8.6.exe" \
  "release\RawaLite-Setup-1.8.6.exe.blockmap" \
  "release\latest.yml"
```

### **Hotfix Workflow**
```powershell
# Patch für kritische Bugs
pnpm version:bump patch
# 1.8.5 → 1.8.6

# Sofortiger Release ohne Feature-Änderungen
pnpm build && pnpm dist
git add -A && git commit -m "v1.8.6: Critical bugfix"
git tag v1.8.6 && git push origin main --tags
```

### **Feature Development**
```powershell
# Minor Release für neue Features
pnpm version:bump minor  
# 1.8.5 → 1.9.0

# Major Release für Breaking Changes
pnpm version:bump major
# 1.8.5 → 2.0.0
```

## 🚨 **Common Problems & Solutions**

### **Problem: Version-Desynchronisation**
```powershell
# Symptom: package.json und VersionService.ts haben verschiedene Versionen
# Lösung: Automatische Re-Synchronisation
pnpm version:bump 1.8.6  # Explicit version target
```

### **Problem: Build-Date nicht aktualisiert**
```powershell
# Das Script aktualisiert BUILD_DATE automatisch auf aktuelles Datum
pnpm version:bump patch  # BUILD_DATE wird auf heute gesetzt
```

### **Problem: Git Tag vs. Package Version Mismatch**
```powershell
# Git Tag manuell korrigieren
git tag -d v1.8.5           # Lokalen Tag löschen
git push origin :v1.8.5     # Remote Tag löschen  
pnpm version:bump 1.8.5     # Korrekte Version setzen
git tag v1.8.5              # Neuen Tag erstellen
git push origin main --tags # Tags pushen
```

## 📋 **Version-Format Conventions**

### **Release Versions**
- **Production**: `1.8.6`, `1.9.0`, `2.0.0`
- **Pre-Release**: `1.8.6-alpha.0`, `1.9.0-beta.1`, `2.0.0-rc.1`

### **Git Tags**
- **Format**: `v1.8.6` (mit 'v' Prefix)
- **Matching**: Git tag muss exakt package.json version entsprechen

### **Commit Messages**
- **Format**: `v1.8.6: Feature-beschreibung`
- **Beispiele**: 
  - `v1.8.6: Logo-Asset-Optimierung mit ES6 Imports`
  - `v1.9.0: Neues Aktivitäten-System für Leistungsnachweise`
  - `v2.0.0: Große UI-Überarbeitung mit neuen Design-System`

## 📈 **Version History Tracking**

### **Automatische Changelog-Generierung**
```powershell
# GitHub CLI kann automatisch Release-Notes generieren
gh release create v1.8.6 --generate-notes
```

### **Manual Release Notes Template**
```markdown
## 🆕 **Neue Features:**
- Feature-Beschreibung mit User-Benefits

## 🐛 **Bug-Fixes:**
- Problem-Lösung mit Impact-Beschreibung

## 🔧 **Verbesserungen:**
- Performance, UI/UX, Developer Experience

## 📋 **Breaking Changes:**
- Migration-Hinweise (nur bei Major Releases)

## 📊 **Technical Details:**
- Build-Size: XYZ MB
- Dependencies Updated: package@version
- Platform Support: Windows x64 (NSIS Installer)
```

## 🎯 **Best Practices**

### **DO's** ✅
- **Verwende `pnpm version:bump`** für alle Versionierungen
- **Teste mit `--dry-run`** vor echten Änderungen
- **Synchronisiere Git Tags** mit package.json Version
- **Nutze Semantic Versioning** korrekt (Major.Minor.Patch)
- **Validiere mit `pnpm version:check`** vor Commits

### **DON'Ts** ❌
- **Manuelle Version-Edits** in package.json oder VersionService.ts
- **Verschiedene Versionen** in verschiedenen Dateien
- **Git Tags ohne matching package.json** Version
- **Commits ohne Version-Bump** bei Release-relevanten Änderungen
- **Overwrite von Git Tags** ohne Koordination

---

## 🎯 **Fazit**

Das automatisierte Version-Management System von RawaLite eliminiert **manuelle Fehler**, sorgt für **konsistente Versionierung** und integriert sich nahtlos in den **Development-Workflow**. Durch die **Multi-Source Version Detection** bleibt die Anwendung auch nach Updates robust und zeigt immer die korrekte Versionsinformation an.

**Key Benefits:**
- ✅ **Automatische Synchronisation** aller versionsbezogenen Dateien
- ✅ **Semantic Versioning** Compliance
- ✅ **Pre-Commit Validation** verhindert desynchronisierte Releases  
- ✅ **Robuste Version Detection** mit Fallback-Strategien
- ✅ **Integrierter Release-Workflow** mit GitHub CLI

---

*Letzte Aktualisierung: 18. September 2025*  
*Version: 1.0.0*