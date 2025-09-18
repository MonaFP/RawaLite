# 📋 CI/CD Setup - RawaLite

## GitHub Actions Workflow

### Automatischer Release bei Git Tags

Die CI/CD Pipeline triggered automatisch bei `git push origin v*` Tags und führt folgende Schritte aus:

1. **Validation Phase**
   - Version-Sync Check (`package.json` ↔ `VersionService.ts`)
   - IPC Types Validation
   - TypeScript & ESLint Checks
   - Guard Scripts (externe Links, PDF-Assets)

2. **Build Phase**
   - Windows Runner mit Node.js 20 + pnpm 10
   - `pnpm build` → Vite + Electron Bundling
   - `pnpm release:publish` → electron-builder GitHub Upload

3. **Validation Phase**
   - Release Assets Guard (latest.yml, .exe, .blockmap validieren)

### Repository Secrets Setup

**Erforderlich in Repository Settings:**

1. **GitHub Token Setup:**
   ```
   Settings → Secrets and variables → Actions → New repository secret
   ```

2. **Secret Configuration:**
   ```
   Name: GH_TOKEN
   Value: ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```

3. **Token Permissions:** 
   - `repo` (Full control of private repositories)
   - `write:packages` (falls später Packages publiziert werden)

### Manueller Release-Trigger

```powershell
# Via GitHub UI
# Actions → Build and Release → Run workflow → Enter version

# Via CLI
gh workflow run release.yml -f version=v1.7.3
```

## Lokaler Release-Workflow (Alternative)

### 1. Pre-Release Checks
```powershell
# Version synchronisieren
pnpm version:sync

# Alle Validierungen
pnpm precommit
```

### 2. Git Tag & Push
```powershell
# Tag erstellen & pushen
git tag v1.7.3
git push origin v1.7.3

# → Triggert automatische CI/CD Pipeline
```

### 3. Fallback: Manueller Build
```powershell
# Falls CI fehlschlägt: lokaler Build
$env:GH_TOKEN = "ghp_your_token_here"
pnpm build
pnpm release:publish
```

## Troubleshooting CI/CD

### ❌ "GH_TOKEN not set"
- **Ursache:** Repository Secret nicht konfiguriert
- **Lösung:** GitHub Token in Repository Secrets hinzufügen

### ❌ "Version sync failed"
- **Ursache:** package.json ≠ VersionService.ts
- **Lösung:** `pnpm version:sync` lokal ausführen & committen

### ❌ "External links found"
- **Ursache:** Verbotene externe URLs in Code
- **Lösung:** COPILOT_INSTRUCTIONS.md beachten - nur In-App Links

### ❌ "Asset upload failed"
- **Ursache:** electron-builder/GitHub API Issue
- **Lösung:** Workflow rerun oder manueller `gh release upload`

## Monitoring & Logs

### GitHub Actions Logs
```
Repository → Actions → Build and Release → Latest run
```

### Lokale Debug-Informationen
```powershell
# electron-builder Debug
$env:DEBUG = "electron-builder"
pnpm dist

# Version Debug
pnpm version:check
node -p "require('./package.json').version"
```