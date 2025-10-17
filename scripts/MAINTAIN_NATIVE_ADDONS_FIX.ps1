# Fix native add-ons for Electron
# PowerShell script for manual better-sqlite3 rebuilding
# Usage: .\scripts\fix-native-addons.ps1

Write-Host "🔧 Fixing native add-ons for Electron..." -ForegroundColor Cyan

# Check if in project root
if (-not (Test-Path "package.json")) {
    Write-Host "❌ Error: Must run from project root directory" -ForegroundColor Red
    exit 1
}

# Check if electron is installed
if (-not (Test-Path "node_modules\electron")) {
    Write-Host "❌ Error: Electron not found. Run 'pnpm install' first" -ForegroundColor Red
    exit 1
}

try {
    # Get Electron version and ABI
    $electronVersion = (Get-Content "node_modules\electron\package.json" | ConvertFrom-Json).version
    Write-Host "🔍 Detected Electron version: $electronVersion" -ForegroundColor Yellow
    
    # Clean better-sqlite3 build artifacts
    $buildPaths = @(
        "node_modules\better-sqlite3\build",
        "node_modules\better-sqlite3\prebuilds"
    )
    
    foreach ($path in $buildPaths) {
        if (Test-Path $path) {
            Remove-Item $path -Recurse -Force
            Write-Host "🧹 Cleaned: $path" -ForegroundColor Green
        }
    }
    
    # Rebuild for Electron
    Write-Host "🔨 Rebuilding better-sqlite3 for Electron..." -ForegroundColor Cyan
    
    $env:npm_config_target = $electronVersion
    $env:npm_config_arch = "x64"
    $env:npm_config_target_arch = "x64"
    $env:npm_config_disturl = "https://electronjs.org/headers"
    $env:npm_config_runtime = "electron"
    $env:npm_config_cache = "$env:USERPROFILE\.electron-gyp"
    $env:npm_config_build_from_source = "true"
    
    # Method 1: electron-rebuild (preferred)
    if (Test-Path "node_modules\.bin\electron-rebuild.cmd") {
        Write-Host "📦 Using electron-rebuild..." -ForegroundColor Yellow
        & "node_modules\.bin\electron-rebuild.cmd" --force --module-dir . --types dev,prod
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ electron-rebuild succeeded" -ForegroundColor Green
        } else {
            Write-Host "⚠️ electron-rebuild failed, trying node-gyp..." -ForegroundColor Yellow
        }
    }
    
    # Method 2: Direct node-gyp rebuild
    Push-Location "node_modules\better-sqlite3"
    try {
        Write-Host "🔨 Direct node-gyp rebuild..." -ForegroundColor Yellow
        & node-gyp rebuild --target=$electronVersion --arch=x64 --dist-url=https://electronjs.org/headers
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ node-gyp rebuild succeeded" -ForegroundColor Green
        } else {
            Write-Host "❌ node-gyp rebuild failed" -ForegroundColor Red
        }
    } finally {
        Pop-Location
    }
    
    # Verify the build
    if (Test-Path "node_modules\better-sqlite3\build\Release\better_sqlite3.node") {
        Write-Host "✅ better-sqlite3 native module found" -ForegroundColor Green
        
        # Check if it's actually for Electron
        try {
            $fileInfo = Get-Command "node_modules\better-sqlite3\build\Release\better_sqlite3.node" -ErrorAction SilentlyContinue
            if ($fileInfo) {
                Write-Host "📋 Native module details:" -ForegroundColor Cyan
                Write-Host "   Path: $($fileInfo.Source)" -ForegroundColor Gray
                Write-Host "   Size: $([math]::Round((Get-Item $fileInfo.Source).Length / 1KB, 2)) KB" -ForegroundColor Gray
            }
        } catch {
            Write-Host "⚠️ Could not get native module details" -ForegroundColor Yellow
        }
    } else {
        Write-Host "❌ better-sqlite3 native module NOT found" -ForegroundColor Red
        Write-Host "   Expected: node_modules\better-sqlite3\build\Release\better_sqlite3.node" -ForegroundColor Gray
    }
    
    Write-Host "🎯 Native add-on fix complete!" -ForegroundColor Green
    Write-Host "💡 Now try: pnpm dev:all" -ForegroundColor Cyan
    
} catch {
    Write-Host "❌ Error during native add-on fix: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
} finally {
    # Clean up environment variables
    Remove-Item Env:npm_config_target -ErrorAction SilentlyContinue
    Remove-Item Env:npm_config_arch -ErrorAction SilentlyContinue
    Remove-Item Env:npm_config_target_arch -ErrorAction SilentlyContinue
    Remove-Item Env:npm_config_disturl -ErrorAction SilentlyContinue
    Remove-Item Env:npm_config_runtime -ErrorAction SilentlyContinue
    Remove-Item Env:npm_config_cache -ErrorAction SilentlyContinue
    Remove-Item Env:npm_config_build_from_source -ErrorAction SilentlyContinue
}