# === RawaLite Update Launcher v3 – Watchdog + Persistenz ===
# 🚀 ROBUST UAC-RESISTANT UPDATE SYSTEM with Result Persistence
# This script executes the installer with UAC elevation and persists results for app restart checking

param(
    [Parameter(Mandatory=$true)]
    [string]$InstallerPath,
    
    [Parameter(Mandatory=$false)]
    [string]$AppDataPath = "$env:LOCALAPPDATA\rawalite-updater",
    
    [Parameter(Mandatory=$false)]
    [string]$ResultsPath = "$env:LOCALAPPDATA\rawalite-updater\install-results.json",
    
    [Parameter(Mandatory=$false)]
    [int]$MaxWaitMinutes = 10,
    
    [Parameter(Mandatory=$false)]
    [string[]]$InstallerArgs = @("/NCRC", "/S")
)

# === LAUNCHER CONFIGURATION ===
$ErrorActionPreference = "Continue"  # Continue on errors for robust execution
$LauncherId = [System.DateTime]::Now.ToString("yyyyMMdd-HHmmss-fff")
$StartTime = Get-Date

# Create secure working directory
if (-not (Test-Path $AppDataPath)) {
    try { New-Item -Path $AppDataPath -ItemType Directory -Force | Out-Null } 
    catch { Write-Host "⚠️ Could not create AppData directory: $_" }
}

# === RESULT PERSISTENCE SYSTEM ===
function Write-InstallResult {
    param(
        [bool]$Success,
        [string]$Message,
        [int]$ExitCode = -1,
        [object]$AdditionalData = @{}
    )
    
    $result = @{
        launcherId = $LauncherId
        timestamp = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
        success = $Success
        message = $Message
        exitCode = $ExitCode
        installerPath = $InstallerPath
        duration = ((Get-Date) - $StartTime).TotalSeconds
        additionalData = $AdditionalData
    }
    
    try {
        # Atomic write with temp file for reliability
        $tempFile = "$ResultsPath.tmp"
        $result | ConvertTo-Json -Depth 10 | Out-File -FilePath $tempFile -Encoding UTF8 -Force
        Move-Item $tempFile $ResultsPath -Force
        Write-Host "✅ Result persisted: Success=$Success, ExitCode=$ExitCode"
    }
    catch {
        Write-Host "❌ Failed to persist result: $_"
    }
}

# === PRE-EXECUTION VALIDATION ===
Write-Host "🚀 [LAUNCHER $LauncherId] Starting UAC-resistant update installation"
Write-Host "📁 Installer: $InstallerPath"
Write-Host "💾 Results: $ResultsPath"
Write-Host "⏱️ Max Wait: $MaxWaitMinutes minutes"

# Validate installer exists
if (-not (Test-Path $InstallerPath)) {
    $errorMsg = "Installer file not found: $InstallerPath"
    Write-Host "❌ $errorMsg"
    Write-InstallResult -Success $false -Message $errorMsg -ExitCode -2
    exit 1
}

# Get installer info
try {
    $installerInfo = Get-Item $InstallerPath
    $sizeMB = [math]::Round($installerInfo.Length / 1MB, 2)
    Write-Host "📊 Installer Size: ${sizeMB}MB"
    Write-Host "📅 Installer Date: $($installerInfo.LastWriteTime)"
}
catch {
    Write-Host "⚠️ Could not get installer info: $_"
}

# === UAC-RESISTANT EXECUTION STRATEGY ===
Write-Host "🔐 Starting UAC-resistant installer execution..."

try {
    # Create detached PowerShell process for UAC elevation
    # This approach prevents parent process termination from affecting the installer
    $processArgs = @(
        "-NoProfile"
        "-ExecutionPolicy", "Bypass"
        "-WindowStyle", "Normal"  # Visible window for UAC interaction
        "-Command"
        @"
        `$installerPath = '$InstallerPath'
        `$installerArgs = @('$($InstallerArgs -join "', '")')
        `$resultsPath = '$ResultsPath'
        
        Write-Host '🔧 [ELEVATED] Starting NSIS installer with UAC elevation...'
        Write-Host "📁 Path: `$installerPath"
        Write-Host "🎯 Args: `$(`$installerArgs -join ' ')"
        
        try {
            # Execute installer with UAC - NO -Wait parameter to avoid UAC fork issues
            `$process = Start-Process -FilePath `$installerPath -ArgumentList `$installerArgs -Verb RunAs -PassThru
            
            if (`$process) {
                Write-Host "✅ [ELEVATED] Installer process started (PID: `$(`$process.Id))"
                
                # Monitor installer completion with timeout
                `$maxWait = $MaxWaitMinutes * 60  # Convert to seconds
                `$waited = 0
                `$checkInterval = 5  # Check every 5 seconds
                
                do {
                    Start-Sleep `$checkInterval
                    `$waited += `$checkInterval
                    
                    if (`$waited % 30 -eq 0) {  # Progress update every 30 seconds
                        Write-Host "⏳ [ELEVATED] Waiting for installer completion... (`$waited/`$maxWait seconds)"
                    }
                    
                    try {
                        `$processStillRunning = Get-Process -Id `$process.Id -ErrorAction SilentlyContinue
                    } catch {
                        `$processStillRunning = `$null
                    }
                } while (`$processStillRunning -and `$waited -lt `$maxWait)
                
                if (`$processStillRunning) {
                    Write-Host "⚠️ [ELEVATED] Installer timeout after `$maxWait seconds"
                    
                    # Persist timeout result
                    `$timeoutResult = @{
                        launcherId = '$LauncherId'
                        timestamp = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
                        success = `$false
                        message = "Installation timeout after `$maxWait seconds"
                        exitCode = -3
                        installerPath = `$installerPath
                        duration = `$waited
                    }
                    `$timeoutResult | ConvertTo-Json | Out-File -FilePath `$resultsPath -Encoding UTF8 -Force
                    
                    exit 3
                } else {
                    Write-Host "✅ [ELEVATED] Installer process completed"
                    
                    # Get final exit code
                    try {
                        `$exitCode = `$process.ExitCode
                    } catch {
                        `$exitCode = 0  # Assume success if we can't get exit code
                    }
                    
                    # Persist success result
                    `$successResult = @{
                        launcherId = '$LauncherId'
                        timestamp = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
                        success = (`$exitCode -eq 0)
                        message = if (`$exitCode -eq 0) { "Installation completed successfully" } else { "Installation completed with exit code `$exitCode" }
                        exitCode = `$exitCode
                        installerPath = `$installerPath
                        duration = `$waited
                    }
                    `$successResult | ConvertTo-Json | Out-File -FilePath `$resultsPath -Encoding UTF8 -Force
                    
                    Write-Host "💾 [ELEVATED] Result persisted with exit code: `$exitCode"
                    exit `$exitCode
                }
            } else {
                Write-Host "❌ [ELEVATED] Failed to start installer process"
                
                # Persist failure result
                `$failureResult = @{
                    launcherId = '$LauncherId'
                    timestamp = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
                    success = `$false
                    message = "Failed to start installer process"
                    exitCode = -4
                    installerPath = `$installerPath
                    duration = 0
                }
                `$failureResult | ConvertTo-Json | Out-File -FilePath `$resultsPath -Encoding UTF8 -Force
                
                exit 4
            }
        }
        catch {
            Write-Host "❌ [ELEVATED] Exception during installation: `$_"
            
            # Persist exception result
            `$exceptionResult = @{
                launcherId = '$LauncherId'
                timestamp = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
                success = `$false
                message = "Exception during installation: `$_"
                exitCode = -5
                installerPath = `$installerPath
                duration = 0
            }
            `$exceptionResult | ConvertTo-Json | Out-File -FilePath `$resultsPath -Encoding UTF8 -Force
            
            exit 5
        }
"@
    )
    
    # Launch detached elevated PowerShell process
    Write-Host "🚀 Launching detached elevated PowerShell process..."
    
    $launcherProcess = Start-Process -FilePath "powershell.exe" -ArgumentList $processArgs -PassThru -WindowStyle Normal
    
    if ($launcherProcess) {
        Write-Host "✅ Launcher process started successfully (PID: $($launcherProcess.Id))"
        Write-Host "🔄 Process is now independent of main app - UAC fork-resistant"
        
        # Write initial launcher status
        Write-InstallResult -Success $true -Message "Launcher started successfully - installation in progress" -ExitCode 0 -AdditionalData @{
            launcherPid = $launcherProcess.Id
            phase = "launcher_started"
        }
        
        Write-Host "✅ [LAUNCHER $LauncherId] Completed successfully - installation is running independently"
        exit 0
    } else {
        throw "Failed to start launcher process"
    }
}
catch {
    $errorMsg = "Launcher execution failed: $_"
    Write-Host "❌ $errorMsg"
    Write-InstallResult -Success $false -Message $errorMsg -ExitCode -1
    exit 1
}

# === END OF LAUNCHER SCRIPT ===