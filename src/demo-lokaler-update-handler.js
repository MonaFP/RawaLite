// demo-lokaler-update-handler.js
// Beispiel für die direkte Verwendung des Custom Update Handlers in RawaLite

/**
 * Diese Funktion demonstriert, wie man den updater:install-custom Handler
 * in der RawaLite-Anwendung direkt verwenden kann.
 */
async function installLokaleMitCustomHandler() {
  try {
    // 1. Prüfen ob eine Setup-Datei im aktuellen Verzeichnis existiert
    const fs = window.require('fs');
    const path = window.require('path');
    const { execPath, cwd } = window.require('process');
    
    const appPath = path.dirname(execPath);
    const currentDir = cwd();
    
    console.log('Suche nach Setup-Dateien...');
    console.log('App-Pfad:', appPath);
    console.log('Aktuelles Verzeichnis:', currentDir);
    
    // Mögliche Orte für Setup-Dateien
    const suchPfade = [
      currentDir,
      path.join(currentDir, 'release'),
      appPath,
      path.join(appPath, '..'),
    ];
    
    let setupDatei = null;
    
    // Suche nach der neuesten Setup-Datei
    for (const pfad of suchPfade) {
      try {
        const dateien = fs.readdirSync(pfad)
          .filter(datei => datei.startsWith('rawalite-Setup-') && datei.endsWith('.exe'))
          .map(datei => ({ 
            name: datei, 
            pfad: path.join(pfad, datei),
            zeit: fs.statSync(path.join(pfad, datei)).mtime.getTime()
          }));
        
        if (dateien.length > 0) {
          // Sortiere nach Änderungsdatum (neueste zuerst)
          dateien.sort((a, b) => b.zeit - a.zeit);
          setupDatei = dateien[0];
          console.log(`Setup-Datei gefunden: ${setupDatei.name}`);
          break;
        }
      } catch (err) {
        console.warn(`Fehler beim Durchsuchen von ${pfad}:`, err);
      }
    }
    
    if (!setupDatei) {
      throw new Error('Keine Setup-Datei gefunden');
    }
    
    // 2. Bestätigung vom Benutzer einholen
    const { dialog } = window.require('@electron/remote');
    const antwort = await dialog.showMessageBox({
      type: 'question',
      title: 'Update installieren',
      message: 'Lokales Update installieren',
      detail: `Möchten Sie die folgende Setup-Datei installieren?\n\n${setupDatei.name}\n\nDie Anwendung wird nach dem Start des Installers beendet.`,
      buttons: ['Installieren', 'Abbrechen'],
      defaultId: 0,
      cancelId: 1
    });
    
    if (antwort.response === 1) {
      console.log('Installation vom Benutzer abgebrochen');
      return;
    }
    
    // 3. Custom Update Handler verwenden
    console.log('Starte Installation über Custom Update Handler...');
    const { ipcRenderer } = window.require('electron');
    
    const ergebnis = await ipcRenderer.invoke('updater:install-custom', {
      filePath: setupDatei.pfad,
      args: ['/NCRC'],  // Optional: NSIS-Parameter
      elevate: true,    // Mit UAC-Elevation starten
      unblock: true,    // MOTW entfernen
      quitDelayMs: 7000 // Verzögerung vor App-Beendigung
    });
    
    console.log('Ergebnis des Update-Handlers:', ergebnis);
    
    if (ergebnis.ok) {
      // Erfolg - Die App wird automatisch beendet
      console.log('Installer erfolgreich gestartet. App wird in Kürze beendet...');
      
      // Optional: Feedback-Dialog anzeigen
      await dialog.showMessageBox({
        type: 'info',
        title: 'Update gestartet',
        message: 'Update-Installation läuft',
        detail: 'Der Installer wurde erfolgreich gestartet. Die Anwendung wird in Kürze beendet.',
        buttons: ['OK']
      });
      
    } else {
      // Fehler beim Starten des Installers
      throw new Error(`Installer konnte nicht gestartet werden: ${ergebnis.error}`);
    }
    
  } catch (fehler) {
    console.error('Fehler bei der Installation:', fehler);
    
    // Fehlermeldung anzeigen
    const { dialog } = window.require('@electron/remote');
    await dialog.showMessageBox({
      type: 'error',
      title: 'Installationsfehler',
      message: 'Fehler bei der Installation',
      detail: `Es ist ein Fehler aufgetreten:\n\n${fehler.message || String(fehler)}`,
      buttons: ['OK']
    });
  }
}

// Beispiel für die Verwendung in einer React-Komponente
/*
import React from 'react';

const UpdateButton = () => {
  const handleUpdateClick = async () => {
    await installLokaleMitCustomHandler();
  };
  
  return (
    <button 
      onClick={handleUpdateClick} 
      className="update-button"
    >
      Lokales Update installieren
    </button>
  );
};

export default UpdateButton;
*/