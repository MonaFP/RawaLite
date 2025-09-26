# resources/update-launcher.ps1

# UAC-resistant installer launcher for RawaLite



param(

    [Parameter(Mandatory=$true)]

    [string]$InstallerPath,

    [switch]$Silent,

    [switch]$ForceElevation,

    [string[]]$InstallerArguments

)



$ErrorActionPreference = "Stop"

$ProgressPreference = "SilentlyContinue"



function Write-Log {

    param([string]$Message)

    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"

    Write-Host "[$timestamp] $Message"



    $logDir = Join-Path $env:LOCALAPPDATA 'rawalite-updater'

    $logFile = Join-Path $logDir "launcher-$(Get-Date -Format 'yyyyMMdd').log"



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



if (-not (Test-Path $InstallerPath)) {

    Write-Log "ERROR: Installer not found at $InstallerPath"

    exit 1

}



$fileInfo = Get-Item $InstallerPath

Write-Log "Installer size: $($fileInfo.Length) bytes"

Write-Log "Installer date: $($fileInfo.LastWriteTime)"



try {

    Unblock-File -Path $InstallerPath -ErrorAction SilentlyContinue

    Write-Log "File unblocked successfully (MOTW removed)"

} catch {

    Write-Log "Warning: Could not unblock file - $($_.Exception.Message)"

}



$currentPrincipal = [Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()

$isAdmin = $currentPrincipal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

Write-Log "Current elevation status: Admin=$isAdmin"



$programFiles = [Environment]::GetFolderPath("ProgramFiles")

$programFilesX86 = [Environment]::GetFolderPath("ProgramFilesX86")

$localAppData = [Environment]::GetFolderPath("LocalApplicationData")



$inProgramFiles = Test-Path (Join-Path $programFiles 'RawaLite')

$inProgramFilesX86 = Test-Path (Join-Path $programFilesX86 'RawaLite')

$inLocalAppData = Test-Path (Join-Path $localAppData 'Programs\RawaLite')



Write-Log "Installation locations check:"

Write-Log "  - Program Files: $inProgramFiles"

Write-Log "  - Program Files (x86): $inProgramFilesX86"

Write-Log "  - LocalAppData: $inLocalAppData"



if ($ForceElevation.IsPresent) {

    Write-Log "Force elevation flag detected - overriding heuristic to RunAs"

    $needsElevation = $true

} else {

    $needsElevation = ($inProgramFiles -or $inProgramFilesX86) -and -not $isAdmin

}



try {

    $installerArgs = @()



    if ($InstallerArguments) {

        $installerArgs += $InstallerArguments | Where-Object { $_ -ne $null -and $_.ToString().Trim().Length -gt 0 }

    }



    if ($Silent) {

        $installerArgs += "/S"

    }



    Write-Log "Installer argument count: $($installerArgs.Count)"

    if ($installerArgs.Count -gt 0) {

        Write-Log "Installer arguments: $($installerArgs -join ' ')"

    } else {

        Write-Log "Installer arguments: <none>"

    }



    # ==== STAGING IN %TEMP% GEGEN LOCKS ====
    $stagingDir = Join-Path $env:TEMP 'rawalite-launcher\staged'
    New-Item -ItemType Directory -Force -Path $stagingDir | Out-Null
    $staged = Join-Path $stagingDir ("rawalite-" + [IO.Path]::GetFileName($InstallerPath))

    Copy-Item $InstallerPath $staged -Force
    Unblock-File $staged -ErrorAction SilentlyContinue
    Write-Log "Staged installer to: $staged"

    # ==== RETRY-LOOP FÜR KURZE LOCKS/SCANS ====
    $tries = 0
    $max = 10
    $processInfo = $null
    
    while ($true) {
        try {
            $startProcessParams = @{
                FilePath        = $staged
                WorkingDirectory = (Split-Path $staged)
                WindowStyle     = 'Normal'
                PassThru        = $true
            }

            if ($installerArgs.Count -gt 0) {
                $startProcessParams.ArgumentList = $installerArgs
            }

            if ($needsElevation) {
                Write-Log "Requesting elevation via RunAs for staged installer"
                $startProcessParams.Verb = 'RunAs'
            } else {
                Write-Log "Launching staged installer without elevation"
            }

            $processInfo = Start-Process @startProcessParams
            Write-Log "✅ Installer started: $staged (Process ID: $($processInfo.Id))"
            break
        } catch {
            $tries++
            Write-Log "⏳ Locked? Retry $tries/$max : $($_.Exception.Message)"
            if ($tries -ge $max) { throw }
            Start-Sleep 1
        }
    }



    # Process started successfully - installer runs independently
    Write-Log "Installer process launched successfully (PID: $($processInfo.Id))"
    Write-Log "NSIS installer should now be visible to the user"
    
    $success = $true  # Launch success, not installation completion
    $exitCode = 0     # Launcher success



    $resultsPath = Join-Path $env:LOCALAPPDATA 'rawalite-updater\install-results.json'

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



    exit $exitCode



} catch {

    $errorMessage = $_.Exception.Message

    Write-Log "ERROR: Installation failed with exception: $errorMessage"

    Write-Log "Stack trace: $($_.ScriptStackTrace)"



    $resultsPath = Join-Path $env:LOCALAPPDATA 'rawalite-updater\install-results.json'

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

