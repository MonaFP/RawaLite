/**
 * RawaLite Update-Launcher
 * 
 * Eigenständiges Tool zum Starten des Installers nach App-Beendigung
 * Dieser Launcher wird von der Hauptanwendung gestartet, kurz bevor sie sich beendet.
 * Er wartet, bis der Hauptprozess beendet ist, und startet dann den Installer.
 */

import { spawn, execFile, exec } from 'child_process';
import { existsSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { tmpdir, userInfo } from 'os';
import { app } from 'electron';

// Definiere den userData-Pfad für die Logs
let USER_DATA_PATH: string;
try {
  // Versuche, den Electron app.getPath zu verwenden, falls verfügbar
  USER_DATA_PATH = app.getPath('userData');
} catch (e) {
  // Fallback für standalone Ausführung
  USER_DATA_PATH = join(
    process.env.APPDATA || 
    (process.platform === 'darwin' ? 
      join(userInfo().homedir, 'Library', 'Application Support') : 
      join(userInfo().homedir, '.config')), 
    'RawaLite'
  );
}

// Stelle sicher, dass der Log-Ordner existiert
try {
  mkdirSync(USER_DATA_PATH, { recursive: true });
} catch (e) {
  // Ignorieren, falls Ordner bereits existiert
}

// Logge in eine Datei im userData-Verzeichnis
const LOG_PATH = join(USER_DATA_PATH, `update-launcher-${Date.now()}.log`);

function log(message: string): void {
  const timestamp = new Date().toISOString();
  const entry = `[${timestamp}] ${message}\n`;
  console.log(entry.trim());
  
  try {
    writeFileSync(LOG_PATH, entry, { flag: 'a' });
  } catch (error) {
    console.error(`Fehler beim Schreiben des Logs: ${error}`);
  }
}

// Nehme Argumente aus dem Kommandozeilenaufruf
const args = process.argv.slice(2);
if (args.length < 2) {
  log('❌ Fehler: Parent-PID und Installer-Pfad müssen angegeben werden.');
  log(`Verwendung: update-launcher.js <parent-pid> <installer-pfad> [options]`);
  process.exit(1);
}

// Parse Argumente
const parentPid = parseInt(args[0], 10);
const installerPath = args[1];
const options = {
  waitDelay: 500,       // ms zwischen Prozess-Checks
  maxWaitTime: 30000,   // Maximale Wartezeit (30 Sekunden)
  silent: false,        // Wenn true, keine UI-Meldungen
  debug: true           // Debug-Modus für zusätzliche Logs
};

// Prüfe ob Elternprozess eine gültige PID hat
if (isNaN(parentPid) || parentPid <= 0) {
  log(`❌ Fehler: Ungültige Parent-PID: ${parentPid}`);
  process.exit(1);
}

// Prüfe ob Installer existiert
if (!existsSync(installerPath)) {
  log(`❌ Fehler: Installer nicht gefunden: ${installerPath}`);
  process.exit(1);
}

// Parse zusätzliche Optionen
for (let i = 2; i < args.length; i++) {
  const arg = args[i];
  if (arg === '--silent') options.silent = true;
  if (arg === '--debug') options.debug = true;
  if (arg.startsWith('--wait-delay=')) options.waitDelay = parseInt(arg.split('=')[1], 10);
  if (arg.startsWith('--max-wait=')) options.maxWaitTime = parseInt(arg.split('=')[1], 10) * 1000;
}

// Starte den Launcher
log('🚀 RawaLite Update-Launcher gestartet');
log(`📊 Konfiguration: ${JSON.stringify({
  installerPath,
  parentPid,
  options,
  logPath: LOG_PATH
})}`);



// Robuste Funktion zur Prüfung, ob ein Prozess noch läuft
function isProcessRunning(pid: number): Promise<boolean> {
  return new Promise(resolve => {
    try {
      // Universelle Methode mit process.kill
      try {
        process.kill(pid, 0); // Signal 0 sendet kein Signal, prüft nur Existenz
        if (options.debug) log(`🔍 Prozess ${pid} läuft (signal check)`);
        resolve(true);
      } catch (e) {
        if (options.debug) log(`🔍 Prozess ${pid} beendet (signal check)`);
        resolve(false);
      }
    } catch (e) {
      // Fallback für Windows: tasklist verwenden
      if (process.platform === 'win32') {
        execFile('tasklist', ['/FI', `PID eq ${pid}`, '/NH'], (error, stdout) => {
          if (error) {
            log(`⚠️ Fehler bei tasklist: ${error.message}`);
            resolve(false); // Bei Fehler annehmen, dass Prozess beendet ist
          } else {
            const isRunning = stdout.toLowerCase().includes(pid.toString());
            if (options.debug) log(`🔍 Prozess ${pid} läuft: ${isRunning} (tasklist)`);
            resolve(isRunning);
          }
        });
      } else {
        log(`⚠️ Allgemeiner Fehler bei Prozessprüfung: ${e}`);
        resolve(false); // Bei Fehler annehmen, dass Prozess beendet ist
      }
    }
  });
}

// Funktion zum Überwachen des Prozesses mit robustem Polling
async function monitorProcessUntilExit(pid: number): Promise<void> {
  log(`⏳ Überwache Prozess ${pid} bis zur Beendigung...`);
  
  const startTime = Date.now();
  let waitingTime = 0;
  
  // Polling-Loop mit definierten Intervallen
  while (true) {
    // Prüfe, ob der Prozess noch läuft
    const isRunning = await isProcessRunning(pid);
    
    // Wenn der Prozess nicht mehr läuft, brechen wir die Schleife ab
    if (!isRunning) {
      log(`✅ Prozess ${pid} wurde beendet`);
      break;
    }
    
    // Überprüfe Timeout
    waitingTime = Date.now() - startTime;
    if (waitingTime >= options.maxWaitTime) {
      log(`⚠️ Timeout nach ${waitingTime}ms. Fortfahren trotz laufendem Prozess.`);
      break;
    }
    
    // Log-Ausgabe für Status (alle 3 Sekunden)
    if (options.debug && waitingTime % 3000 < options.waitDelay) {
      log(`⏱️ Warte seit ${Math.round(waitingTime / 1000)}s auf Beendigung von Prozess ${pid}`);
    }
    
    // Warte für das definierte Intervall
    await new Promise(resolve => setTimeout(resolve, options.waitDelay));
  }
}

// Funktion zum Starten des Installers mit Fallback-Mechanismen
async function launchInstaller(): Promise<boolean> {
  log(`🚀 Starte Update-Installer: ${installerPath}`);
  
  try {
    // Standardmethode: Direkter Start mit exec (nicht spawn)
    return new Promise((resolve) => {
      exec(`"${installerPath}"`, (error, stdout, stderr) => {
        if (error) {
          log(`⚠️ Standard-Start fehlgeschlagen: ${error.message}`);
          log('🔄 Versuche Fallback mit PowerShell erhöhte Rechte...');
          
          // Fallback: PowerShell mit erhöhten Rechten
          const ps = spawn('powershell.exe', [
            '-NoProfile',
            '-ExecutionPolicy', 'Bypass',
            '-Command', `Start-Process -FilePath "${installerPath}" -Verb RunAs`
          ], {
            detached: true,
            stdio: 'ignore',
            windowsHide: !options.debug
          });
          
          ps.on('error', (psError) => {
            log(`❌ PowerShell-Fallback fehlgeschlagen: ${psError.message}`);
            resolve(false);
          });
          
          ps.unref();
          log('✅ Installer über PowerShell mit erhöhten Rechten gestartet');
          resolve(true);
        } else {
          log('✅ Installer erfolgreich direkt gestartet');
          resolve(true);
        }
      });
    });
  } catch (error) {
    log(`❌ Alle Startmethoden fehlgeschlagen: ${error}`);
    return false;
  }
}

// Hauptfunktion: Warte auf Prozessende und starte dann den Installer
async function waitAndLaunchInstaller(): Promise<void> {
  log('⏳ Warte auf Beendigung der RawaLite-Anwendung...');
  
  try {
    // Überwache den Hauptprozess bis er beendet ist
    await monitorProcessUntilExit(parentPid);
    
    // Warte kurz, damit alle Ressourcen freigegeben werden
    log(`✅ RawaLite-Anwendung beendet. Warte noch 1 Sekunde für Ressourcenfreigabe...`);
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Starte den Installer mit Fallback-Mechanismen
    const success = await launchInstaller();
    
    if (success) {
      // Erfolgreich
      log('✅ Update-Launcher hat seine Aufgabe erfüllt. Wird beendet.');
      setTimeout(() => process.exit(0), 1000);
    } else {
      log('❌ Installer konnte nicht gestartet werden.');
      process.exit(1);
    }
  } catch (error) {
    log(`❌ Unerwarteter Fehler im Update-Launcher: ${error}`);
    process.exit(1);
  }
}

// Starte den Hauptprozess
waitAndLaunchInstaller().catch(error => {
  log(`❌ Unerwarteter Fehler: ${error}`);
  process.exit(1);
});