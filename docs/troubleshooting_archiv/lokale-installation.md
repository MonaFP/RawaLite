# Lokale Installation von RawaLite

Diese Anleitung beschreibt, wie Sie die aktuelle Version von RawaLite lokal installieren können.

## Methode 1: Installation mit dem PowerShell-Skript

Das mitgelieferte PowerShell-Skript automatisiert den Installations-Prozess.

### Schnellstart

1. Doppelklicken Sie auf `install-local.cmd` im Hauptverzeichnis.
2. Bestätigen Sie die UAC-Anfrage (Administrator-Berechtigungen).
3. Folgen Sie den Anweisungen im PowerShell-Fenster.

### Erweiterte Verwendung des PowerShell-Skripts

Sie können das PowerShell-Skript auch direkt mit verschiedenen Optionen aufrufen:

```powershell
# Standard-Installation
.\scripts\install-local-update.ps1

# Zuerst Build durchführen, dann installieren
.\scripts\install-local-update.ps1 -BuildFirst

# Clean Build durchführen und dann installieren
.\scripts\install-local-update.ps1 -BuildFirst -CleanBuild

# Debug-Informationen anzeigen (inkl. SHA256-Hash)
.\scripts\install-local-update.ps1 -Debug
```

## Methode 2: Manuelle Installation

Sie können die Installation auch manuell durchführen:

1. Führen Sie `pnpm dist` aus, um die Setup-Datei zu erstellen.
2. Die Setup-Datei finden Sie im Verzeichnis `release`.
3. Führen Sie die Setup-Datei mit Administrator-Rechten aus.

## Methode 3: Verwendung des Custom Update Handlers in der Anwendung

Der Custom Update Handler kann auch direkt in der RawaLite-Anwendung verwendet werden. Ein Beispiel finden Sie in der Datei `src/demo-lokaler-update-handler.js`.

### Beispiel-Code

```javascript
// Custom Update Handler verwenden
const { ipcRenderer } = window.require('electron');
    
const ergebnis = await ipcRenderer.invoke('updater:install-custom', {
  filePath: 'C:\\Pfad\\zur\\rawalite-Setup-1.8.92.exe',
  args: ['/NCRC'],  // Optional: NSIS-Parameter
  elevate: true,    // Mit UAC-Elevation starten
  unblock: true,    // MOTW entfernen
  quitDelayMs: 7000 // Verzögerung vor App-Beendigung
});

if (ergebnis.ok) {
  console.log('Installer erfolgreich gestartet. App wird in Kürze beendet...');
} else {
  console.error(`Fehler: ${ergebnis.error}`);
}
```

## Fehlersuche

### Keine Setup-Datei gefunden

- Führen Sie `pnpm dist` aus, um die Setup-Datei zu erstellen.
- Prüfen Sie, ob die Setup-Datei im Verzeichnis `release` erstellt wurde.

### Installer startet nicht

- Stellen Sie sicher, dass Sie Administrator-Rechte haben.
- Überprüfen Sie die Log-Datei `local-install-log.txt` für Details.
- Prüfen Sie, ob die Datei vom Antivirenprogramm blockiert wird.

### Installation schlägt fehl

- Schließen Sie alle laufenden Instanzen von RawaLite.
- Prüfen Sie, ob die Installation fehlende Abhängigkeiten meldet.
- Verwenden Sie die Debug-Option: `.\scripts\install-local-update.ps1 -Debug`