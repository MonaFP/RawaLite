# Update-Launcher Test Anleitung

## Voraussetzungen

1. RawaLite v1.8.85 ist installiert und läuft
2. Das Update-System wurde mit dem neuen Update-Launcher verbessert
3. Update-Launcher befindet sich in der App unter `resources/resources/update-launcher.js`

## Test-Schritte

1. **Prüfen ob Update-Launcher vorhanden ist:**
   ```powershell
   $appPath = "C:\Program Files\rawalite\rawalite.exe"
   $launcherPath = Join-Path (Split-Path $appPath) "resources\resources\update-launcher.js"
   if (Test-Path $launcherPath) {
     Write-Host "✅ Update launcher found: $launcherPath"
   } else {
     Write-Host "❌ Update launcher NOT found at: $launcherPath"
   }
   ```

2. **Update manuell simulieren:**
   - Installiere eine ältere Version von RawaLite (z.B. v1.8.84) 
   - Öffne die App
   - Gehe zu "Einstellungen" > "Nach Updates suchen"
   - Wenn ein Update verfügbar ist, wähle "Update installieren"
   - Die App sollte sich beenden und der Installer sollte automatisch starten

3. **Debug-Logs überprüfen:**
   - Nach dem Update-Versuch, überprüfe die temporären Dateien:
   ```powershell
   Get-ChildItem -Path $env:TEMP -Filter "rawalite-update-launcher-*.log" | Sort-Object LastWriteTime -Descending | Select-Object -First 1 | Get-Content
   ```
   - Suche nach Einträgen wie "✅ RawaLite-Anwendung beendet", "🚀 Starte Update-Installer"

## Erwartetes Verhalten

1. Die App sollte nach dem Klicken auf "Update installieren" einen Status anzeigen und sich beenden
2. Der Update-Launcher-Prozess sollte im Hintergrund weiterlaufen
3. Der Launcher wartet, bis der Hauptprozess beendet ist
4. Der Installer sollte automatisch starten, sobald die App beendet ist
5. In den Logs sollte der erfolgreiche Start des Installers dokumentiert sein

## Fehlerbehandlung

Falls der Installer nicht automatisch startet:
1. Überprüfe die Logs (siehe oben)
2. Stelle sicher, dass die App-Version 1.8.85 oder höher ist
3. Überprüfe, ob der Update-Launcher korrekt im resources-Verzeichnis liegt
4. Prüfe, ob PowerShell-Berechtigungen für das Starten des Installers ausreichen

## Manuelle Installation

Falls der automatische Start des Installers nicht funktioniert:
1. Gehe zu https://github.com/MonaFP/RawaLite/releases/tag/v1.8.85
2. Lade rawalite-Setup-1.8.85.exe herunter
3. Führe die Installationsdatei manuell aus