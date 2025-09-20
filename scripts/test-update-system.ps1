# ===== RAWALITE UPDATE SYSTEM E2E TEST =====
# Test Script für die 5 kritischen Update-Fixes

Write-Host "🔬 RawaLite Update-System E2E Test" -ForegroundColor Cyan
Write-Host "Version: 1.8.1 | Fixes: IPC, autoUpdater, VersionService, UI-State, Cache" -ForegroundColor Gray
Write-Host ""

# 1. Build & Start App
Write-Host "1️⃣ Baue und starte App..." -ForegroundColor Yellow
pnpm run build
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Build erfolgreich" -ForegroundColor Green
    
    # 🔧 CRITICAL FIX: Starte Vite Dev-Server UND Electron parallel 
    Write-Host "   🚀 Starte Vite Dev-Server..." -ForegroundColor Yellow
    $viteProcess = Start-Process "pnpm" -ArgumentList "run vite" -PassThru -WindowStyle Minimized
    Start-Sleep 3  # Warte bis Vite bereit ist
    
    Write-Host "   🖥️ Starte Electron App..." -ForegroundColor Yellow  
    $electronProcess = Start-Process "pnpm" -ArgumentList "run electron:dev" -PassThru -WindowStyle Minimized
    Start-Sleep 2
    Write-Host "✅ App gestartet (Vite PID: $($viteProcess.Id), Electron PID: $($electronProcess.Id))" -ForegroundColor Green
} else {
    Write-Host "❌ Build fehlgeschlagen!" -ForegroundColor Red
    exit 1
}

# 2. Überprüfe IPC-Integration
Write-Host "`n2️⃣ Teste IPC-Integration..." -ForegroundColor Yellow
Write-Host "   📋 Manuell zu prüfen:" -ForegroundColor Gray
Write-Host "   - DevTools öffnen (F12)" -ForegroundColor White  
Write-Host "   - Console: window.rawalite.updater.checkForUpdates()" -ForegroundColor White
Write-Host "   - Erwartung: Kein 'undefined' Fehler" -ForegroundColor White

# 3. Teste Version Service
Write-Host "`n3️⃣ Teste VersionService Cache..." -ForegroundColor Yellow
Write-Host "   📋 Manuell zu prüfen:" -ForegroundColor Gray
Write-Host "   - App-Info Dialog öffnen" -ForegroundColor White
Write-Host "   - Erwartung: Version 1.8.1 korrekt angezeigt" -ForegroundColor White
Write-Host "   - Kein localStorage Override" -ForegroundColor White

# 4. Teste Auto-Update UI
Write-Host "`n4️⃣ Teste Update-Modal UI..." -ForegroundColor Yellow  
Write-Host "   📋 Manuell zu prüfen:" -ForegroundColor Gray
Write-Host "   - Update-Check auslösen" -ForegroundColor White
Write-Host "   - Erwartung: Korrekte Status-Übergänge" -ForegroundColor White
Write-Host "   - Keine 'Erfolgreich installiert' vor Download" -ForegroundColor White

# 5. Teste autoUpdater Config
Write-Host "`n5️⃣ Teste NSIS autoUpdater..." -ForegroundColor Yellow
Write-Host "   📋 Electron-Logs prüfen:" -ForegroundColor Gray  

# Finde und zeige aktuelle Log-Dateien
$appDataLogs = "$Env:APPDATA\RawaLite\logs\main.log"
$localDataLogs = "$Env:LOCALAPPDATA\Programs\rawalite\main.log"  
if (Test-Path $appDataLogs) {
    Write-Host "   ✅ Logs gefunden: $appDataLogs" -ForegroundColor Green
    $logSize = [math]::Round((Get-Item $appDataLogs).Length / 1KB, 2)
    Write-Host "   📊 Log-Größe: $logSize KB" -ForegroundColor Gray
} elseif (Test-Path $localDataLogs) {
    Write-Host "   ✅ Logs gefunden: $localDataLogs" -ForegroundColor Green
} else {
    Write-Host "   ⚠️ Keine Logs gefunden - möglicherweise noch nicht gestartet" -ForegroundColor Yellow
}
Write-Host "   - Erwartung: disableWebInstaller = true" -ForegroundColor White
Write-Host "   - quitAndInstall(false, false) Parameter" -ForegroundColor White

Write-Host "`n🎯 E2E Test-Plan bereit!" -ForegroundColor Green
Write-Host "📝 Alle 5 kritischen Fixes sind zu verifizieren." -ForegroundColor Yellow

# Cleanup Helper
Write-Host "`n💡 Cleanup nach Tests:" -ForegroundColor Cyan
Write-Host "   Get-Process '*RawaLite*','*vite*','*node*' | Where-Object {$_.ProcessName -match 'RawaLite|vite|node'} | Stop-Process -Force" -ForegroundColor White
Write-Host "   ODER einfach: taskkill /f /im RawaLite.exe /im node.exe" -ForegroundColor White