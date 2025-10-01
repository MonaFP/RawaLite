# PowerShell Build Cleanup Script for RawaLite
# Solves Windows-specific file locking issues

param(
    [switch]$Force,
    [switch]$Verbose,
    [switch]$ProcessesOnly
)

function Write-Info($message) {
    Write-Host "🧹 $message" -ForegroundColor Cyan
}

function Write-Warning($message) {
    Write-Host "⚠️  $message" -ForegroundColor Yellow
}

function Write-Error($message) {
    Write-Host "❌ $message" -ForegroundColor Red
}

function Stop-ElectronProcesses {
    Write-Info "Stopping Electron and Node processes..."
    
    $processNames = @('electron', 'node', 'rawalite', 'vite')
    
    foreach ($name in $processNames) {
        try {
            Get-Process -Name $name -ErrorAction SilentlyContinue | Stop-Process -Force
            if ($?) {
                Write-Info "Stopped $name processes"
            }
        }
        catch {
            # Process not found - this is OK
        }
    }
    
    # Wait for file handles to be released
    Write-Info "Waiting for file handles to release..."
    Start-Sleep -Seconds 2
}

function Remove-BuildArtifacts {
    Write-Info "Removing build artifacts..."
    
    $cleanupPaths = @(
        'dist',
        'dist-web', 
        'dist-electron',
        'build',
        'release',
        '.vite',
        'node_modules\.vite',
        '.cache',
        'out',
        '.tsbuildinfo'
    )
    
    foreach ($path in $cleanupPaths) {
        if (Test-Path $path) {
            Write-Info "Cleaning $path..."
            
            try {
                Remove-Item -Path $path -Recurse -Force -ErrorAction Stop
                Write-Info "✅ Removed $path"
            }
            catch {
                Write-Warning "Normal removal failed for $path"
                
                if ($Force) {
                    Force-Remove-Directory $path
                }
                else {
                    Write-Warning "Use -Force to attempt forceful removal"
                }
            }
        }
    }
}

function Force-Remove-Directory($path) {
    Write-Info "Attempting force removal of $path..."
    
    try {
        # Method 1: Robocopy mirror with empty directory
        $tempDir = Join-Path $env:TEMP "rawalite-cleanup-$(Get-Random)"
        New-Item -ItemType Directory -Path $tempDir -Force | Out-Null
        
        robocopy $tempDir $path /MIR /R:0 /W:0 | Out-Null
        Remove-Item -Path $tempDir -Force
        Remove-Item -Path $path -Recurse -Force
        
        Write-Info "✅ Force removed $path with robocopy"
    }
    catch {
        Write-Warning "Robocopy method failed, trying alternative..."
        
        try {
            # Method 2: PowerShell with retry
            for ($i = 1; $i -le 3; $i++) {
                Remove-Item -Path $path -Recurse -Force -ErrorAction Stop
                Write-Info "✅ Force removed $path (attempt $i)"
                break
            }
        }
        catch {
            if ($i -eq 3) {
                Write-Error "Failed to remove $path after 3 attempts"
                Write-Warning "File may be locked by another process"
            }
            else {
                Start-Sleep -Seconds 1
            }
        }
    }
}

function Test-CleanupSuccess {
    Write-Info "Validating cleanup..."
    
    $cleanupPaths = @('dist', 'dist-web', 'dist-electron', 'build', 'release', '.vite')
    $remaining = $cleanupPaths | Where-Object { Test-Path $_ }
    
    if ($remaining.Count -eq 0) {
        Write-Info "✅ All build artifacts cleaned successfully"
        return $true
    }
    else {
        Write-Warning "⚠️  Some artifacts remain: $($remaining -join ', ')"
        return $false
    }
}

function Show-Usage {
    Write-Host @"
🧹 RawaLite PowerShell Build Cleaner
===================================

Usage:
    .\scripts\build-cleanup.ps1 [-Force] [-Verbose]

Options:
    -Force      Attempt forceful removal of locked files
    -Verbose    Show detailed output

Examples:
    .\scripts\build-cleanup.ps1              # Normal cleanup
    .\scripts\build-cleanup.ps1 -Force       # Force cleanup
    .\scripts\build-cleanup.ps1 -Force -Verbose  # Force with details
"@
}

# Main execution
if ($args.Count -gt 0 -and ($args[0] -eq '-h' -or $args[0] -eq '--help')) {
    Show-Usage
    exit 0
}

Write-Host "🧹 RawaLite PowerShell Build Cleaner" -ForegroundColor Green
Write-Host "====================================" -ForegroundColor Green

# Always stop processes first
Stop-ElectronProcesses

# If ProcessesOnly flag is set, exit after stopping processes
if ($ProcessesOnly) {
    Write-Host "`n✅ Process cleanup completed!" -ForegroundColor Green
    Write-Host "🔄 Only processes were stopped (use without -ProcessesOnly for full cleanup)" -ForegroundColor Cyan
    exit 0
}

# Continue with full cleanup
Remove-BuildArtifacts

Write-Host "`n✅ Cleanup completed successfully!" -ForegroundColor Green
Write-Host "🚀 Ready for clean build" -ForegroundColor Green
exit 0