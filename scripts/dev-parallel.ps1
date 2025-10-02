# scripts/dev-parallel.ps1
# PowerShell Script für parallele Ausführung von Vite + Electron

Write-Host "Starting RawaLite Development Environment..." -ForegroundColor Green

# Vite Dev Server starten (Background Job)
Write-Host "Starting Vite Dev Server..." -ForegroundColor Blue
$viteJob = Start-Job -ScriptBlock {
    Set-Location $using:PWD
    pnpm run vite
}

# Kurz warten bis Vite läuft
Start-Sleep -Seconds 3

# Electron Dev starten (Foreground)
Write-Host "Starting Electron App..." -ForegroundColor Yellow
try {
    pnpm run electron:dev
} finally {
    # Cleanup: Vite Job beenden wenn Electron beendet wird
    Write-Host "Cleaning up background processes..." -ForegroundColor Red
    Stop-Job $viteJob -PassThru | Remove-Job
}