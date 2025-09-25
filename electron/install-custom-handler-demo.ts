// install-custom-handler-demo.ts
// Beispiel für die Integration des vereinfachten Handlers in die Hauptanwendung

import { app, BrowserWindow } from "electron";
import { registerInstallCustomHandler } from "./install-custom-handler";
import * as path from "path";
import * as fs from "fs";

// Logger-Instanz (Mock)
const log = {
  info: (msg: string, ...args: any[]) => console.log(`[INFO] ${msg}`, ...args),
  warn: (msg: string, ...args: any[]) => console.warn(`[WARN] ${msg}`, ...args),
  error: (msg: string, ...args: any[]) => console.error(`[ERROR] ${msg}`, ...args)
};

// Global-Objekt für TypeScript-Kompatibilität
declare global {
  namespace NodeJS {
    interface Global {
      __rawaliteUpdateInProgress?: boolean;
      [key: string]: any;
    }
  }
}

// Beispiel-Integration
async function main() {
  await app.whenReady();
  
  // Handler registrieren
  registerInstallCustomHandler();
  
  // UI erstellen für Tests
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true
    }
  });
  
  // Beispielcode laden
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>RawaLite Update Test</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        button { padding: 10px 20px; margin: 10px 0; }
        #status { margin-top: 20px; padding: 10px; background: #f0f0f0; }
      </style>
    </head>
    <body>
      <h1>RawaLite Update-Test</h1>
      <p>Klicken Sie auf die Schaltfläche, um den Installer zu starten.</p>
      <button id="install">Installer starten</button>
      <div id="status">Status: Bereit</div>
      
      <script>
        document.getElementById('install').addEventListener('click', async () => {
          const status = document.getElementById('status');
          status.innerText = 'Status: Installer wird gestartet...';
          status.style.background = '#ffffcc';
          
          // IPC-Anfrage zum Starten des Installers
          try {
            const result = await window.electronAPI.installCustomUpdate({
              filePath: 'C:\\Path\\To\\Your\\Installer.exe',
              args: ['/S'],
              elevate: true
            });
            
            if (result.ok) {
              status.innerText = 'Status: Installer erfolgreich gestartet! App wird beendet...';
              status.style.background = '#ccffcc';
            } else {
              status.innerText = 'Status: Fehler: ' + result.error;
              status.style.background = '#ffcccc';
            }
          } catch (err) {
            status.innerText = 'Status: Fehler: ' + err.message;
            status.style.background = '#ffcccc';
          }
        });
        
        // Status-Updates vom Hauptprozess empfangen
        window.electronAPI.onUpdaterStatus((status) => {
          const statusElement = document.getElementById('status');
          statusElement.innerText = 'Status: ' + status.message;
          
          if (status.status === 'error') {
            statusElement.style.background = '#ffcccc';
          } else if (status.status === 'install-started') {
            statusElement.style.background = '#ccffcc';
          } else {
            statusElement.style.background = '#ffffcc';
          }
        });
      </script>
    </body>
    </html>
  `;
  
  // HTML-Datei temporär erstellen
  const tempHtmlPath = path.join(app.getPath('temp'), 'rawalite-update-test.html');
  fs.writeFileSync(tempHtmlPath, htmlContent);
  
  // Lade die HTML-Datei
  mainWindow.loadFile(tempHtmlPath);
  
  // Preload-Skript für IPC-Kommunikation
  // (normalerweise in preload.js, hier als Beispiel)
  /*
  // preload.js
  const { contextBridge, ipcRenderer } = require('electron');
  
  contextBridge.exposeInMainWorld('electronAPI', {
    installCustomUpdate: (options) => ipcRenderer.invoke('updater:install-custom', options),
    onUpdaterStatus: (callback) => ipcRenderer.on('updater:status', (event, status) => callback(status))
  });
  */
  
  // Beim Beenden aufräumen
  app.on('will-quit', () => {
    try {
      if (fs.existsSync(tempHtmlPath)) {
        fs.unlinkSync(tempHtmlPath);
      }
    } catch {}
  });
}

main().catch(console.error);