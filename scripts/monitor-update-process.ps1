# RawaLite Update-Prozess Monitor
# Dieses Skript überwacht kontinuierlich den Update-Prozess von RawaLite

$logFile = "$env:USERPROFILE\Desktop\rawalite-update-log-$(Get-Date -Format 'yyyyMMdd-HHmmss').txt"
$knownProcesses = @{}
$startTime = Get-Date
$scanInterval = 1 # Sekunden zwischen den Scans

function Write-ColorLog {
    param(
        [string]$message,
        [string]$color = "White"
    )
    
    Write-Host $message -ForegroundColor $color
    Add-Content -Path $logFile -Value "$(Get-Date -Format 'HH:mm:ss'): $message"
}

function Write-ProcessDetails {
    param(
        [System.Diagnostics.Process]$process,
        [string]$prefix = "",
        [switch]$isNew
    )
    
    $runtime = [Math]::Round(((Get-Date) - $process.StartTime).TotalSeconds, 1)
    $cmdLine = ""
    
    try {
        $wmiQuery = "SELECT CommandLine FROM Win32_Process WHERE ProcessId = $($process.Id)"
        $cmdLine = (Get-WmiObject -Query $wmiQuery -ErrorAction SilentlyContinue).CommandLine
        if (!$cmdLine) { $cmdLine = "[Nicht verfügbar]" }
    } catch {
        $cmdLine = "[Zugriff verweigert]"
    }
    
    $color = if ($isNew) { "Green" } else { "Cyan" }
    $status = if ($isNew) { "NEU" } else { "---" }
    
    $message = "$($prefix)[$status] $($process.ProcessName) (PID: $($process.Id)) | Titel: '$($process.MainWindowTitle)' | Laufzeit: ${runtime}s"
    Write-ColorLog $message $color
    
    if ($cmdLine -ne "[Nicht verfügbar]") {
        Write-ColorLog "$($prefix)      Cmd: $cmdLine" "Gray"
    }
    
    # Fenster-Informationen
    if ($process.MainWindowHandle -ne 0) {
        Write-ColorLog "$($prefix)      Fenster: Aktiv" "Yellow"
    }
}

function Get-UpdateProcesses {
    $allProcesses = @()
    
    # Suche nach RawaLite-Prozessen
    $allProcesses += Get-Process | Where-Object {
        $_.ProcessName -like "*rawalite*" -or
        $_.ProcessName -like "*setup*" -or
        $_.ProcessName -like "*install*" -or
        $_.ProcessName -like "*updater*" -or
        $_.ProcessName -like "*nsis*"
    }
    
    return $allProcesses
}

function Get-LogEntries {
    $logPaths = @(
        "$env:APPDATA\RawaLite\logs\main.log",
        "$env:APPDATA\RawaLite\logs\renderer.log",
        "$env:LOCALAPPDATA\Programs\rawalite\resources\app.asar.unpacked\dist\main.log"
    )
    
    foreach ($path in $logPaths) {
        if (Test-Path $path) {
            $lastLines = Get-Content $path -Tail 10 -ErrorAction SilentlyContinue
            if ($lastLines) {
                Write-ColorLog "📄 Letzte Log-Einträge aus $($path):" "Magenta"
                foreach ($line in $lastLines) {
                    if ($line -match "update|version|download|install") {
                        Write-ColorLog "   $line" "Yellow"
                    }
                }
            }
        }
    }
    
    # Suche nach temporären Update-Dateien
    $tempFiles = Get-ChildItem -Path $env:TEMP -Filter "*rawalite*update*" -ErrorAction SilentlyContinue
    if ($tempFiles) {
        Write-ColorLog "🔍 Temporäre Update-Dateien:" "Magenta"
        foreach ($file in $tempFiles) {
            Write-ColorLog "   $($file.FullName) ($(Get-Date $file.LastWriteTime -Format 'HH:mm:ss'))" "Yellow"
            
            if ($file.Extension -eq ".json") {
                try {
                    $content = Get-Content $file.FullName -Raw -ErrorAction SilentlyContinue | ConvertFrom-Json -ErrorAction SilentlyContinue
                    if ($content) {
                        $contentStr = $content | ConvertTo-Json -Depth 1 -Compress
                        Write-ColorLog "      $contentStr" "Gray"
                    }
                } catch {}
            }
        }
    }
}

# Banner anzeigen
Write-ColorLog "===== RAWALITE UPDATE MONITOR GESTARTET =====" "Yellow"
Write-ColorLog "Log-Datei: $logFile" "Gray"
Write-ColorLog "Start-Zeit: $startTime" "Gray"
Write-ColorLog "Scan-Intervall: $scanInterval Sekunden" "Gray"
Write-ColorLog "Drücken Sie STRG+C zum Beenden" "Gray"
Write-ColorLog "=========================================" "Yellow"

# Initialen Scan durchführen
Write-ColorLog "🚀 Initialer Prozess-Scan..." "Yellow"
$initialProcesses = Get-UpdateProcesses
foreach ($proc in $initialProcesses) {
    $knownProcesses[$proc.Id] = $proc.StartTime
    Write-ProcessDetails -process $proc -prefix "   "
}

# Kontinuierliche Überwachung
try {
    while ($true) {
        Start-Sleep -Seconds $scanInterval
        
        # Nach neuen oder veränderten Prozessen suchen
        $currentProcesses = Get-UpdateProcesses
        
        # Prüfen auf neue Prozesse
        foreach ($proc in $currentProcesses) {
            if (-not $knownProcesses.ContainsKey($proc.Id)) {
                $knownProcesses[$proc.Id] = $proc.StartTime
                Write-ProcessDetails -process $proc -isNew
                
                # Bei neuen Update-Prozessen, schaue nach Logeinträgen
                if ($proc.ProcessName -match "setup|install|update") {
                    Get-LogEntries
                }
            } else {
                # Wenn sich der Fenstertitel geändert hat
                $lastKnownTitle = $knownProcesses["$($proc.Id)_title"]
                if ($lastKnownTitle -ne $proc.MainWindowTitle -and $proc.MainWindowTitle) {
                    Write-ColorLog "📝 Fenster-Titel geändert für $($proc.ProcessName) (PID: $($proc.Id)): '$($proc.MainWindowTitle)'" "Yellow"
                    $knownProcesses["$($proc.Id)_title"] = $proc.MainWindowTitle
                }
            }
        }
        
        # Prüfen auf beendete Prozesse
        $endedProcessIds = $knownProcesses.Keys | Where-Object { $_ -match "^\d+$" } | Where-Object {
            $procId = $_
            -not ($currentProcesses | Where-Object { $_.Id -eq $procId })
        }
        
        foreach ($procId in $endedProcessIds) {
            Write-ColorLog "🛑 Prozess beendet: PID $procId (Laufzeit: $([Math]::Round(((Get-Date) - $knownProcesses[$procId]).TotalSeconds, 1))s)" "Red"
            $knownProcesses.Remove($procId)
            $knownProcesses.Remove("${procId}_title")
            
            # Nach Prozess-Ende, schaue nach Logeinträgen
            Get-LogEntries
        }
        
        # Alle 30 Sekunden vollständige Log-Einträge anzeigen
        $runTime = [Math]::Round(((Get-Date) - $startTime).TotalSeconds, 0)
        if ($runTime % 30 -eq 0) {
            Write-ColorLog "⏱️ Monitor läuft seit $runTime Sekunden..." "Cyan"
            Get-LogEntries
        }
    }
} finally {
    Write-ColorLog "===== MONITOR BEENDET =====" "Yellow"
    Write-ColorLog "Monitoring-Daten gespeichert in: $logFile" "Green"
}