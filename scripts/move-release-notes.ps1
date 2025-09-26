# Skript zum Verschieben der Release Notes in den docs/releases Ordner
$ErrorActionPreference = "Continue"

# Zielordner definieren
$targetDir = "docs/releases"
if (-not (Test-Path $targetDir)) {
    Write-Host "Erstelle Ordner $targetDir..." -ForegroundColor Cyan
    New-Item -Path $targetDir -ItemType Directory -Force | Out-Null
}

# Alle Release Notes im Root-Verzeichnis identifizieren
$releaseNotes = Get-ChildItem -Path . -Filter "RELEASE_NOTES_*.md" -File

# Logfile für die Operation vorbereiten
$logFile = "release-notes-migration.log"
"# Release Notes Migration Log - $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")" | Out-File -FilePath $logFile
"" | Out-File -FilePath $logFile -Append
"## Verschobene Dateien" | Out-File -FilePath $logFile -Append
"" | Out-File -FilePath $logFile -Append

# Statistik-Variablen
$movedCount = 0
$skippedCount = 0
$errorCount = 0

# Informationen anzeigen
Write-Host "Beginne mit dem Verschieben von $($releaseNotes.Count) Release-Notes-Dateien..." -ForegroundColor Yellow
Write-Host ""

foreach ($file in $releaseNotes) {
    $targetPath = Join-Path -Path $targetDir -ChildPath $file.Name
    
    # Prüfen, ob die Datei bereits im Zielverzeichnis existiert
    if (Test-Path $targetPath) {
        Write-Host "⚠️ $($file.Name) existiert bereits im Zielordner und wird übersprungen" -ForegroundColor Yellow
        "- ⚠️ $($file.Name) - Übersprungen (existiert bereits)" | Out-File -FilePath $logFile -Append
        $skippedCount++
        continue
    }
    
    try {
        # Datei verschieben
        Move-Item -Path $file.FullName -Destination $targetPath -ErrorAction Stop
        
        if (Test-Path $targetPath) {
            Write-Host "✅ $($file.Name) erfolgreich verschoben" -ForegroundColor Green
            "- ✅ $($file.Name) - Erfolgreich verschoben" | Out-File -FilePath $logFile -Append
            $movedCount++
        } else {
            Write-Host "❌ Fehler beim Verschieben von $($file.Name) - Datei nicht gefunden nach Move-Item" -ForegroundColor Red
            "- ❌ $($file.Name) - Fehler: Datei nicht gefunden nach Move-Item" | Out-File -FilePath $logFile -Append
            $errorCount++
        }
    } catch {
        Write-Host "❌ Fehler beim Verschieben von $($file.Name): $_" -ForegroundColor Red
        "- ❌ $($file.Name) - Fehler: $_" | Out-File -FilePath $logFile -Append
        $errorCount++
    }
}

# Zusammenfassung in Log und Konsole ausgeben
"" | Out-File -FilePath $logFile -Append
"## Zusammenfassung" | Out-File -FilePath $logFile -Append
"" | Out-File -FilePath $logFile -Append
"- Erfolgreich verschoben: $movedCount" | Out-File -FilePath $logFile -Append
"- Übersprungen: $skippedCount" | Out-File -FilePath $logFile -Append
"- Fehler: $errorCount" | Out-File -FilePath $logFile -Append

Write-Host ""
Write-Host "Operation abgeschlossen!" -ForegroundColor Cyan
Write-Host "- Erfolgreich verschoben: $movedCount" -ForegroundColor Green
Write-Host "- Übersprungen: $skippedCount" -ForegroundColor Yellow
Write-Host "- Fehler: $errorCount" -ForegroundColor Red
Write-Host ""
Write-Host "Log gespeichert unter: $logFile" -ForegroundColor Cyan
