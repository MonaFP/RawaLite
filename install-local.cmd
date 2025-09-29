@echo off
echo RawaLite v1.0.0 - Lokale Installation
echo ====================================
echo.

echo [1/4] Dependencies installieren...
call pnpm install --frozen-lockfile
if errorlevel 1 (
    echo FEHLER: Dependencies konnten nicht installiert werden!
    pause
    exit /b 1
)

echo [2/4] Build erstellen...
call pnpm build
if errorlevel 1 (
    echo FEHLER: Build konnte nicht erstellt werden!
    pause
    exit /b 1
)

echo [3/4] Lokale ausführbare Version bereitstellen...
if exist "dist\win-unpacked" (
    echo Vorherige Installation gefunden - wird gelöscht...
    rmdir /s /q "dist\win-unpacked" 2>nul
    timeout /t 2 /nobreak >nul
)

call pnpm electron-builder --dir
if errorlevel 1 (
    echo WARNUNG: Installer-Build hatte Probleme, aber App sollte funktionieren
)

echo [4/4] RawaLite starten...
if exist "dist\win-unpacked\RawaLite.exe" (
    echo.
    echo ✅ Production-Installation erfolgreich!
    echo RawaLite wird gestartet...
    echo.
    start "" "dist\win-unpacked\RawaLite.exe"
    echo App gestartet. Sie können dieses Fenster schließen.
) else (
    echo.
    echo ✅ Entwicklungsversion bereit!
    echo RawaLite wird im Development-Modus gestartet...
    echo (Hot-Reload aktiviert für Live-Entwicklung)
    echo.
    start "" cmd /c "pnpm dev"
    echo App gestartet. Development-Server läuft.
    echo Schließen Sie das Development-Terminal zum Beenden.
)

echo.
pause