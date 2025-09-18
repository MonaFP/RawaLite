# GitHub Release Guidelines - RawaLite

## ⚠️ **KRITISCHE WARNUNG: Asset-Anforderungen**

### **🚨 NIEMALS Release ohne Assets erstellen!**
- ❌ **Problem**: Release v1.8.5 **✅ UMFASSENDE Lösung - electron-builder.yml**:
```yaml
win:
  icon: assets/icon.ico
  target:
    - target: nsis
      arch: x64
  publisherName: "Your Publisher Name"
  # 🔧 CRITICAL FIX: Disable code signature verification for unsigned builds
  verifyUpdateCodeSignature: false

# Additional builder-level options
forceCodeSigning: false
electronUpdaterCompatibility: ">=2.16"

nsis:
  # NSIS signature handling
  differentialPackage: false
  warningsAsErrors: false
```

**✅ RUNTIME-Absicherung in electron/main.ts** (empfohlen als Fallback):
```typescript
// 🔧 COMPREHENSIVE SAFETY: All known signature verification parameters
try {
  // Primary signature verification flags
  (autoUpdater as any).verifySignature = false;
  (autoUpdater as any).signVerify = false;
  
  // Windows-specific signature options
  (autoUpdater as any).verifyUpdateCodeSignature = false;
  (autoUpdater as any).allowInsecureConnection = true;
  (autoUpdater as any).disableKeychain = true;
  
  // Force accept unsigned updates
  (autoUpdater as any).allowUnsigned = true;
  (autoUpdater as any).skipSignatureVerification = true;
  
  log.info("🔧 [RUNTIME] Comprehensive signature verification disabled");
} catch (error) {
  log.warn("⚠️  [RUNTIME] Could not set all signature options:", error);
}
```t.yml` erstellt  
- ❌ **Folge**: Auto-Update-System funktioniert nicht
- ❌ **Fehler**: `Cannot find latest.yml in the latest release artifacts`

### **✅ Erforderliche Assets für JEDEN Release:**
1. `RawaLite-Setup-X.Y.Z.exe` (Hauptinstaller)
2. `RawaLite-Setup-X.Y.Z.exe.blockmap` (Update-Verification) 
3. `latest.yml` (Auto-Update Metadaten) **← KRITISCH!**

**Ohne diese Assets ist das Release defekt für bestehende Benutzer!**

---

## 🚨 **Wichtige Datenschutz-Richtlinien**

### **Was NICHT in Release-Beschreibungen gehört:**
❌ **Persönliche Hardware-Daten**: 
- Spezifische Computer-Namen (z.B. "ASUS MONAPC")
- Hardware-Spezifikationen (z.B. "16GB RAM")
- Persönliche Entwicklungsumgebung-Details

❌ **Spezifische Software-Versionen**: 
- Genaue VS Code Versionen (z.B. "v1.103.2")
- Entwickler-spezifische Tool-Versionen

❌ **Interne Entwicklungsdetails**:
- Spezifische Ordnerpfade vom Entwicklungsrechner
- Interne Debug-Informationen
- Persönliche Workspace-Konfiguration

### **Was in Release-Beschreibungen gehört:**
✅ **Feature-Beschreibungen**:
- Neue Funktionen und Verbesserungen
- Bug-Fixes und Stabilitätsverbesserungen
- Benutzer-relevante Änderungen

✅ **Technische Mindestanforderungen** (generisch):
- "Node.js 20.x oder höher"
- "Windows 10/11 mit PowerShell"
- "Latest LTS Versionen empfohlen"

✅ **Update-Hinweise**:
- Breaking Changes für Benutzer
- Migrations-Hinweise
- Backup-Empfehlungen

## 🔄 **Release-Erstellungs-Workflow**

### **1. Vorbereitung**
```powershell
# Version automatisch erhöhen (empfohlen)
pnpm version:bump patch    # oder minor/major

# ODER manuell:
# Version in package.json aktualisieren
# Version in src/services/VersionService.ts aktualisieren (getPackageJsonFallback)
# Build-Datum in VersionService.ts aktualisieren (BUILD_DATE)
```

### **2. 🚨 KRITISCH: Build mit Assets erstellen**
```powershell
# Alle Prozesse beenden die Dateien blockieren könnten
taskkill /F /IM "electron.exe" 2>$null
taskkill /F /IM "RawaLite.exe" 2>$null

# Vollständigen Build mit Assets erstellen
pnpm build && pnpm dist

# ✅ WICHTIG: Prüfen dass alle Assets vorhanden sind:
ls release\*Setup*.exe     # RawaLite-Setup-X.Y.Z.exe
ls release\*.blockmap      # RawaLite-Setup-X.Y.Z.exe.blockmap  
ls release\latest.yml      # KRITISCH für Auto-Update!

# ❌ NIEMALS Release ohne diese Dateien erstellen!
# Auto-Update funktioniert nicht ohne latest.yml
```

### **3. Git vorbereiten**
```powershell
# Änderungen committen und taggen
git add -A
git commit -m "vX.Y.Z: Feature-Beschreibung"
git tag vX.Y.Z
git push origin main --tags
```

### **4. GitHub Release mit Assets erstellen**
```powershell
# 🚨 KRITISCH: Release MIT allen Assets erstellen
& "C:\Program Files\GitHub CLI\gh.exe" release create vX.Y.Z \
  --title "RawaLite vX.Y.Z - Feature-Name" \
  --notes "
🆕 **Neue Features:**
- Feature 1 Beschreibung
- Feature 2 Beschreibung

🐛 **Bug-Fixes:**
- Fix 1 Beschreibung
- Fix 2 Beschreibung

🔧 **Verbesserungen:**
- Verbesserung 1
- Verbesserung 2

📋 **System-Anforderungen:**
- Windows 10/11
- Node.js 20.x+
- PowerShell 7.x (empfohlen)

💾 **Update-Hinweise:**
Automatische Datenbank-Migration enthalten.
Kein manueller Eingriff erforderlich.
" \
  --repo MonaFP/RawaLite \
  "release\RawaLite-Setup-X.Y.Z.exe" \
  "release\RawaLite-Setup-X.Y.Z.exe.blockmap" \
  "release\latest.yml"

# ✅ NIEMALS ohne Assets releasen!
# Auto-Update benötigt latest.yml zwingend!
```

### **5. Qualitätskontrolle**
✅ **Vor Release-Veröffentlichung prüfen:**
- [ ] 🚨 **KRITISCH**: Alle Assets hochgeladen (Setup.exe, .blockmap, latest.yml)
- [ ] Auto-Update funktionsfähig (latest.yml vorhanden)
- [ ] Keine persönlichen Hardware-Daten
- [ ] Keine spezifischen Entwicklungsumgebung-Details  
- [ ] Keine internen Pfade oder Debug-Informationen
- [ ] Benutzer-fokussierte Beschreibung
- [ ] Technische Anforderungen sind generisch
- [ ] Version in package.json und VersionService.ts synchron

### **6. Fehlerbehebung**

#### **Assets nachträglich hinzufügen:**
```powershell
# Falls Assets vergessen wurden (wie bei v1.8.5)
& "C:\Program Files\GitHub CLI\gh.exe" release upload vX.Y.Z \
  "release\RawaLite-Setup-X.Y.Z.exe" \
  "release\RawaLite-Setup-X.Y.Z.exe.blockmap" \
  "release\latest.yml" \
  --clobber --repo MonaFP/RawaLite
```

#### **Release-Beschreibung bereinigen:**
```powershell
# Wenn versehentlich persönliche Daten enthalten sind
& "C:\Program Files\GitHub CLI\gh.exe" release edit vX.Y.Z --notes "NEUE_SAUBERE_BESCHREIBUNG"
```

#### **Build-Probleme lösen:**
```powershell
# Bei File-Lock Problemen:
taskkill /F /IM "electron.exe" 2>$null
taskkill /F /IM "RawaLite.exe" 2>$null
if (Test-Path "dist") { cmd /c "rmdir /s /q dist" 2>$null }
if (Test-Path "release") { cmd /c "rmdir /s /q release" 2>$null }
pnpm build && pnpm dist
```

#### **🚨 KRITISCHES Problem: Code-Signing für Auto-Updates**

**Problem**: `electron-updater` erwartet standardmäßig digital signierte Builds, aber Development-Releases sind unsigned.

**Symptom**: 
```
Error: New version X.X.X is not signed by the application owner
Status: 2 - "Die Datei ist nicht digital signiert"
ERR_UPDATER_INVALID_SIGNATURE
```

**✅ BESTE Lösung in electron-builder.yml**:
```yaml
win:
  icon: assets/icon.ico
  target:
    - target: nsis
      arch: x64
  publisherName: "Your Publisher Name"
  # � CRITICAL FIX: Disable code signature verification for unsigned builds
  verifyUpdateCodeSignature: false
```

**Alternative Lösung in electron/main.ts** (weniger sauber):
```typescript
// Fallback falls builder-config nicht funktioniert
(autoUpdater as any).verifySignature = false;
```

**Langfristige Lösung**: Code-Signing-Zertifikat für Production-Releases erwerben.

#### **🚨 KRITISCHES Problem: latest.yml fehlt immer**

**Root Causes & Systematische Lösungen:**

##### **Problem 1: electron-builder Konfiguration**
```yaml
# electron-builder.yml - MUSS enthalten:
publish:
  provider: github
  owner: MonaFP
  repo: RawaLite
  releaseType: release

# 🚨 CRITICAL: Force latest.yml generation
generateUpdatesFilesForAllChannels: true
forceCodeSigning: false
```

##### **Problem 2: Build-Unterbrechungen**
```powershell
# latest.yml wird nicht generiert wenn Build unterbrochen wird
# Lösung: Sauberer, kompletter Build-Durchlauf

# 1. Alle Prozesse beenden (aggressiv)
Get-Process | Where-Object {$_.ProcessName -like "*electron*" -or $_.ProcessName -like "*RawaLite*" -or $_.ProcessName -like "*app-builder*"} | Stop-Process -Force -ErrorAction SilentlyContinue

# 2. Alle Build-Verzeichnisse komplett löschen
if (Test-Path "dist") { cmd /c "rmdir /s /q dist" 2>$null }
if (Test-Path "release") { cmd /c "rmdir /s /q release" 2>$null }
if (Test-Path "dist-electron") { cmd /c "rmdir /s /q dist-electron" 2>$null }

# 3. Clean Build mit Validierung
pnpm build
if ($LASTEXITCODE -ne 0) { throw "Build failed" }

pnpm dist
if ($LASTEXITCODE -ne 0) { throw "Distribution failed" }

# 4. SOFORT prüfen ob latest.yml existiert
if (!(Test-Path "release\latest.yml")) {
    Write-Host "❌ CRITICAL: latest.yml not generated!" -ForegroundColor Red
    # Fallback-Strategie ausführen
}
```

##### **Problem 3: File-System-Locks**
```powershell
# Oft blockieren Antivirus oder Windows Search die .asar Dateien
# Lösung: Temporäre Exklusion oder Lock-Detection

# Lock-Detection Script
function Test-FileLocks {
    $lockedFiles = @()
    
    try {
        # Test app.asar Lock
        if (Test-Path "release\win-unpacked\resources\app.asar") {
            $file = [System.IO.File]::Open("release\win-unpacked\resources\app.asar", 'Open', 'Write')
            $file.Close()
        }
    } catch {
        $lockedFiles += "app.asar"
    }
    
    if ($lockedFiles.Count -gt 0) {
        Write-Host "❌ File locks detected: $($lockedFiles -join ', ')" -ForegroundColor Red
        Write-Host "💡 Try: Restart computer or disable antivirus temporarily" -ForegroundColor Yellow
        return $false
    }
    return $true
}
```

##### **Problem 4: Fallback-Strategie für fehlende latest.yml**
```powershell
# Wenn latest.yml trotz allem nicht generiert wird:
# Verwende Template von letztem funktionierenden Release

function New-LatestYmlFromTemplate {
    param([string]$Version, [string]$SetupExePath)
    
    # Calculate SHA512 of Setup.exe
    $hash = Get-FileHash $SetupExePath -Algorithm SHA512
    $sha512Base64 = [Convert]::ToBase64String([System.Convert]::FromHexString($hash.Hash))
    
    $setupSize = (Get-Item $SetupExePath).Length
    $filename = Split-Path $SetupExePath -Leaf
    
    $latestYml = @"
version: $Version
files:
  - url: $filename
    sha512: $sha512Base64
    size: $setupSize
path: $filename
sha512: $sha512Base64
releaseDate: $(Get-Date -Format "yyyy-MM-ddTHH:mm:ss.fffZ")
"@
    
    Set-Content "release\latest.yml" $latestYml -Encoding UTF8
    Write-Host "✅ Generated latest.yml manually for v$Version" -ForegroundColor Green
}

# Usage bei fehlendem latest.yml:
# New-LatestYmlFromTemplate "1.8.6" "release\RawaLite-Setup-1.8.6.exe"
```

##### **Problem 5: Validierung und Quality Gates**
```powershell
# Immer nach pnpm dist ausführen:
function Test-ReleaseAssetCompleteness {
    param([string]$Version)
    
    $requiredFiles = @(
        "release\RawaLite-Setup-$Version.exe",
        "release\RawaLite-Setup-$Version.exe.blockmap",
        "release\latest.yml"
    )
    
    $missing = @()
    foreach ($file in $requiredFiles) {
        if (!(Test-Path $file)) {
            $missing += $file
        }
    }
    
    if ($missing.Count -gt 0) {
        Write-Host "❌ Missing critical assets:" -ForegroundColor Red
        foreach ($file in $missing) {
            Write-Host "  - $file" -ForegroundColor Red
        }
        
        # Auto-Fix für fehlende latest.yml
        if ($missing -contains "release\latest.yml") {
            $setupExe = "release\RawaLite-Setup-$Version.exe"
            if (Test-Path $setupExe) {
                Write-Host "🔧 Auto-generating missing latest.yml..." -ForegroundColor Yellow
                New-LatestYmlFromTemplate $Version $setupExe
                return Test-ReleaseAssetCompleteness $Version  # Re-check
            }
        }
        
        return $false
    }
    
    Write-Host "✅ All release assets present and valid" -ForegroundColor Green
    return $true
}
```

## 📝 **Template für Release-Beschreibungen**

```markdown
🆕 **Neue Features:**
- [Feature-Liste basierend auf tatsächlichen Änderungen]

🐛 **Bug-Fixes:**
- [Fix-Liste basierend auf gelösten Issues]

🔧 **Verbesserungen:**
- [Performance, UI/UX, Stabilität]

📋 **System-Anforderungen:**
- Windows 10/11
- Node.js 20.x oder höher
- PowerShell 7.x (empfohlen)
- VS Code Latest LTS (für Entwicklung)

💾 **Update-Hinweise:**
[Spezifische Update-Anweisungen falls nötig]
```

## 🔍 **Automatisierte Validierung (Quality Assurance)**

### **Pre-Release Validation Script**
```powershell
# Erstelle validate-release.ps1
function Test-ReleaseReadiness {
    Write-Host "🔍 RawaLite Release Validation" -ForegroundColor Cyan
    $errors = @()
    
    # 1. Version Synchronization Check
    Write-Host "`n1️⃣ Version Synchronization..." -ForegroundColor Yellow
    try {
        $result = & pnpm version:check
        if ($LASTEXITCODE -ne 0) {
            $errors += "❌ Version synchronization failed"
        } else {
            Write-Host "✅ Versions synchronized" -ForegroundColor Green
        }
    } catch {
        $errors += "❌ Version check failed: $($_.Exception.Message)"
    }
    
    # 2. TypeScript Compilation
    Write-Host "`n2️⃣ TypeScript Compilation..." -ForegroundColor Yellow
    try {
        $result = & pnpm typecheck
        if ($LASTEXITCODE -ne 0) {
            $errors += "❌ TypeScript compilation failed"
        } else {
            Write-Host "✅ TypeScript compilation successful" -ForegroundColor Green
        }
    } catch {
        $errors += "❌ TypeScript check failed: $($_.Exception.Message)"
    }
    
    # 3. ESLint Compliance
    Write-Host "`n3️⃣ ESLint Compliance..." -ForegroundColor Yellow
    try {
        $result = & pnpm lint
        if ($LASTEXITCODE -ne 0) {
            $errors += "❌ ESLint validation failed"
        } else {
            Write-Host "✅ ESLint validation passed" -ForegroundColor Green
        }
    } catch {
        $errors += "❌ ESLint check failed: $($_.Exception.Message)"
    }
    
    # 4. Build Process Test
    Write-Host "`n4️⃣ Build Process Test..." -ForegroundColor Yellow
    if (Test-Path "dist") { Remove-Item -Recurse -Force "dist" }
    try {
        $result = & pnpm build
        if ($LASTEXITCODE -ne 0) {
            $errors += "❌ Build process failed"
        } elseif (!(Test-Path "dist/index.html")) {
            $errors += "❌ Build output incomplete (missing index.html)"
        } else {
            Write-Host "✅ Build process successful" -ForegroundColor Green
        }
    } catch {
        $errors += "❌ Build failed: $($_.Exception.Message)"
    }
    
    # 5. Distribution Assets Generation
    Write-Host "`n5️⃣ Distribution Assets..." -ForegroundColor Yellow
    if (Test-Path "release") { Remove-Item -Recurse -Force "release" }
    try {
        $result = & pnpm dist
        if ($LASTEXITCODE -ne 0) {
            $errors += "❌ Distribution build failed"
        } else {
            # Validate Critical Assets
            $setupExe = Get-ChildItem "release" -Filter "*Setup*.exe" | Select-Object -First 1
            $blockmap = Get-ChildItem "release" -Filter "*.blockmap" | Select-Object -First 1  
            $latestYml = "release\latest.yml"
            
            if (!$setupExe) {
                $errors += "❌ Setup.exe not found in release/"
            } elseif ($setupExe.Length -lt 50MB) {
                $errors += "❌ Setup.exe too small ($([math]::Round($setupExe.Length/1MB, 1))MB) - likely incomplete"
            } elseif ($setupExe.Length -gt 500MB) {
                $errors += "⚠️  Setup.exe very large ($([math]::Round($setupExe.Length/1MB, 1))MB) - check for bloat"
            }
            
            if (!$blockmap) {
                $errors += "❌ Blockmap file not found in release/"
            }
            
            if (!(Test-Path $latestYml)) {
                $errors += "❌ CRITICAL: latest.yml not found - Auto-update will not work!"
            } else {
                # Validate latest.yml content
                $ymlContent = Get-Content $latestYml -Raw
                if (!($ymlContent -match "sha512")) {
                    $errors += "❌ latest.yml missing SHA512 hash"
                }
                if (!($ymlContent -match "RawaLite-Setup.*\.exe")) {
                    $errors += "❌ latest.yml missing setup filename"
                }
                Write-Host "✅ All critical assets generated" -ForegroundColor Green
            }
        }
    } catch {
        $errors += "❌ Distribution failed: $($_.Exception.Message)"
    }
    
    # 6. Git Status Check
    Write-Host "`n6️⃣ Git Repository Status..." -ForegroundColor Yellow
    try {
        $gitStatus = & git status --porcelain
        if ($gitStatus) {
            $errors += "⚠️  Uncommitted changes detected - commit before release"
        } else {
            Write-Host "✅ Git repository clean" -ForegroundColor Green
        }
        
        # Check if current commit is tagged
        $currentCommit = & git rev-parse HEAD
        $tags = & git tag --points-at $currentCommit
        if (!$tags) {
            Write-Host "ℹ️  Current commit not tagged (normal for pre-release)" -ForegroundColor Blue
        }
    } catch {
        $errors += "❌ Git status check failed: $($_.Exception.Message)"
    }
    
    # Summary
    Write-Host "`n📋 VALIDATION SUMMARY" -ForegroundColor Cyan
    Write-Host "=============================" -ForegroundColor Cyan
    
    if ($errors.Count -eq 0) {
        Write-Host "🎉 ALL CHECKS PASSED - Ready for Release!" -ForegroundColor Green
        return $true
    } else {
        Write-Host "❌ VALIDATION FAILED - Issues found:" -ForegroundColor Red
        foreach ($error in $errors) {
            Write-Host "  $error" -ForegroundColor Red
        }
        Write-Host "`n🔧 Fix these issues before proceeding with release" -ForegroundColor Yellow
        return $false
    }
}

# Run Validation
Test-ReleaseReadiness
```

### **Asset Integrity Validation**
```powershell
# Asset-Validierungs-Script
function Test-ReleaseAssets {
    param([string]$Version)
    
    Write-Host "🔍 Validating Release Assets for v$Version" -ForegroundColor Cyan
    
    $assetPath = "release"
    $setupExe = "$assetPath\RawaLite-Setup-$Version.exe"
    $blockmap = "$assetPath\RawaLite-Setup-$Version.exe.blockmap"
    $latestYml = "$assetPath\latest.yml"
    
    # File Existence Check
    $requiredFiles = @($setupExe, $blockmap, $latestYml)
    $missing = @()
    
    foreach ($file in $requiredFiles) {
        if (!(Test-Path $file)) {
            $missing += $file
        }
    }
    
    if ($missing.Count -gt 0) {
        Write-Host "❌ Missing required assets:" -ForegroundColor Red
        foreach ($file in $missing) {
            Write-Host "  - $file" -ForegroundColor Red
        }
        return $false
    }
    
    # File Size Validation
    $setupSize = (Get-Item $setupExe).Length
    $setupMB = [math]::Round($setupSize / 1MB, 1)
    
    Write-Host "📦 Asset Information:" -ForegroundColor Blue
    Write-Host "  Setup.exe: $setupMB MB" -ForegroundColor Gray
    Write-Host "  Blockmap: $([math]::Round((Get-Item $blockmap).Length / 1KB, 1)) KB" -ForegroundColor Gray
    Write-Host "  latest.yml: $([math]::Round((Get-Item $latestYml).Length, 0)) bytes" -ForegroundColor Gray
    
    # Size Range Check
    if ($setupMB -lt 50) {
        Write-Host "⚠️  Warning: Setup.exe unusually small ($setupMB MB)" -ForegroundColor Yellow
    } elseif ($setupMB -gt 300) {
        Write-Host "⚠️  Warning: Setup.exe unusually large ($setupMB MB)" -ForegroundColor Yellow
    }
    
    # latest.yml Content Validation
    $ymlContent = Get-Content $latestYml -Raw
    $hasVersion = $ymlContent -match "version:\s*$Version"
    $hasSHA512 = $ymlContent -match "sha512:\s*[A-Za-z0-9+/=]{88}"
    $hasFilename = $ymlContent -match "url:\s*RawaLite-Setup-$Version\.exe"
    
    if (!$hasVersion) {
        Write-Host "❌ latest.yml missing correct version ($Version)" -ForegroundColor Red
        return $false
    }
    if (!$hasSHA512) {
        Write-Host "❌ latest.yml missing valid SHA512 hash" -ForegroundColor Red
        return $false
    }
    if (!$hasFilename) {
        Write-Host "❌ latest.yml missing correct filename" -ForegroundColor Red
        return $false
    }
    
    Write-Host "✅ All assets validated successfully" -ForegroundColor Green
    return $true
}

# Usage: Test-ReleaseAssets "1.8.6"
```

### **Automated Release Checklist**
```json
// .github/release-checklist.json
{
  "preRelease": {
    "codeQuality": [
      "pnpm lint",
      "pnpm typecheck", 
      "pnpm version:check"
    ],
    "build": [
      "pnpm build",
      "pnpm dist"
    ],
    "assets": [
      "validate-setup-exe",
      "validate-blockmap",
      "validate-latest-yml"
    ],
    "git": [
      "check-clean-working-tree",
      "verify-version-tag"
    ]
  },
  "postRelease": {
    "verification": [
      "check-github-assets",
      "validate-auto-update-metadata",
      "test-download-links"
    ]
  }
}
```

### **Release Automation Script**
```powershell
# scripts/create-release.ps1
param(
    [Parameter(Mandatory=$true)]
    [string]$ReleaseType,  # patch, minor, major
    
    [Parameter(Mandatory=$false)]
    [string]$Title,
    
    [Parameter(Mandatory=$false)]
    [string]$Notes = ""
)

Write-Host "🚀 RawaLite Release Automation" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan

# 1. Pre-Release Validation
Write-Host "`n📋 Step 1: Pre-Release Validation" -ForegroundColor Yellow
if (!(Test-ReleaseReadiness)) {
    Write-Host "❌ Pre-release validation failed. Aborting." -ForegroundColor Red
    exit 1
}

# 2. Version Bump
Write-Host "`n🏷️  Step 2: Version Bump ($ReleaseType)" -ForegroundColor Yellow
$result = & pnpm version:bump $ReleaseType
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Version bump failed. Aborting." -ForegroundColor Red
    exit 1
}

# Extract new version from package.json
$packageJson = Get-Content "package.json" | ConvertFrom-Json
$newVersion = $packageJson.version
Write-Host "✅ Version bumped to: $newVersion" -ForegroundColor Green

# 3. Build & Distribution
Write-Host "`n🔨 Step 3: Build & Distribution" -ForegroundColor Yellow
$result = & pnpm build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed. Aborting." -ForegroundColor Red
    exit 1
}

$result = & pnpm dist
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Distribution failed. Aborting." -ForegroundColor Red
    exit 1
}

# 4. Asset Validation
Write-Host "`n📦 Step 4: Asset Validation" -ForegroundColor Yellow
if (!(Test-ReleaseAssets $newVersion)) {
    Write-Host "❌ Asset validation failed. Aborting." -ForegroundColor Red
    exit 1
}

# 5. Git Commit & Tag
Write-Host "`n📝 Step 5: Git Commit & Tag" -ForegroundColor Yellow
$commitMessage = "v$newVersion: $Title"
& git add -A
& git commit -m $commitMessage
& git tag "v$newVersion"
& git push origin main --tags

Write-Host "✅ Git commit and tag created: v$newVersion" -ForegroundColor Green

# 6. GitHub Release
Write-Host "`n🌐 Step 6: GitHub Release Creation" -ForegroundColor Yellow
$releaseTitle = "RawaLite v$newVersion"
if ($Title) {
    $releaseTitle += " - $Title"
}

$assetFiles = @(
    "release\RawaLite-Setup-$newVersion.exe",
    "release\RawaLite-Setup-$newVersion.exe.blockmap",
    "release\latest.yml"
)

$ghArgs = @(
    "release", "create", "v$newVersion",
    "--title", $releaseTitle,
    "--repo", "MonaFP/RawaLite"
)

if ($Notes) {
    $ghArgs += "--notes"
    $ghArgs += $Notes
} else {
    $ghArgs += "--generate-notes"
}

$ghArgs += $assetFiles

try {
    & "C:\Program Files\GitHub CLI\gh.exe" @ghArgs
    Write-Host "✅ GitHub Release created successfully!" -ForegroundColor Green
} catch {
    Write-Host "❌ GitHub Release creation failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# 7. Final Verification
Write-Host "`n🔍 Step 7: Final Verification" -ForegroundColor Yellow
$releaseInfo = & "C:\Program Files\GitHub CLI\gh.exe" release view "v$newVersion" --repo MonaFP/RawaLite --json assets,url
$release = $releaseInfo | ConvertFrom-Json

if ($release.assets.Count -lt 3) {
    Write-Host "❌ Warning: Release has fewer than 3 assets!" -ForegroundColor Red
} else {
    Write-Host "✅ Release verified with $($release.assets.Count) assets" -ForegroundColor Green
}

Write-Host "`n🎉 RELEASE COMPLETED SUCCESSFULLY!" -ForegroundColor Green
Write-Host "📋 Release Information:" -ForegroundColor Cyan
Write-Host "  Version: $newVersion" -ForegroundColor Gray
Write-Host "  URL: $($release.url)" -ForegroundColor Gray
Write-Host "  Assets: $($release.assets.Count)" -ForegroundColor Gray

# Usage Examples:
# .\scripts\create-release.ps1 -ReleaseType patch -Title "Critical Bugfix"
# .\scripts\create-release.ps1 -ReleaseType minor -Title "New Features" -Notes "Custom release notes"
```

## 🎯 **Quality Gates**

### **Mandatory Checks Before Release**
```markdown
- [ ] ✅ Pre-release validation script passes 100%
- [ ] ✅ All assets generated and validated (Setup.exe, .blockmap, latest.yml)
- [ ] ✅ Asset file sizes within expected ranges (50MB - 300MB für Setup.exe)
- [ ] ✅ latest.yml contains correct version, SHA512, and filename
- [ ] ✅ TypeScript compilation without errors
- [ ] ✅ ESLint validation passes
- [ ] ✅ Version synchronization confirmed (package.json ↔ VersionService.ts)
- [ ] ✅ Git repository clean (no uncommitted changes)
- [ ] ✅ Release notes free of personal data and development details
- [ ] ✅ All critical functionality tested manually
```

### **Post-Release Verification**
```markdown
- [ ] ✅ GitHub Release created with all assets attached
- [ ] ✅ Download links functional
- [ ] ✅ Auto-update detection works from previous version
- [ ] ✅ Setup.exe installs and starts correctly
- [ ] ✅ Database migration (if any) works correctly
- [ ] ✅ User data preserved during update
```

## 🎯 **Fazit**
Professionelle, benutzer-fokussierte Release-Beschreibungen ohne persönliche Entwicklungsdaten, unterstützt durch **automatisierte Validierung** und **Quality Gates**.

### **Key Benefits der erweiterten Guidelines:**
- ✅ **Automatisierte Validierung** verhindert defekte Releases
- ✅ **Asset Integrity Checks** sichern funktionsfähige Auto-Updates
- ✅ **Pre-Commit Validation** reduziert manuelle Fehler
- ✅ **Standardisierte Workflows** für konsistente Releases
- ✅ **Quality Gates** gewährleisten hohe Release-Qualität

---

**Wichtig**: Diese erweiterten Richtlinien IMMER befolgen, um **hochqualitative, automatisch validierte Releases** zu gewährleisten und **kritische Fehler wie fehlende latest.yml-Dateien** zu verhindern.

---

*Letzte Aktualisierung: 18. September 2025*  
*Version: 2.0.0 (Enhanced with QA Automation)*