/**
 * Test-Skript für den Update-Launcher
 * 
 * Dieses Skript erlaubt es, den Update-Launcher manuell zu testen,
 * ohne den kompletten Update-Prozess durchlaufen zu müssen.
 * 
 * Verwendung:
 *   node scripts/test-update-launcher.js <test-app-pfad>
 * 
 * Beispiele:
 *   - Mit Notepad testen:
 *     node scripts/test-update-launcher.js "C:\\Windows\\System32\\notepad.exe"
 * 
 *   - Mit einem vorhandenen Setup-Installer testen:
 *     node scripts/test-update-launcher.js "C:\\Path\\to\\RawaLite-Setup-1.8.76.exe"
 */

import { spawn } from 'child_process';
import { join, dirname } from 'path';
import { existsSync } from 'fs';
import { fileURLToPath } from 'url';

// Aktuelle PID als zu überwachende PID verwenden
const testPid = process.pid;

// Test-App-Pfad aus Kommandozeile oder Notepad als Standard
const testAppPath = process.argv[2] || "C:\\Windows\\System32\\notepad.exe";

// Pfade für ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const currentDir = __dirname;
const projectDir = join(currentDir, '..');
const updateLauncherPath = join(projectDir, 'scripts', 'update-launcher.ts');
const tsNodeBin = join(projectDir, 'node_modules', '.bin', 'ts-node');

// Prüfe Existenz der Dateien
if (!existsSync(updateLauncherPath)) {
  console.error(`❌ Update-Launcher nicht gefunden: ${updateLauncherPath}`);
  process.exit(1);
}

if (!existsSync(testAppPath)) {
  console.error(`❌ Test-App nicht gefunden: ${testAppPath}`);
  process.exit(1);
}

if (!existsSync(tsNodeBin)) {
  console.error(`❌ ts-node nicht gefunden. Bitte installieren mit: npm install -D ts-node`);
  process.exit(1);
}

console.log('📋 Update-Launcher Test');
console.log('=======================');
console.log(`🔹 Test-PID: ${testPid}`);
console.log(`🔹 Test-App: ${testAppPath}`);
console.log(`🔹 Launcher: ${updateLauncherPath}`);
console.log('');

// Starte den Update-Launcher für Tests
console.log('🚀 Starte Update-Launcher...');

// Verwende direkten Pfad zum node Executable
const launcher = spawn('node', [
  join(projectDir, 'node_modules', 'ts-node', 'dist', 'bin.js'), // direkter Pfad zu ts-node
  updateLauncherPath,     // Pfad zur TypeScript-Datei
  testPid.toString(),     // Diese Prozess-PID als zu überwachender Prozess
  testAppPath,            // Test-App als "Installer"
  '--debug',              // Debug-Modus aktivieren
  '--wait-delay=500',     // 500ms zwischen Prüfungen
  '--max-wait=15'         // Max. 15 Sekunden warten
], {
  detached: true,         // Vom Elternprozess abkoppeln
  stdio: 'ignore',
  windowsHide: false      // Fenster zeigen für Tests
});

launcher.unref();

console.log('✅ Update-Launcher gestartet');
console.log('');
console.log('⏰ Warte 3 Sekunden vor Beendigung dieses Test-Prozesses...');
console.log('   (Der Launcher sollte den Test-Prozess überwachen und nach dessen Beendigung die Test-App starten)');

// Warte 3 Sekunden und beende dann diesen Prozess
// Der Launcher sollte dann die Test-App starten
setTimeout(() => {
  console.log('👋 Test-Prozess beendet sich jetzt. Launcher sollte Test-App starten.');
  process.exit(0);
}, 3000);