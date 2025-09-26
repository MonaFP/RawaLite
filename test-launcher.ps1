# Test Script for UAC-Resistant Update Launcher
# This script tests the new launcher system without actually installing anything

Write-Host "🧪 Testing RawaLite Update Launcher System" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan

$LauncherPath = "$PSScriptRoot\resources\update-launcher.ps1"
$TestInstallerPath = "$PSScriptRoot\dist\rawalite-Setup-1.8.97.exe"  # If it exists

Write-Host ""
Write-Host "📍 Launcher Script: $LauncherPath" -ForegroundColor Yellow
Write-Host "📍 Test Installer: $TestInstallerPath" -ForegroundColor Yellow
Write-Host ""

# Check if launcher script exists
if (Test-Path $LauncherPath) {
    Write-Host "✅ Launcher script found!" -ForegroundColor Green
} else {
    Write-Host "❌ Launcher script not found at: $LauncherPath" -ForegroundColor Red
    Write-Host "Expected location: resources\update-launcher.ps1" -ForegroundColor Yellow
    exit 1
}

# Check if we have a test installer
if (Test-Path $TestInstallerPath) {
    Write-Host "✅ Test installer found!" -ForegroundColor Green
    $InstallerSize = [math]::Round((Get-Item $TestInstallerPath).Length / 1MB, 2)
    Write-Host "📊 Installer size: ${InstallerSize}MB" -ForegroundColor Cyan
    
    # Test launcher execution (dry run)
    Write-Host ""
    Write-Host "🚀 Testing launcher execution..." -ForegroundColor Cyan
    Write-Host "Note: This will show UAC prompt - click 'No/Cancel' to test without installing" -ForegroundColor Yellow
    Write-Host ""
    
    try {
        # Execute launcher with actual installer
        & $LauncherPath -InstallerPath $TestInstallerPath -MaxWaitMinutes 1
        
        Write-Host ""
        Write-Host "✅ Launcher test completed!" -ForegroundColor Green
        
        # Check for results file
        $ResultsPath = "$env:LOCALAPPDATA\rawalite-updater\install-results.json"
        if (Test-Path $ResultsPath) {
            Write-Host "📊 Installation results found:" -ForegroundColor Cyan
            $Results = Get-Content $ResultsPath | ConvertFrom-Json
            Write-Host "  Success: $($Results.success)" -ForegroundColor $(if ($Results.success) { "Green" } else { "Red" })
            Write-Host "  Message: $($Results.message)" -ForegroundColor White
            Write-Host "  Exit Code: $($Results.exitCode)" -ForegroundColor White
            Write-Host "  Duration: $($Results.duration)s" -ForegroundColor White
        } else {
            Write-Host "📊 No installation results found (expected for cancelled UAC)" -ForegroundColor Yellow
        }
        
    } catch {
        Write-Host "❌ Launcher test failed: $_" -ForegroundColor Red
    }
    
} else {
    Write-Host "⚠️ No test installer found" -ForegroundColor Yellow
    Write-Host "Expected: dist\rawalite-Setup-1.8.97.exe" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "💡 To create test installer run: pnpm run dist" -ForegroundColor Cyan
    
    # Test launcher syntax only
    Write-Host ""
    Write-Host "🔧 Testing launcher syntax with dummy path..." -ForegroundColor Cyan
    
    try {
        # Test with non-existent file (should fail gracefully)
        & $LauncherPath -InstallerPath "C:\NonExistent\test.exe" -MaxWaitMinutes 1
    } catch {
        Write-Host "Expected error for non-existent file: $_" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "🏁 Launcher test completed!" -ForegroundColor Green
Write-Host "You can now test the update system from within the RawaLite app." -ForegroundColor Cyan