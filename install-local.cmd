@echo off
setlocal

echo RawaLite - Lokale Installation
echo =============================
echo.
echo Dieses Skript startet den lokalen Installer für RawaLite.
echo.

REM PowerShell-Skript mit Administratorrechten starten
powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "& {Start-Process powershell.exe -ArgumentList '-NoProfile -ExecutionPolicy Bypass -File \"scripts\install-local-update.ps1\"' -Verb RunAs}"

echo.
echo Falls sich kein PowerShell-Fenster öffnet, bitte die UAC-Anfrage bestätigen.
echo.
pause