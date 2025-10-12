# RawaLite Lokale Installation PowerShell Script
Write-Host "RawaLite v1.0.0 - Lokale Installation" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan
Write-Host ""

try {
    # Schritt 1: Dependencies
    Write-Host "[1/4] Dependencies installieren..." -ForegroundColor Yellow
    & pnpm install --frozen-lockfile
    if ($LASTEXITCODE -ne 0) { throw "Dependencies konnten nicht installiert werden!" }

    # Schritt 2: Build
    Write-Host "[2/4] Build erstellen..." -ForegroundColor Yellow
    & pnpm build
    if ($LASTEXITCODE -ne 0) { throw "Build konnte nicht erstellt werden!" }

    # Schritt 3: Native Dependencies rebuild
    Write-Host "[3/4] Native Dependencies für Electron rebuilden..." -ForegroundColor Yellow
    & npx electron-rebuild
    if ($LASTEXITCODE -ne 0) { 
        Write-Host "WARNUNG: Electron-rebuild hatte Probleme, versuche dennoch fortzufahren..." -ForegroundColor Yellow
    }

    # Schritt 4: Production Build
    Write-Host "[4/4] Production Version erstellen..." -ForegroundColor Yellow
    & pnpm dist
    if ($LASTEXITCODE -ne 0) { 
        Write-Host "WARNUNG: Distribution hatte Probleme, prüfe vorhandene Version..." -ForegroundColor Yellow
    }

    # Schritt 5: App starten
    Write-Host "[5/5] RawaLite starten..." -ForegroundColor Yellow
    
    if (Test-Path "release\win-unpacked\RawaLite.exe") {
        Write-Host ""
        Write-Host "✅ Production-Installation erfolgreich!" -ForegroundColor Green
        Write-Host "RawaLite wird gestartet..." -ForegroundColor Green
        Write-Host ""
        Start-Process "release\win-unpacked\RawaLite.exe"
        Write-Host "App gestartet. Sie können dieses Fenster schließen." -ForegroundColor Green
    } elseif (Test-Path "dist\win-unpacked\RawaLite.exe") {
        Write-Host ""
        Write-Host "✅ Alternative Production-Installation gefunden!" -ForegroundColor Green
        Write-Host "RawaLite wird gestartet..." -ForegroundColor Green
        Write-Host ""
        Start-Process "dist\win-unpacked\RawaLite.exe"
        Write-Host "App gestartet. Sie können dieses Fenster schließen." -ForegroundColor Green
    } else {
        Write-Host ""
        Write-Host "⚠️ Keine Production-Version gefunden - starte Entwicklungsversion..." -ForegroundColor Yellow
        Write-Host "RawaLite wird im Development-Modus gestartet..." -ForegroundColor Yellow
        Write-Host "(Hot-Reload aktiviert für Live-Entwicklung)" -ForegroundColor Yellow
        Write-Host ""
        Start-Process "cmd" -ArgumentList "/c", "pnpm dev"
        Write-Host "App gestartet. Development-Server läuft." -ForegroundColor Yellow
        Write-Host "Schließen Sie das Development-Terminal zum Beenden." -ForegroundColor Yellow
    }
    
} catch {
    Write-Host ""
    Write-Host "❌ Fehler: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "Drücken Sie eine beliebige Taste zum Beenden..." -ForegroundColor Yellow
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    exit 1
}

Write-Host ""
Write-Host "Drücken Sie eine beliebige Taste zum Beenden..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")