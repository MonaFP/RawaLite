# RawaLite Update-System Debug Helper
# ================================
# Dieses Skript analysiert aktive Update-Prozesse und kann einen NSIS-Installer manuell starten

param(
    [string]$InstallerPath = "",
    [switch]$FindProcesses,
    [switch]$AnalyzeProcesses,
    [switch]$StartInstaller,
    [switch]$Unblock
)

# Farben für bessere Lesbarkeit
$colors = @{
    Title = "Yellow"
    Success = "Green"
    Error = "Red"
    Info = "Cyan"
    Debug = "Magenta"
}

function Write-Title($text) {
    Write-Host $text -ForegroundColor $colors.Title
}

function Write-Success($text) {
    Write-Host "✅ $text" -ForegroundColor $colors.Success
}

function Write-Error($text) {
    Write-Host "❌ $text" -ForegroundColor $colors.Error
}

function Write-Info($text) {
    Write-Host "ℹ️ $text" -ForegroundColor $colors.Info
}

function Write-Debug($text) {
    Write-Host "🔍 $text" -ForegroundColor $colors.Debug
}

function Debug-ProcessTree {
    param($processId, $indent = "")
    try {
        $proc = Get-Process -Id $processId -ErrorAction SilentlyContinue
        if ($proc) {
            Write-Host "${indent}📊 Process: $($proc.ProcessName) (PID: $processId), Handles: $($proc.HandleCount), Window Title: '$($proc.MainWindowTitle)'" -ForegroundColor $colors.Info
            
            # Versuche Informationen zum Pfad zu bekommen
            try { 
                $procPath = $proc.Path
                Write-Host "${indent}📂 Path: $procPath" -ForegroundColor $colors.Info
            } catch { Write-Host "${indent}⚠️ Path not accessible" -ForegroundColor $colors.Error }
            
            # Versuche Informationen zum Befehlszeilen-Argument zu bekommen (WMI)
            try {
                $wmiQuery = "SELECT CommandLine FROM Win32_Process WHERE ProcessId = $processId"
                $cmdLine = (Get-WmiObject -Query $wmiQuery).CommandLine
                if ($cmdLine) { Write-Host "${indent}🔶 Command line: $cmdLine" -ForegroundColor $colors.Info }
            } catch {}
        } else {
            Write-Host "${indent}❌ Process with PID $processId no longer exists!" -ForegroundColor $colors.Error
        }
    } catch {
        Write-Host ($indent + "⚠️ Error examining process " + $processId + ": " + $_.Exception.Message) -ForegroundColor $colors.Error
    }
}

function Find-ProcessesByFilter {
    param($filter = "*")
    
    Write-Title "Searching for processes matching '$filter'"
    
    $processes = Get-Process | Where-Object { 
        ($_.ProcessName -like $filter) -or 
        ($_.Path -like "*$filter*") -or
        ($_.MainWindowTitle -like "*$filter*")
    }
    
    Write-Info "Found $($processes.Count) matching processes"
    
    foreach ($proc in $processes) {
        Debug-ProcessTree -processId $proc.Id -indent "  "
    }
    
    return $processes
}

function Find-RecentProcesses {
    param($secondsAgo = 60)
    
    $startTime = (Get-Date).AddSeconds(-$secondsAgo)
    
    Write-Title "Looking for processes started in last $secondsAgo seconds"
    
    $processes = Get-Process | Where-Object { $_.StartTime -gt $startTime }
    
    Write-Info "Found $($processes.Count) recent processes"
    
    foreach ($proc in $processes) {
        Debug-ProcessTree -processId $proc.Id -indent "  "
    }
    
    return $processes
}

function Start-InstallerProcess {
    param($path)
    
    if (-not $path -or -not (Test-Path $path)) {
        Write-Error "Invalid installer path: $path"
        return
    }
    
    Write-Title "Starting installer: $path"
    
    # Unblock file if requested
    if ($Unblock) {
        Write-Info "Unblocking file..."
        Unblock-File -Path $path -ErrorAction SilentlyContinue
    }
    
    # Capture process baseline
    $beforeProcesses = Get-Process | Select-Object -ExpandProperty Id
    
    # Try various methods
    try {
        Write-Info "METHOD 1: Using Start-Process with -Verb RunAs"
        $installerProcess = Start-Process -FilePath $path -ArgumentList '/NCRC' -PassThru -Verb RunAs
        
        if ($installerProcess) {
            Write-Success "Process started with PID: $($installerProcess.Id)"
        } else {
            Write-Error "Failed to get process object"
        }
    } catch {
        Write-Error "Method 1 failed: $_"
        
        try {
            Write-Info "METHOD 2: Using ShellExecute via .NET"
            
            Add-Type -TypeDefinition @"
using System;
using System.Diagnostics;
using System.Runtime.InteropServices;

public class ShellExecute {
    [DllImport("shell32.dll", CharSet = CharSet.Auto)]
    public static extern IntPtr ShellExecuteW(IntPtr hwnd, string lpOperation, string lpFile, string lpParameters, string lpDirectory, int nShowCmd);
    
    public const int SW_SHOW = 5;
}
"@
            $result = [ShellExecute]::ShellExecuteW([IntPtr]::Zero, "runas", $path, "/NCRC", [System.IO.Path]::GetDirectoryName($path), [ShellExecute]::SW_SHOW)
            Write-Info "ShellExecute returned: $result"
        } catch {
            Write-Error "Method 2 failed: $_"
        }
    }
    
    # Wait a bit for processes to start
    Write-Info "Waiting 5 seconds for processes to start..."
    Start-Sleep -Seconds 5
    
    # Look for new processes
    $afterProcesses = Get-Process | Select-Object -ExpandProperty Id
    $newProcessIds = $afterProcesses | Where-Object { $beforeProcesses -notcontains $_ }
    
    Write-Info "Found $($newProcessIds.Count) new processes since installer start"
    foreach ($procId in $newProcessIds) {
        Debug-ProcessTree -processId $procId
    }
    
    # Look specifically for NSIS and setup processes
    Write-Title "Checking for installer-related processes..."
    
    foreach ($filter in @("*setup*", "*install*", "*nsis*")) {
        Find-ProcessesByFilter -filter $filter
    }
}

# Show script banner
Write-Host ""
Write-Title "=========================================================="
Write-Title "            RawaLite Update-System Debug Helper            "
Write-Title "=========================================================="
Write-Host ""

# Execute requested operation
if ($FindProcesses) {
    Find-RecentProcesses -secondsAgo 120
    foreach ($filter in @("*setup*", "*install*", "*nsis*", "*rawalite*")) {
        Find-ProcessesByFilter -filter $filter
    }
}

if ($StartInstaller) {
    if (-not $InstallerPath) {
        Write-Error "Please provide -InstallerPath parameter"
    } else {
        Start-InstallerProcess -path $InstallerPath
    }
}

if ($AnalyzeProcesses) {
    # Look for potential IPC files
    Write-Title "Looking for IPC files in temp directory..."
    $ipcFiles = Get-ChildItem -Path $env:TEMP -Filter "rawalite-update-*.json" -ErrorAction SilentlyContinue
    foreach ($file in $ipcFiles) {
        Write-Info "Found IPC file: $($file.FullName)"
        try {
            $ipcData = Get-Content $file.FullName -Raw | ConvertFrom-Json
            Write-Debug "IPC Data: $($ipcData | ConvertTo-Json)"
            
            if ($ipcData.app -and $ipcData.app.pid) {
                Write-Info "Checking app process PID: $($ipcData.app.pid)"
                Debug-ProcessTree -processId $ipcData.app.pid
            }
            
            if ($ipcData.installer -and $ipcData.installer.path) {
                Write-Info "Installer path from IPC: $($ipcData.installer.path)"
                if (Test-Path $ipcData.installer.path) {
                    Write-Success "Installer file exists"
                } else {
                    Write-Error "Installer file does not exist"
                }
            }
        } catch {
            Write-Error "Failed to parse IPC file: $_"
        }
    }
}

if (-not ($FindProcesses -or $StartInstaller -or $AnalyzeProcesses)) {
    Write-Host "Usage: " -NoNewline
    Write-Host "./debug-update.ps1 " -NoNewline -ForegroundColor $colors.Title
    Write-Host "[-FindProcesses] [-AnalyzeProcesses] [-StartInstaller -InstallerPath <path>] [-Unblock]" -ForegroundColor $colors.Info
    Write-Host ""
    Write-Host "Examples:"
    Write-Host "  ./debug-update.ps1 -FindProcesses                       # Find running installer processes"
    Write-Host "  ./debug-update.ps1 -StartInstaller -InstallerPath .\setup.exe -Unblock  # Start and monitor installer"
    Write-Host "  ./debug-update.ps1 -AnalyzeProcesses                   # Analyze installer environment"
    Write-Host ""
}

Write-Host ""
Write-Title "Debug session completed"