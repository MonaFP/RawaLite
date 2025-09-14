# 🚀 Release Process - RawaLite

## Lokaler Release-Workflow

### 1. Vorbereitung
```powershell
# GitHub Token setzen (Personal Access Token mit repo permissions)
$env:GH_TOKEN = "ghp_your_token_here"

# Version in package.json und VersionService.ts synchronisieren
pnpm version:sync
```

### 2. Build & Test
```powershell
# TypeScript Build + Lint
pnpm typecheck && pnpm lint

# Frontend + Electron Build
pnpm build

# Lokaler Installer-Build (ohne Upload)
pnpm dist
```

### 3. Release Optionen

**Dry Run (Test ohne Upload):**
```powershell
pnpm release:dry
```

**Live Release (mit GitHub Upload):**
```powershell
# Erfordert GH_TOKEN Environment Variable
pnpm release:publish
```

**Manueller Release (Fallback):**
```powershell
# 1. Assets lokal erstellen
pnpm dist

# 2. GitHub Release manuell erstellen
gh release create v1.7.3 \
  --title "v1.7.3 - Release Title" \
  --notes "Release notes here" \
  --repo MonaFP/RawaLite \
  dist/latest.yml \
  dist/RawaLite-Setup-1.7.3.exe \
  dist/RawaLite-Setup-1.7.3.exe.blockmap \
  dist/RawaLite-Setup-1.7.3.zip
```

## GitHub Actions (CI/CD)

### Setup in Repository
1. **Repository Secrets:** `Settings → Secrets → Actions`
   - Name: `GH_TOKEN`
   - Value: Personal Access Token mit `repo` permissions

2. **Workflow Trigger:** Push auf Git Tag `v*`
   ```bash
   git tag v1.7.3
   git push origin v1.7.3
   ```

### Validation Scripts
```powershell
# Version Sync Check
pnpm version:check

# Release Assets Guard
pnpm guard:release:assets

# IPC Types Validation
pnpm ipc:validate
```

## Troubleshooting

**❌ "GH_TOKEN not set"**
- Lösung: `$env:GH_TOKEN = "ghp_..."`

**❌ "404 Asset not found"**
- Lösung: Asset-Namen in `latest.yml` vs GitHub Release prüfen

**❌ "Version mismatch"**
- Lösung: `pnpm version:sync` ausführen

**❌ Build Errors**
- Lösung: `pnpm typecheck && pnpm lint` zuerst