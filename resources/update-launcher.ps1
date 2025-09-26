# resources/update-launcher.ps1
# UAC-resistant installer launcher for RawaLite

param(
    [Parameter(Mandatory=$true)]
    [string]$InstallerPath,
    [switch]$Silent,
    [string[]]$InstallerArguments
)

$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"

function Write-Log {
    param([string]$Message)
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    Write-Host "[$timestamp] $Message"
    
    # Also write to log file
    $logDir = "$env:LOCALAPPDATA\rawalite-updater"
    $logFile = "$logDir\launcher-$(Get-Date -Format 'yyyyMMdd').log"
    
    if (-not (Test-Path $logDir)) {
        New-Item -ItemType Directory -Path $logDir -Force | Out-Null
    }
    
    Add-Content -Path $logFile -Value "[$timestamp] $Message" -Force
}

Write-Log "========================================="
Write-Log "Starting RawaLite Update Launcher"
Write-Log "Installer: $InstallerPath"
Write-Log "User: $env:USERNAME"
Write-Log "Machine: $env:COMPUTERNAME"
Write-Log "========================================="

# Check if installer exists
if (-not (Test-Path $InstallerPath)) {
    Write-Log "ERROR: Installer not found at $InstallerPath"
    exit 1
}

# Get installer file info
$fileInfo = Get-Item $InstallerPath
Write-Log "Installer size: $($fileInfo.Length) bytes"
Write-Log "Installer date: $($fileInfo.LastWriteTime)"

# Unblock file (remove Mark of the Web)
try {
    Unblock-File -Path $InstallerPath -ErrorAction SilentlyContinue
    Write-Log "File unblocked successfully (MOTW removed)"
} catch {
    Write-Log "Warning: Could not unblock file - $($_.Exception.Message)"
}

# Check current elevation status
$currentPrincipal = [Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()
$isAdmin = $currentPrincipal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
Write-Log "Current elevation status: Admin=$isAdmin"

# Check installation location
$programFiles = [Environment]::GetFolderPath("ProgramFiles")
$programFilesX86 = [Environment]::GetFolderPath("ProgramFilesX86")
$localAppData = [Environment]::GetFolderPath("LocalApplicationData")

# Check various possible installation locations
$inProgramFiles = Test-Path "$programFiles\RawaLite"
$inProgramFilesX86 = Test-Path "$programFilesX86\RawaLite"
$inLocalAppData = Test-Path "$localAppData\Programs\RawaLite"

Write-Log "Installation locations check:"
Write-Log "  - Program Files: $inProgramFiles"
Write-Log "  - Program Files (x86): $inProgramFilesX86"
Write-Log "  - LocalAppData: $inLocalAppData"

# Determine if elevation is needed
$needsElevation = ($inProgramFiles -or $inProgramFilesX86) -and -not $isAdmin

# Start installer with appropriate elevation
try {
    $installerArgs = @()

    if ($InstallerArguments) {
        $installerArgs += $InstallerArguments
    }

    if ($Silent) {
        $installerArgs += "/S"
    }

    if ($installerArgs.Count -gt 0) {
        Write-Log "Installer arguments: $($installerArgs -join ' ')"
    } else {
        Write-Log "Installer arguments: <none>"
    }

    if ($needsElevation) {
        Write-Log "Administrator privileges required - requesting UAC elevation..."
        
        # Use Start-Process with RunAs verb for UAC elevation
        $processInfo = Start-Process -FilePath $InstallerPath `
                                     -ArgumentList $installerArgs `
                                     -Verb RunAs `
                                     -Wait `
                                     -PassThru
        
        $exitCode = $processInfo.ExitCode
        Write-Log "Installer completed with exit code: $exitCode"
        
    } else {
        Write-Log "Starting installer in current context (no elevation needed)..."
        
        # Run installer normally
        $processInfo = Start-Process -FilePath $InstallerPath `
                                     -ArgumentList $installerArgs `
                                     -Wait `
                                     -PassThru
        
        $exitCode = $processInfo.ExitCode
        Write-Log "Installer completed with exit code: $exitCode"
    }
    
    # Check if installation was successful
    $success = $exitCode -eq 0
    
    if ($success) {
        Write-Log "Installation completed successfully"
    } else {
        Write-Log "Installation failed with exit code: $exitCode"
    }
    
    # Save results for the application to check later
    $resultsPath = "$env:LOCALAPPDATA\rawalite-updater\install-results.json"
    $resultsDir = Split-Path $resultsPath -Parent
    
    if (-not (Test-Path $resultsDir)) {
        New-Item -ItemType Directory -Path $resultsDir -Force | Out-Null
    }
    
    $results = @{
        success = $success
        timestamp = (Get-Date -Format "o")
        installerPath = $InstallerPath
        wasAdmin = $isAdmin
        neededElevation = $needsElevation
        exitCode = $exitCode
        machineName = $env:COMPUTERNAME
        userName = $env:USERNAME
    }
    
    $results | ConvertTo-Json | Set-Content -Path $resultsPath -Encoding UTF8
    Write-Log "Results saved to: $resultsPath"
    
    # Exit with same code as installer
    exit $exitCode
    
} catch {
    $errorMessage = $_.Exception.Message
    Write-Log "ERROR: Installation failed with exception: $errorMessage"
    Write-Log "Stack trace: $($_.ScriptStackTrace)"
    
    # Save error results
    $resultsPath = "$env:LOCALAPPDATA\rawalite-updater\install-results.json"
    $resultsDir = Split-Path $resultsPath -Parent
    
    if (-not (Test-Path $resultsDir)) {
        New-Item -ItemType Directory -Path $resultsDir -Force | Out-Null
    }
    
    @{
        success = $false
        timestamp = (Get-Date -Format "o")
        installerPath = $InstallerPath
        wasAdmin = $isAdmin
        exitCode = 999
        error = $errorMessage
    } | ConvertTo-Json | Set-Content -Path $resultsPath -Encoding UTF8
    
    exit 999
}
