# Verifikations-Script für den Update-Launcher

# Check ob die RawaLite App installiert ist
$appPath = "${env:ProgramFiles}\rawalite\rawalite.exe"
if (-not (Test-Path $appPath)) {
    $appPath = "${env:LocalAppData}\Programs\rawalite\rawalite.exe"
}

# App-Version ermitteln
$appVersion = ""
if (Test-Path $appPath) {
    try {
        $appVersion = (Get-Item $appPath).VersionInfo.ProductVersion
        Write-Host "✅ RawaLite gefunden: $appPath (Version $appVersion)"
    } catch {
        Write-Host "⚠️ RawaLite gefunden, konnte Version nicht lesen: $appPath"
    }
} else {
    Write-Host "❌ RawaLite nicht gefunden. Bitte installieren Sie die App zuerst."
    exit 1
}

# Update-Launcher prüfen
$launcherPath = Join-Path (Split-Path $appPath) "resources\resources\update-launcher.js"
if (Test-Path $launcherPath) {
    Write-Host "✅ Update-Launcher gefunden: $launcherPath"
    
    # Prüfe den Inhalt des Launchers (erste Zeilen)
    $launcherContent = Get-Content $launcherPath -TotalCount 5
    Write-Host "📄 Launcher Inhalt (Auszug):"
    $launcherContent | ForEach-Object { Write-Host "   $_" }
} else {
    Write-Host "❌ Update-Launcher NICHT gefunden in: $launcherPath"
    
    # Zeige alle Dateien im resources-Verzeichnis an
    $resourcesDir = Join-Path (Split-Path $appPath) "resources"
    if (Test-Path $resourcesDir) {
        Write-Host "📂 Inhalt des resources-Verzeichnisses:"
        Get-ChildItem -Path $resourcesDir -Recurse | ForEach-Object {
            Write-Host "   $_"
        }
    } else {
        Write-Host "❌ Resources-Verzeichnis nicht gefunden: $resourcesDir"
    }
}

# Prüfe, ob Update-Launcher-Logs existieren
$updateLauncherLogs = Get-ChildItem -Path $env:TEMP -Filter "rawalite-update-launcher-*.log" | Sort-Object LastWriteTime -Descending
if ($updateLauncherLogs.Count -gt 0) {
    Write-Host "✅ Update-Launcher-Logs gefunden: $($updateLauncherLogs.Count) Dateien"
    Write-Host "📄 Neueste Log-Datei: $($updateLauncherLogs[0].FullName)"
    
    # Zeige Inhalt der neuesten Log-Datei
    Write-Host "Log-Inhalt:"
    Get-Content $updateLauncherLogs[0].FullName | ForEach-Object { Write-Host "   $_" }
} else {
    Write-Host "ℹ️ Keine Update-Launcher-Logs gefunden. Der Update-Launcher wurde möglicherweise noch nicht ausgeführt."
}

# Prüfe auf IPC-Dateien
$ipcFiles = Get-ChildItem -Path $env:TEMP -Filter "rawalite-update-*.json" | Sort-Object LastWriteTime -Descending
if ($ipcFiles.Count -gt 0) {
    Write-Host "✅ Update IPC-Dateien gefunden: $($ipcFiles.Count) Dateien"
    Write-Host "📄 Neueste IPC-Datei: $($ipcFiles[0].FullName)"
    
    # Zeige Inhalt der neuesten IPC-Datei
    Write-Host "IPC-Inhalt:"
    Get-Content $ipcFiles[0].FullName | ForEach-Object { Write-Host "   $_" }
} else {
    Write-Host "ℹ️ Keine Update IPC-Dateien gefunden. Es wurde möglicherweise noch kein Update gestartet."
}

Write-Host ""
Write-Host "Überprüfung abgeschlossen."