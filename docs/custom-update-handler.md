# RawaLite Custom Update Handler

Dieser Clean-Code Updater Handler implementiert eine vereinfachte und robuste Methode zur Installation von Updates in der RawaLite-Anwendung. Die Implementierung nutzt den ShellExecute-Ansatz für maximale Kompatibilität und Zuverlässigkeit.

## Übersicht

Der Custom Update Handler bietet folgende Funktionalität:

- Installieren von Updates über Windows ShellExecute API
- UAC-Elevation für die Update-Installation
- Automatisches Entfernen des MOTW (Mark of the Web)
- Verifizierung der Installer-Datei (optional)
- Ordnungsgemäße Beendigung der Anwendung nach Start des Installers

## Integration

### 1. Handler in der Hauptanwendung registrieren

Importieren und registrieren Sie den Handler in `electron/main.ts`:

```typescript
import { registerInstallCustomHandler } from './install-custom-handler';

// Bei App-Start
app.whenReady().then(() => {
  // Handler registrieren
  registerInstallCustomHandler();
  
  // Rest der Anwendungsinitialisierung...
});
```

### 2. IPC-Kommunikation in Preload-Skript

Fügen Sie die IPC-Kommunikation in Ihrem Preload-Skript hinzu:

```typescript
// In electron/preload.ts
import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  // Update-Installer starten
  installCustomUpdate: (options) => {
    return ipcRenderer.invoke('updater:install-custom', options);
  },
  
  // Status-Updates empfangen
  onUpdaterStatus: (callback) => {
    const wrappedCallback = (_event, status) => callback(status);
    ipcRenderer.on('updater:status', wrappedCallback);
    return () => {
      ipcRenderer.removeListener('updater:status', wrappedCallback);
    };
  }
});
```

### 3. Verwendung in der React-UI

Beispiel für die Verwendung in einer React-Komponente:

```tsx
import React, { useState, useEffect } from 'react';

const UpdaterButton: React.FC = () => {
  const [status, setStatus] = useState('Bereit');
  const [isUpdating, setIsUpdating] = useState(false);
  
  useEffect(() => {
    // Status-Updates vom Hauptprozess empfangen
    const removeListener = window.electronAPI.onUpdaterStatus((status) => {
      setStatus(status.message);
      
      if (status.status === 'install-started') {
        setIsUpdating(false);
      }
    });
    
    // Cleanup
    return () => removeListener();
  }, []);
  
  const handleUpdate = async () => {
    setIsUpdating(true);
    setStatus('Installer wird gestartet...');
    
    try {
      const result = await window.electronAPI.installCustomUpdate({
        filePath: 'C:\\Path\\To\\Your\\Installer.exe',
        args: ['/S'],
        elevate: true
      });
      
      if (result.ok) {
        setStatus('Installer erfolgreich gestartet! App wird beendet...');
      } else {
        setStatus(`Fehler: ${result.error}`);
        setIsUpdating(false);
      }
    } catch (err) {
      setStatus(`Fehler: ${err.message}`);
      setIsUpdating(false);
    }
  };
  
  return (
    <div>
      <button 
        onClick={handleUpdate} 
        disabled={isUpdating}
      >
        Update installieren
      </button>
      <div>{status}</div>
    </div>
  );
};

export default UpdaterButton;
```

## API-Referenz

### Handler-Parameter (InstallCustomOptions)

| Parameter | Typ | Standardwert | Beschreibung |
|-----------|-----|--------------|-------------|
| filePath | string | (erforderlich) | Absoluter Pfad zur Installer-Datei |
| args | string[] | [] | Kommandozeilenargumente für den Installer |
| expectedSha256 | string | undefined | Erwarteter SHA256-Hash zur Verifizierung (optional) |
| elevate | boolean | true | UAC-Elevation für den Installer verwenden |
| unblock | boolean | true | MOTW (Mark of the Web) entfernen |
| quitDelayMs | number | 7000 | Verzögerung in ms vor App-Beendigung |

### Rückgabewerte (InstallCustomResult)

| Feld | Typ | Beschreibung |
|------|-----|-------------|
| ok | boolean | Gibt an, ob der Installer erfolgreich gestartet wurde |
| error | string | Fehlermeldung bei Misserfolg |
| installerStarted | boolean | Gibt an, ob der Installer tatsächlich gestartet wurde |
| pid | number | Prozess-ID des gestarteten Installers (wenn verfügbar) |
| filePath | string | Pfad zur Installer-Datei |
| args | string[] | Verwendete Kommandozeilenargumente |
| runId | string | Eindeutige ID für diesen Update-Vorgang |
| alreadyInProgress | boolean | Gibt an, ob bereits ein Update-Prozess läuft |

## Testen

Das Repository enthält ein PowerShell-Skript zum Testen des Update-Handlers:

```powershell
# Skript ausführen (simuliert nur)
.\scripts\test-update-handler.ps1 -InstallerPath "C:\Path\To\RawaLite-Setup.exe"

# Mit verschiedenen Optionen
.\scripts\test-update-handler.ps1 -InstallerPath "C:\Path\To\RawaLite-Setup.exe" -Elevate:$false -QuitDelayMs 10000
```

## Wichtige Hinweise

1. **Installer-Dateipfad**: Verwenden Sie immer absolute Pfade für den Installer.
2. **UAC-Elevation**: Die Standardeinstellung für `elevate` ist `true`, was UAC-Elevation anfordert.
3. **MOTW**: Die Standardeinstellung für `unblock` ist `true`, was den MOTW entfernt (wichtig für heruntergeladene Dateien).
4. **Beendigung**: Die App wird nach dem Start des Installers automatisch beendet (mit Verzögerung `quitDelayMs`).
5. **Prozess-ID**: Die zurückgegebene `pid` kann je nach Implementierungsdetails `null` sein, da ShellExecute asynchron arbeitet.