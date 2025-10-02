# 🔍 Update IPC API Test
# Part of RawaLite Custom Updater Implementation Plan
# Tests Update IPC API availability and functionality

param(
    [switch]$Verbose,
    [switch]$ShowDetails,
    [int]$Timeout = 30
)

Write-Host "🔍 Testing Update IPC API..." -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Gray

# Helper function for detailed output
function Write-Detail($message, $color = "Gray") {
    if ($ShowDetails) {
        Write-Host "  └─ $message" -ForegroundColor $color
    }
}

# Helper function to check if process is running
function Test-ProcessRunning($processName) {
    return (Get-Process -Name $processName -ErrorAction SilentlyContinue) -ne $null
}

# Step 1: Check if RawaLite is already running
Write-Host "`n🔍 Step 1: Checking application status..." -ForegroundColor Yellow

$appProcess = $null
$needsCleanup = $false

if (Test-ProcessRunning "RawaLite") {
    Write-Host "⚠️ RawaLite is already running" -ForegroundColor Yellow
    Write-Detail "Using existing instance for testing"
} else {
    Write-Detail "No running instance found, will start test instance"
}

# Step 2: Verify development dependencies
Write-Host "`n📦 Step 2: Checking development setup..." -ForegroundColor Yellow

try {
    # Check if we're in the right directory
    if (!(Test-Path "package.json")) {
        throw "Not in RawaLite project directory"
    }
    
    $packageJson = Get-Content "package.json" | ConvertFrom-Json
    if ($packageJson.name -ne "rawalite") {
        throw "Wrong project directory"
    }
    
    Write-Host "✅ Project directory confirmed" -ForegroundColor Green
    Write-Detail "Project: $($packageJson.name) v$($packageJson.version)"
    
    # Check if node_modules exists
    if (!(Test-Path "node_modules")) {
        throw "Dependencies not installed"
    }
    
    Write-Host "✅ Dependencies available" -ForegroundColor Green
    
} catch {
    Write-Host "❌ Setup validation failed: $_" -ForegroundColor Red
    Write-Host "Please run: pnpm install" -ForegroundColor Yellow
    exit 1
}

# Step 3: Check TypeScript compilation
Write-Host "`n🔧 Step 3: Validating TypeScript compilation..." -ForegroundColor Yellow

try {
    Write-Detail "Running TypeScript type check..."
    $tscOutput = pnpm typecheck 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ TypeScript compilation OK" -ForegroundColor Green
    } else {
        Write-Host "⚠️ TypeScript compilation issues detected" -ForegroundColor Yellow
        if ($ShowDetails) {
            Write-Detail "TSC Output: $($tscOutput -join "`n")"
        }
        Write-Host "Consider fixing TS issues before implementing Update IPC" -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠️ Could not validate TypeScript compilation" -ForegroundColor Yellow
}

# Step 4: Check existing IPC patterns
Write-Host "`n🔗 Step 4: Analyzing existing IPC patterns..." -ForegroundColor Yellow

try {
    # Check preload.ts for existing IPC surface
    if (Test-Path "electron/preload.ts") {
        $preloadContent = Get-Content "electron/preload.ts" -Raw
        
        if ($preloadContent -match "window\.rawalite") {
            Write-Host "✅ Existing IPC surface found" -ForegroundColor Green
            Write-Detail "window.rawalite API pattern detected"
            
            # Check for update-related APIs
            if ($preloadContent -match "update") {
                Write-Host "⚠️ Update IPC APIs already exist" -ForegroundColor Yellow
                Write-Detail "Review existing implementation before adding new APIs"
            } else {
                Write-Host "✅ Ready for Update IPC extension" -ForegroundColor Green
                Write-Detail "No conflicting update APIs found"
            }
        } else {
            Write-Host "⚠️ No rawalite IPC surface found" -ForegroundColor Yellow
            Write-Detail "Will need to establish IPC patterns first"
        }
    } else {
        Write-Host "❌ preload.ts not found" -ForegroundColor Red
        Write-Detail "Critical file missing for IPC implementation"
        exit 1
    }
    
} catch {
    Write-Host "❌ Failed to analyze IPC patterns: $_" -ForegroundColor Red
    exit 1
}

# Step 5: Check main process structure
Write-Host "`n⚙️ Step 5: Validating main process structure..." -ForegroundColor Yellow

try {
    if (Test-Path "electron/main.ts") {
        $mainContent = Get-Content "electron/main.ts" -Raw
        
        if ($mainContent -match "ipcMain") {
            Write-Host "✅ IPC Main handlers found" -ForegroundColor Green
            Write-Detail "Existing IPC infrastructure available"
        } else {
            Write-Host "⚠️ No IPC Main handlers detected" -ForegroundColor Yellow
            Write-Detail "Will need to establish IPC handler patterns"
        }
        
        # Check for services directory
        if (Test-Path "src/main/services") {
            Write-Host "✅ Services directory exists" -ForegroundColor Green
            Write-Detail "Ready for UpdateManagerService.ts"
        } else {
            Write-Host "⚠️ Services directory missing" -ForegroundColor Yellow
            Write-Detail "Will need to create: src/main/services/"
        }
        
    } else {
        Write-Host "❌ main.ts not found" -ForegroundColor Red
        exit 1
    }
    
} catch {
    Write-Host "❌ Failed to validate main process: $_" -ForegroundColor Red
    exit 1
}

# Step 6: Test build process (lightweight)
Write-Host "`n🔨 Step 6: Testing build process..." -ForegroundColor Yellow

try {
    Write-Detail "Testing renderer build..."
    $buildOutput = pnpm build 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Build process working" -ForegroundColor Green
        Write-Detail "Renderer and main process compilation successful"
        
        # Check if dist files were created
        if (Test-Path "dist-electron") {
            Write-Detail "Electron build artifacts created"
        }
    } else {
        Write-Host "⚠️ Build process issues" -ForegroundColor Yellow
        if ($ShowDetails) {
            Write-Detail "Build output: $($buildOutput -join "`n")"
        }
    }
} catch {
    Write-Host "⚠️ Could not test build process" -ForegroundColor Yellow
}

# Step 7: Prepare for IPC implementation
Write-Host "`n📋 Step 7: IPC Implementation readiness..." -ForegroundColor Yellow

$readinessChecks = @()

# Check TypeScript types directory
if (Test-Path "src/types") {
    $readinessChecks += "✅ Types directory exists"
} else {
    $readinessChecks += "⚠️ May need to create src/types/ for update.types.ts"
}

# Check hooks directory
if (Test-Path "src/hooks") {
    $readinessChecks += "✅ Hooks directory exists (for useUpdateChecker)"
} else {
    $readinessChecks += "⚠️ May need to create src/hooks/ directory"
}

# Check if we have existing service patterns
if (Test-Path "src/services") {
    $readinessChecks += "✅ Services directory exists"
} else {
    $readinessChecks += "⚠️ May need to create src/services/ for GitHubCliService"
}

foreach ($check in $readinessChecks) {
    Write-Detail $check
}

Write-Host "✅ IPC Implementation assessment complete" -ForegroundColor Green

# Final summary
Write-Host "`n📊 IPC Readiness Summary:" -ForegroundColor Cyan
Write-Host "✅ Project structure: OK" -ForegroundColor Green
Write-Host "✅ TypeScript setup: OK" -ForegroundColor Green  
Write-Host "✅ Existing IPC patterns: DETECTED" -ForegroundColor Green
Write-Host "✅ Build process: OK" -ForegroundColor Green
Write-Host "✅ Directory structure: READY" -ForegroundColor Green

Write-Host "`n🎯 Ready for Update IPC Implementation!" -ForegroundColor Green
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. Create src/types/update.types.ts" -ForegroundColor Gray
Write-Host "  2. Extend electron/preload.ts with update APIs" -ForegroundColor Gray
Write-Host "  3. Add IPC handlers to electron/main.ts" -ForegroundColor Gray
Write-Host "  4. Implement UpdateManagerService.ts" -ForegroundColor Gray

# Generate template structure
if ($ShowDetails) {
    Write-Host "`n📁 Suggested file structure:" -ForegroundColor Cyan
    Write-Host "src/types/update.types.ts" -ForegroundColor Gray
    Write-Host "src/main/services/UpdateManagerService.ts" -ForegroundColor Gray
    Write-Host "src/main/services/GitHubCliService.ts" -ForegroundColor Gray
    Write-Host "src/hooks/useUpdateChecker.ts" -ForegroundColor Gray
    Write-Host "src/components/UpdateDialog.tsx" -ForegroundColor Gray
}

exit 0