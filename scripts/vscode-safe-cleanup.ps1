# VS Code-Safe Process Cleanup
Write-Host "🔧 VS Code-Safe Process Cleanup" -ForegroundColor Yellow

# Stop Node.js processes (excluding VS Code)
Write-Host "🔍 Checking Node.js processes..." -ForegroundColor Gray
try {
    $nodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object { 
        $_.MainWindowTitle -notlike "*Visual Studio Code*" -and
        $_.ProcessName -notlike "*Code*"
    }
    
    if ($nodeProcesses) {
        Write-Host "🚫 Stopping $($nodeProcesses.Count) Node.js process(es)..." -ForegroundColor Red
        $nodeProcesses | Stop-Process -Force
        Write-Host "✅ Node.js processes stopped" -ForegroundColor Green
    } else {
        Write-Host "✅ No Node.js processes to stop" -ForegroundColor Green
    }
} catch {
    Write-Host "⚠️ Error with Node.js processes: $($_.Exception.Message)" -ForegroundColor Yellow
}

# Stop Electron processes
Write-Host "🔍 Checking Electron processes..." -ForegroundColor Gray
try {
    $electronProcesses = Get-Process -Name "electron" -ErrorAction SilentlyContinue
    if ($electronProcesses) {
        Write-Host "🚫 Stopping Electron processes..." -ForegroundColor Red
        $electronProcesses | Stop-Process -Force
        Write-Host "✅ Electron processes stopped" -ForegroundColor Green
    } else {
        Write-Host "✅ No Electron processes found" -ForegroundColor Green
    }
} catch {
    Write-Host "⚠️ No Electron processes or error: $($_.Exception.Message)" -ForegroundColor Yellow
}

# Wait for cleanup
Write-Host "⏳ Waiting for cleanup..." -ForegroundColor Cyan
Start-Sleep -Seconds 2

Write-Host "✅ VS Code-safe cleanup completed!" -ForegroundColor Green