# Update-Launcher Test Anleitung

## Voraussetzungen

1. RawaLite v1.8.91 oder höher ist installiert und läuft
2. Das Update-System wurde mit dem neuen Update-Launcher verbessert
3. Update-Launcher befindet sich in der App unter `resources/update-launcher.js`

## Test-Schritte

1. **Prüfen ob Update-Launcher vorhanden ist:**
   ```powershell
   $appPath = "C:\Program Files\rawalite\rawalite.exe"
   $resourcesDir = Join-Path (Split-Path $appPath) "resources"
   $launcherPath = Join-Path $resourcesDir "update-launcher.js"
   
   # Primärer Pfad prüfen
   if (Test-Path $launcherPath) {
     Write-Host "✅ Update launcher found: $launcherPath"
   } else {
     # Fallback-Pfade prüfen
     $fallbackPath1 = Join-Path $resourcesDir "resources\update-launcher.js" # Legacy-Pfad
     $fallbackPath2 = Join-Path (Split-Path $resourcesDir) "app.asar\resources\update-launcher.js" # ASAR-Pfad
     
     if (Test-Path $fallbackPath1) {
       Write-Host "⚠️ Update launcher found at legacy path: $fallbackPath1"
     } elseif (Test-Path $fallbackPath2) {
       Write-Host "⚠️ Update launcher found at ASAR path: $fallbackPath2"
     } else {
       Write-Host "❌ Update launcher NOT found at any expected path!"
     }
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
2. Stelle sicher, dass die App-Version 1.8.91 oder höher ist
3. Überprüfe, ob der Update-Launcher korrekt im resources-Verzeichnis liegt
4. Prüfe, ob PowerShell-Berechtigungen für das Starten des Installers ausreichen

## Robuste Launcher-Pfad-Prüfung (v1.8.91+)

Ab Version 1.8.91 ist eine verbesserte Launcher-Pfad-Suche implementiert:

```javascript
// Definiere mögliche Pfade zum Update-Launcher (in Prioritätsreihenfolge)
const possibleLauncherPaths = [
  updateLauncherPath,                                     // Primärer Pfad (resources/update-launcher.js)
  path.join(appDir, 'resources', 'resources', 'update-launcher.js'), // Legacy-Fallback (verschachtelt)
  path.join(app.getAppPath(), 'resources', 'update-launcher.js')  // ASAR-Fallback
];
  
// Suche nach dem Update-Launcher in allen möglichen Pfaden
let actualLauncherPath = null;
for (const launcherPath of possibleLauncherPaths) {
  if (fs.existsSync(launcherPath)) {
    actualLauncherPath = launcherPath;
    break;
  }
}
```

## Manuelle Installation

Falls der automatische Start des Installers nicht funktioniert:
1. Gehe zu https://github.com/MonaFP/RawaLite/releases/latest
2. Lade die neueste rawalite-Setup-[Version].exe herunter
3. Führe die Installationsdatei manuell aus