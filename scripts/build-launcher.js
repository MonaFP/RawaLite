/**
 * Build-Skript für den Update-Launcher
 */

import * as esbuild from 'esbuild';
import * as path from 'path';
import * as fs from 'fs';
import { fileURLToPath } from 'url';

// ESM-Workaround für __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Input und Output Pfade
const inputFile = path.join(__dirname, 'update-launcher.ts');
const outputFile = path.join(__dirname, '..', 'resources', 'update-launcher.js');

// Stelle sicher, dass das Ausgabeverzeichnis existiert
const outputDir = path.dirname(outputFile);
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Build-Konfiguration
const buildOptions = {
  entryPoints: [inputFile],
  bundle: true,
  platform: 'node',
  target: 'node16',  // Target-Version: Node.js 16
  outfile: outputFile,
  minify: true,      // Minifizieren für kleinere Dateigröße
  sourcemap: false,  // Keine Source-Maps im Production-Build
};

// Führe den Build aus
async function runBuild() {
  try {
    console.log(`Building Update-Launcher from ${inputFile} to ${outputFile}...`);
    await esbuild.build(buildOptions);
    console.log(`✅ Update-Launcher build completed`);
    
    // Zeige Dateigröße
    const stats = fs.statSync(outputFile);
    const fileSizeInKB = Math.round(stats.size / 1024 * 100) / 100;
    console.log(`📊 Output file size: ${fileSizeInKB} KB`);
    
  } catch (error) {
    console.error('❌ Build failed:', error);
    process.exit(1);
  }
}

// Führe den Build aus
runBuild();