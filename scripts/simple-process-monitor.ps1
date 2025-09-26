# RawaLite Update-Prozess Kurzmonitor
# Einfacher Monitor für RawaLite-Update-Prozesse

$logFile = "$env:USERPROFILE\Desktop\rawalite-update-log-simple-$(Get-Date -Format 'yyyyMMdd-HHmmss').txt"
$scanInterval = 2 # Sekunden zwischen den Scans
$processFilter = "*rawalite*", "*setup*", "*install*", "*updater*", "*nsis*"

# Header für Log-Datei
"ZEITSTEMPEL;AKTION;PROZESS_NAME;PID;FENSTER_TITEL;STARTZEIT;LAUFZEIT_SEK" | Out-File -FilePath $logFile

# Zeige Banner
Write-Host "===== RAWALITE EINFACHER PROZESS-MONITOR =====" -ForegroundColor Yellow
Write-Host "Log-Datei: $logFile" -ForegroundColor Gray
Write-Host "Scan-Intervall: $scanInterval Sekunden" -ForegroundColor Gray
Write-Host "Überwachte Prozesse: $($processFilter -join ", ")" -ForegroundColor Gray
Write-Host "Drücken Sie STRG+C zum Beenden" -ForegroundColor Gray
Write-Host "=========================================" -ForegroundColor Yellow

# Initialisiere bekannte Prozesse
$knownProcesses = @{}

# Führe Monitoring durch
try {
    while ($true) {
        # Aktuelle Zeit für Logging
        $timestamp = Get-Date -Format "HH:mm:ss.fff"
        
        # Hole aktuelle Prozesse
        $currentProcesses = Get-Process | Where-Object {
            foreach ($filter in $processFilter) {
                if ($_.ProcessName -like $filter) { return $true }
            }
            return $false
        }
        
        # Prüfe auf neue Prozesse
        foreach ($proc in $currentProcesses) {
            $procInfo = "$($proc.ProcessName);$($proc.Id);$($proc.MainWindowTitle);$($proc.StartTime.ToString('HH:mm:ss'));$([Math]::Round(((Get-Date) - $proc.StartTime).TotalSeconds, 1))"
            
            if (-not $knownProcesses.ContainsKey($proc.Id)) {
                # Neuer Prozess gefunden
                $knownProcesses[$proc.Id] = @{
                    Name = $proc.ProcessName
                    WindowTitle = $proc.MainWindowTitle
                    StartTime = $proc.StartTime
                }
                
                Write-Host "➕ NEUER PROZESS: $($proc.ProcessName) (PID: $($proc.Id)) - '$($proc.MainWindowTitle)'" -ForegroundColor Green
                "$timestamp;NEU;$procInfo" | Out-File -FilePath $logFile -Append
            } else {
                # Bekannter Prozess - prüfe auf Änderungen
                $known = $knownProcesses[$proc.Id]
                
                if ($known.WindowTitle -ne $proc.MainWindowTitle) {
                    Write-Host "📝 TITEL GEÄNDERT: $($proc.ProcessName) (PID: $($proc.Id)) - '$($proc.MainWindowTitle)'" -ForegroundColor Yellow
                    "$timestamp;TITEL_ÄNDERUNG;$procInfo" | Out-File -FilePath $logFile -Append
                    $known.WindowTitle = $proc.MainWindowTitle
                }
                
                # Aktualisiere dennoch für die Logs alle 10 Sekunden
                if ((Get-Date).Second % 10 -eq 0) {
                    "$timestamp;UPDATE;$procInfo" | Out-File -FilePath $logFile -Append
                }
            }
        }
        
        # Prüfe auf beendete Prozesse
        $currentPids = $currentProcesses | ForEach-Object { $_.Id }
        $endedPids = $knownProcesses.Keys | Where-Object { $currentPids -notcontains $_ }
        
        foreach ($endedPid in $endedPids) {
            $endedProc = $knownProcesses[$endedPid]
            $runtime = [Math]::Round(((Get-Date) - $endedProc.StartTime).TotalSeconds, 1)
            
            Write-Host "❌ PROZESS BEENDET: $($endedProc.Name) (PID: $endedPid) - Laufzeit: ${runtime}s" -ForegroundColor Red
            "$timestamp;BEENDET;$($endedProc.Name);$endedPid;$($endedProc.WindowTitle);$($endedProc.StartTime.ToString('HH:mm:ss'));$runtime" | Out-File -FilePath $logFile -Append
            
            # Entferne aus der Liste bekannter Prozesse
            $knownProcesses.Remove($endedPid)
        }
        
        # Temporäre Update-Dateien überwachen
        $tempUpdateFiles = Get-ChildItem -Path $env:TEMP -Filter "rawalite-update-*" -ErrorAction SilentlyContinue
        foreach ($file in $tempUpdateFiles) {
            if (-not $knownFiles -or -not $knownFiles.ContainsKey($file.FullName) -or $knownFiles[$file.FullName] -ne $file.LastWriteTime) {
                Write-Host "📄 UPDATE-DATEI: $($file.Name) (Geändert: $($file.LastWriteTime.ToString('HH:mm:ss')))" -ForegroundColor Magenta
                "$timestamp;UPDATE_DATEI;$($file.Name);;$($file.FullName);$($file.LastWriteTime.ToString('HH:mm:ss'));" | Out-File -FilePath $logFile -Append
                
                # Für JSON-Dateien Inhalt protokollieren
                if ($file.Extension -eq ".json") {
                    try {
                        $content = Get-Content $file.FullName -Raw | ConvertFrom-Json 
                        $contentStr = $content | ConvertTo-Json -Compress
                        Write-Host "  └─ Inhalt: $contentStr" -ForegroundColor Gray
                        "$timestamp;JSON_INHALT;$($file.Name);;$contentStr;;" | Out-File -FilePath $logFile -Append
                    } catch {}
                }
            }
        }
        
        # Warte auf nächsten Scan
        Start-Sleep -Seconds $scanInterval
    }
} finally {
    Write-Host "Monitor beendet. Log gespeichert in: $logFile" -ForegroundColor Yellow
}