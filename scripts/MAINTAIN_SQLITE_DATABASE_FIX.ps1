# Fix better-sqlite3 Node.js version mismatch
# This script rebuilds better-sqlite3 for the current Node.js version

Write-Host "🔧 Fixing better-sqlite3 Node.js version mismatch..." -ForegroundColor Yellow

# Stop any running dev processes first
Write-Host "Stopping any running Node.js processes..." -ForegroundColor Cyan
try {
    taskkill /F /IM node.exe 2>$null
    taskkill /F /IM electron.exe 2>$null
    Start-Sleep 2
} catch {
    Write-Host "No processes to kill" -ForegroundColor Gray
}

# Show current Node.js version
Write-Host "Current Node.js version:" -ForegroundColor Green
node --version

# Remove and reinstall better-sqlite3
Write-Host "Removing better-sqlite3..." -ForegroundColor Cyan
pnpm remove better-sqlite3

Write-Host "Reinstalling better-sqlite3..." -ForegroundColor Cyan
pnpm add better-sqlite3@12.4.1

Write-Host "✅ better-sqlite3 rebuilt for current Node.js version!" -ForegroundColor Green
Write-Host "You can now run: pnpm dev:all" -ForegroundColor Yellow