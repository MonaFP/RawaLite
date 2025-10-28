# 🚀 Custom In-App Updater - Implementierungsplan
CAVE:  **🤖 KI-AUTO-DETECTION SYSTEM NEEDED. KI HAS TO READ HANDBOOK FIRST**
> **GitHub CLI-Enhanced Update System ohne Windows Code Signing Certificate**  
> **Erstellt:** 1. Oktober 2025 | **Estimated Timeline:** 1 Woche

---

## 🎯 **Projektziel**

Implementierung eines **benutzerfreundlichen In-App Update-Systems** für RawaLite, das:
- **Keine manuellen Downloads** erfordert
- **Benutzer-Consent** mit klarer Update-Information einholt
- **GitHub CLI** für authentifizierte API-Calls nutzt (Rate-Limit-Schutz)
- **Ohne Windows Code Signing Certificate** funktioniert
- **NSIS Silent Installation** für nahtlose Updates

---

## 📋 **Meilenstein-basierte Implementierung**

### **Phase 1: Foundation & GitHub CLI Integration** ⏱️ 1-2 Tage

#### **Milestone 1.1: GitHub CLI Service**
```typescript
// src/services/GitHubCliService.ts
class GitHubCliService {
  async getLatestRelease(): Promise<GitHubRelease>
  async downloadAsset(assetUrl: string, targetPath: string): Promise<void>
  async checkAuthentication(): Promise<boolean>
}
```

**Deliverables:**
- ✅ GitHub CLI wrapper service
- ✅ Authentication validation
- ✅ Rate-limit bypass through authenticated calls

**Verification Command:**
```powershell
# Test GitHub CLI availability and authentication
pnpm test:github-cli
```

#### **Milestone 1.2: IPC Update API**
```typescript
// electron/main.ts - extend contextBridge
window.rawalite.updates = {
  checkForUpdates(): Promise<UpdateCheckResult>
  downloadUpdate(version: string): Promise<DownloadProgress>
  installUpdate(): Promise<void>
  getCurrentVersion(): Promise<string>
}
```

**Deliverables:**
- ✅ IPC channel definitions
- ✅ Type-safe API surface
- ✅ Error handling patterns

**Verification Command:**
```powershell
# Test IPC API availability
pnpm test:update-ipc
```

---

### **Phase 2: Core Update Logic** ⏱️ 2-3 Tage

#### **Milestone 2.1: Update Manager Service**
```typescript
// src/main/services/UpdateManagerService.ts
class UpdateManagerService {
  async checkForUpdates(): Promise<UpdateInfo | null>
  async downloadUpdate(updateInfo: UpdateInfo): Promise<string>
  async verifyDownload(filePath: string): Promise<boolean>
  async installUpdate(installerPath: string): Promise<void>
}
```

**Deliverables:**
- ✅ Version comparison logic (semver)
- ✅ Download progress tracking
- ✅ File integrity verification
- ✅ NSIS silent installation

**Verification Command:**
```powershell
# Test update detection and download simulation
pnpm test:update-manager
```

#### **Milestone 2.2: Download Progress & Storage**
```typescript
// Temporary download directory management
// Progress events for UI feedback
// Cleanup mechanisms for failed downloads
```

**Deliverables:**
- ✅ Temp directory management
- ✅ Download progress events
- ✅ Cleanup on errors/cancellation

**Verification Command:**
```powershell
# Test download progress and cleanup
pnpm test:download-progress
```

---

### **Phase 3: User Interface Integration** ⏱️ 1-2 Tage

#### **Milestone 3.1: Update Notification System**
```typescript
// src/hooks/useUpdateChecker.ts
export function useUpdateChecker() {
  const [updateAvailable, setUpdateAvailable] = useState<UpdateInfo | null>(null)
  const [checking, setChecking] = useState(false)
  // Auto-check on app start + manual check functionality
}
```

**Deliverables:**
- ✅ Automatic update check on app start
- ✅ Background checking logic
- ✅ Update notification state management

**Verification Command:**
```powershell
# Test automatic update detection
pnpm test:update-checker
```

#### **Milestone 3.2: Update Dialog & Progress UI**
```typescript
// src/components/UpdateDialog.tsx
- Update available notification
- Changelog display
- Download progress bar
- Installation confirmation
- Error handling & retry logic
```

**Deliverables:**
- ✅ Modern React update dialog
- ✅ Progress visualization
- ✅ User consent workflow
- ✅ Error recovery UX

**Verification Command:**
```powershell
# Test update UI components
pnpm test:update-ui
```

---

### **Phase 4: Security & Reliability** ⏱️ 1 Tag

#### **Milestone 4.1: Security Validation**
```typescript
// Asset verification
// Download integrity checks
// Installation safety measures
// Error recovery mechanisms
```

**Deliverables:**
- ✅ SHA256 checksum verification
- ✅ File size validation
- ✅ Installation rollback capability
- ✅ Network error handling

**Verification Command:**
```powershell
# Test security and error handling
pnpm test:update-security
```

#### **Milestone 4.2: User Experience Polish**
```typescript
// Smooth progress transitions
// Clear error messages
// Installation success feedback
// App restart coordination
```

**Deliverables:**
- ✅ Polished user experience
- ✅ Clear status communication
- ✅ Graceful app restart flow

**Verification Command:**
```powershell
# End-to-end update workflow test
pnpm test:update-e2e
```

---

## 🔧 **Verification Scripts**

### **1. GitHub CLI Test Script**
```powershell
# scripts/test-github-cli.ps1
Write-Host "🔍 Testing GitHub CLI Integration..." -ForegroundColor Cyan

# Check GitHub CLI installation
if (!(Get-Command gh -ErrorAction SilentlyContinue)) {
    Write-Host "❌ GitHub CLI not found. Please install from: https://cli.github.com/" -ForegroundColor Red
    exit 1
}

# Check authentication
$authStatus = gh auth status 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ GitHub CLI not authenticated. Run: gh auth login" -ForegroundColor Red
    exit 1
}

# Test API call to our repository
Write-Host "🔗 Testing repository access..." -ForegroundColor Yellow
$release = gh api repos/MonaFP/RawaLite/releases/latest --jq '.tag_name,.assets[].browser_download_url' 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ GitHub CLI working correctly" -ForegroundColor Green
    Write-Host "Latest release: $($release -split "`n" | Select-Object -First 1)" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to access repository releases" -ForegroundColor Red
    exit 1
}
```

### **2. IPC API Test Script**
```powershell
# scripts/test-update-ipc.ps1
Write-Host "🔍 Testing Update IPC API..." -ForegroundColor Cyan

# Start app in test mode
Write-Host "🚀 Starting RawaLite in test mode..." -ForegroundColor Yellow
$process = Start-Process -FilePath "pnpm" -ArgumentList "dev" -PassThru -WindowStyle Hidden

Start-Sleep 5

# Test IPC endpoints (requires e2e test framework)
Write-Host "🧪 Running IPC tests..." -ForegroundColor Yellow
pnpm test --grep "UpdateIPC"

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Update IPC API working correctly" -ForegroundColor Green
} else {
    Write-Host "❌ Update IPC API tests failed" -ForegroundColor Red
}

# Cleanup
Stop-Process -Id $process.Id -Force -ErrorAction SilentlyContinue
```

### **3. Update Manager Test Script**
```powershell
# scripts/test-update-manager.ps1
Write-Host "🔍 Testing Update Manager Logic..." -ForegroundColor Cyan

# Test version comparison
Write-Host "📊 Testing version comparison..." -ForegroundColor Yellow
$testResults = pnpm test --grep "VersionComparison" --reporter=json

# Test download simulation (without actual download)
Write-Host "⬇️ Testing download simulation..." -ForegroundColor Yellow
$downloadTest = pnpm test --grep "DownloadSimulation" --reporter=json

# Test update detection
Write-Host "🔍 Testing update detection..." -ForegroundColor Yellow
$detectionTest = pnpm test --grep "UpdateDetection" --reporter=json

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Update Manager tests passed" -ForegroundColor Green
} else {
    Write-Host "❌ Update Manager tests failed" -ForegroundColor Red
    Write-Host "Check test output above for details" -ForegroundColor Yellow
}
```

### **4. End-to-End Update Test Script**
```powershell
# scripts/test-update-e2e.ps1
Write-Host "🎯 End-to-End Update Test (Simulation)" -ForegroundColor Cyan

Write-Host "📋 Test Steps:" -ForegroundColor Yellow
Write-Host "  1. Check GitHub CLI connectivity" -ForegroundColor White
Write-Host "  2. Simulate update detection" -ForegroundColor White
Write-Host "  3. Test download progress tracking" -ForegroundColor White
Write-Host "  4. Verify UI state management" -ForegroundColor White
Write-Host "  5. Test error recovery" -ForegroundColor White

# Step 1: GitHub CLI
Write-Host "`n🔗 Step 1: GitHub CLI connectivity..." -ForegroundColor Cyan
& .\scripts\test-github-cli.ps1
if ($LASTEXITCODE -ne 0) { exit 1 }

# Step 2: Update detection
Write-Host "`n🔍 Step 2: Update detection simulation..." -ForegroundColor Cyan
pnpm test --grep "UpdateDetectionE2E"
if ($LASTEXITCODE -ne 0) { Write-Host "❌ Update detection failed" -ForegroundColor Red; exit 1 }

# Step 3: Download progress
Write-Host "`n⬇️ Step 3: Download progress tracking..." -ForegroundColor Cyan
pnpm test --grep "DownloadProgressE2E"
if ($LASTEXITCODE -ne 0) { Write-Host "❌ Download progress failed" -ForegroundColor Red; exit 1 }

# Step 4: UI state management
Write-Host "`n🎨 Step 4: UI state management..." -ForegroundColor Cyan
pnpm test --grep "UpdateUIE2E"
if ($LASTEXITCODE -ne 0) { Write-Host "❌ UI state management failed" -ForegroundColor Red; exit 1 }

# Step 5: Error recovery
Write-Host "`n🛡️ Step 5: Error recovery mechanisms..." -ForegroundColor Cyan
pnpm test --grep "UpdateErrorRecoveryE2E"
if ($LASTEXITCODE -ne 0) { Write-Host "❌ Error recovery failed" -ForegroundColor Red; exit 1 }

Write-Host "`n✅ All E2E update tests passed!" -ForegroundColor Green
Write-Host "🚀 Update system ready for production" -ForegroundColor Green
```

---

## 🗂️ **Datei-Struktur nach Implementierung**

```
src/
├── main/
│   └── services/
│       ├── GitHubCliService.ts         # GitHub CLI wrapper
│       └── UpdateManagerService.ts     # Core update logic
├── hooks/
│   └── useUpdateChecker.ts             # Update detection hook
├── components/
│   ├── UpdateDialog.tsx                # Update UI components
│   └── UpdateProgress.tsx              # Progress visualization
└── types/
    └── update.types.ts                 # Update-related types

electron/
├── main.ts                             # Extended IPC handlers
└── preload.ts                          # Update API surface

scripts/
├── test-github-cli.ps1                 # GitHub CLI verification
├── test-update-ipc.ps1                 # IPC API testing
├── test-update-manager.ps1             # Update logic testing
└── test-update-e2e.ps1                 # End-to-end testing

tests/
├── GitHubCliService.test.ts            # GitHub CLI tests
├── UpdateManagerService.test.ts        # Update manager tests
├── UpdateDialog.test.tsx               # UI component tests
└── update-e2e.test.ts                  # E2E update tests
```

---

## ⚡ **Quick Start Commands**

### **Setup Phase**
```powershell
# Verify prerequisites
gh auth status
pnpm install --frozen-lockfile

# Create initial test scripts
New-Item -ItemType Directory -Force -Path "scripts"
# Copy provided test scripts to scripts/ folder
```

### **Development Phase**
```powershell
# Test current milestone
pnpm test:github-cli          # Phase 1.1
pnpm test:update-ipc          # Phase 1.2
pnpm test:update-manager      # Phase 2.1
pnpm test:download-progress   # Phase 2.2
pnpm test:update-checker      # Phase 3.1
pnpm test:update-ui           # Phase 3.2
pnpm test:update-security     # Phase 4.1
pnpm test:update-e2e          # Phase 4.2
```

### **Verification Phase**
```powershell
# Run all update tests
pnpm test:update-all

# Full end-to-end validation
.\scripts\test-update-e2e.ps1
```

---

## 🎯 **Success Criteria**

### **Technical Requirements**
- ✅ Update detection funktioniert automatisch beim App-Start
- ✅ Download-Progress wird korrekt angezeigt
- ✅ NSIS Silent Installation läuft ohne User-Interaktion
- ✅ Fehlerbehandlung mit Retry-Mechanismus
- ✅ GitHub CLI Rate-Limit Bypass durch Authentication

### **User Experience Requirements**
- ✅ Ein-Klick Update-Installation nach User-Consent
- ✅ Klare Kommunikation über Update-Status
- ✅ Graceful App-Restart nach Installation
- ✅ Rollback-Capability bei Fehlern

### **Security Requirements**
- ✅ SHA256 Checksum-Verifikation
- ✅ Sichere Temp-Directory Handhabung
- ✅ Keine elevated privileges für Download
- ✅ Integrität der GitHub Release Assets

---

## 📊 **Timeline & Resource Allocation**

| **Phase** | **Estimated Time** | **Key Deliverable** | **Risk Level** |
|---|---|---|---|
| **Phase 1** | 1-2 Tage | GitHub CLI Integration + IPC API | 🟢 **Low** |
| **Phase 2** | 2-3 Tage | Core Update Logic + Download Management | 🟡 **Medium** |
| **Phase 3** | 1-2 Tage | UI Integration + User Experience | 🟢 **Low** |
| **Phase 4** | 1 Tag | Security + Polish | 🟢 **Low** |
| **Total** | **5-8 Tage** | **Production-Ready Custom Updater** | 🟢 **Low** |

---

## 🛡️ **Risk Mitigation**

### **Identified Risks & Mitigations**
1. **GitHub CLI nicht verfügbar:** Fallback auf HTTP-API mit Rate-Limiting
2. **NSIS Installation fehlschlägt:** Rollback + manuelle Download-Option
3. **Network-Probleme:** Retry-Mechanismus + Offline-Detection
4. **File System Permissions:** Elevated privilege handling + User-Verifikation

### **Testing Strategy**
- **Unit Tests:** Jede Service-Klasse einzeln
- **Integration Tests:** IPC + GitHub CLI Interaktion
- **E2E Tests:** Kompletter Update-Flow (Simulation)
- **Manual Testing:** Echter Update-Download auf Test-System

---

## 📝 **Next Actions**

### **Immediate Next Steps:**
1. ✅ Implementierungsplan erstellt und dokumentiert
2. 🔄 Verification Scripts erstellen und testen
3. 📋 Phase 1.1 starten: GitHub CLI Service implementieren

### **Follow-up:**
- Nach jeder Phase: Milestone-Verification ausführen
- Bei Problemen: Zurück zur Dokumentation und Tests anpassen
- Final: Production-Deployment mit vollem E2E-Test

---

**🎯 Dieses Dokument ist der Master-Plan für die Update-Implementierung!**  
*Bei Abweichungen oder Problemen: Hier dokumentieren und Plan anpassen.*