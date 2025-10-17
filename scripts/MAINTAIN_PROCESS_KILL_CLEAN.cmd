@echo off
REM Simple process cleanup for RawaLite builds
taskkill /f /im electron.exe 2>nul
taskkill /f /im node.exe 2>nul  
taskkill /f /im rawalite.exe 2>nul
echo Process cleanup completed
exit /b 0