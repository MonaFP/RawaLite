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
if exist "release\win-unpacked" (
    echo Vorherige Installation gefunden - wird gelöscht...
    rmdir /s /q "release\win-unpacked" 2>nul
    timeout /t 2 /nobreak >nul
)

call pnpm electron-builder --dir
if errorlevel 1 (
    echo WARNUNG: Installer-Build hatte Probleme, aber App sollte funktionieren
)

echo [4/4] RawaLite starten...
echo.
if exist "release\win-unpacked\RawaLite.exe" (
    echo ✅ Production-Installation erfolgreich!
    echo RawaLite wird gestartet...
    echo.
    echo DEBUG: App-Pfad: release\win-unpacked\RawaLite.exe
    start "" "release\win-unpacked\RawaLite.exe"
    echo.
    echo 🚀 App gestartet! Installation abgeschlossen.
    echo ℹ️  Die App läuft jetzt im Hintergrund.
    echo ℹ️  Dieses Terminal kann geschlossen werden.
    echo.
    timeout /t 3 /nobreak >nul
    echo Fertig! 🎉
) else (
    echo ❌ FEHLER: RawaLite.exe nicht gefunden!
    echo Expected: release\win-unpacked\RawaLite.exe
    dir "release\win-unpacked\" 2>nul | findstr "RawaLite"
    echo.
    echo Fallback: Versuche direkten Installer...
    if exist "release\RawaLite Setup 1.0.0.exe" (
        echo ✅ Installer gefunden - wird ausgeführt...
        start "" "release\RawaLite Setup 1.0.0.exe"
        echo Installer gestartet. Folgen Sie den Anweisungen.
        pause
    ) else (
        echo ❌ Weder ausführbare App noch Installer gefunden!
        echo Starte Development-Modus...
        start "" cmd /c "pnpm dev"
        echo Development-Server gestartet.
        pause
    )
)

echo.