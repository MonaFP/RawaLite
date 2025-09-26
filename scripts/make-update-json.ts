#!/usr/bin/env tsx
/**
 * 🚀 RawaLite Custom In-App Updater - Manifest Generator
 * 
 * Generiert update.json Manifest-Datei für Custom Update System
 * Ersetzt electron-updater's latest.yml mit SHA512-Hash Verifikation
 */

import { readFileSync, writeFileSync, existsSync, statSync } from 'fs';
import { createHash } from 'crypto';
import { join, basename } from 'path';

// === TYPE DEFINITIONS ===
interface UpdateFile {
  kind: 'nsis';
  arch: 'x64';
  name: string;
  size: number;
  sha512: string;  // Base64-encoded SHA512 hash
  url: string;
}

interface UpdateManifest {
  product: string;
  channel: string;
  version: string;
  releasedAt: string;
  notes?: string;
  files: UpdateFile[];
}

// === CONFIGURATION ===
const CONFIG = {
  product: 'RawaLite',
  channel: 'latest',
  githubRepo: 'MonaFP/RawaLite',
  distDir: join(process.cwd(), 'dist'),
  releaseDir: join(process.cwd(), 'release'),
  releaseNotesFile: 'RELEASE_NOTES.md'
};

// === UTILITIES ===
function calculateSHA512(filePath: string): string {
  const fileBuffer = readFileSync(filePath);
  const hash = createHash('sha512');
  hash.update(fileBuffer);
  return hash.digest('base64');
}

function getFileSize(filePath: string): number {
  return statSync(filePath).size;
}

function getCurrentVersion(): string {
  const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));
  return packageJson.version;
}

function getReleaseNotes(): string | undefined {
  if (existsSync(CONFIG.releaseNotesFile)) {
    return readFileSync(CONFIG.releaseNotesFile, 'utf8').trim();
  }
  return undefined;
}

function findNSISInstallerFile(): string {
  const version = getCurrentVersion();
  
  // Try different possible filename patterns
  const possibleNames = [
    `RawaLite Setup ${version}.exe`,        // Standard electron-builder pattern
    `RawaLite-Setup-${version}.exe`,        // Alternative pattern
    `RawaLite-${version}-setup.exe`         // Another alternative
  ];
  
  // Check in both dist and release directories
  const searchDirs = [CONFIG.distDir, CONFIG.releaseDir];
  
  for (const dir of searchDirs) {
    for (const fileName of possibleNames) {
      const filePath = join(dir, fileName);
      if (existsSync(filePath)) {
        console.log(`📁 Found installer: ${filePath}`);
        return filePath;
      }
    }
  }
  
  throw new Error(`NSIS Installer not found. Searched for: ${possibleNames.join(', ')} in ${searchDirs.join(', ')}`);
}

// === MAIN GENERATOR ===
function generateUpdateManifest(): UpdateManifest {
  const version = getCurrentVersion();
  const nsisFilePath = findNSISInstallerFile();
  const fileName = basename(nsisFilePath);
  
  console.log(`📦 Generating manifest for version: ${version}`);
  console.log(`🎯 NSIS file: ${fileName}`);
  
  // Calculate file properties
  const fileSize = getFileSize(nsisFilePath);
  const sha512Hash = calculateSHA512(nsisFilePath);
  
  console.log(`� File size: ${Math.round(fileSize / 1024 / 1024 * 100) / 100} MB`);
  console.log(`🔐 SHA512: ${sha512Hash.substring(0, 32)}...`);
  
  // Create UpdateFile entry
  const updateFile: UpdateFile = {
    kind: 'nsis',
    arch: 'x64',
    name: fileName,
    size: fileSize,
    sha512: sha512Hash,
    url: `https://github.com/${CONFIG.githubRepo}/releases/download/v${version}/${encodeURIComponent(fileName)}`
  };
  
  // Create complete manifest
  const manifest: UpdateManifest = {
    product: CONFIG.product,
    channel: CONFIG.channel,
    version: version,
    releasedAt: new Date().toISOString(),
    notes: getReleaseNotes(),
    files: [updateFile]
  };
  
  return manifest;
}

// === MAIN EXECUTION ===
function main() {
  try {
    console.log('🚀 RawaLite Custom Update Manifest Generator');
    console.log('============================================');
    
    const manifest = generateUpdateManifest();
    
    // Write manifest to multiple locations for deployment
    const outputPaths = [
      join(CONFIG.distDir, 'update.json'),      // For dist directory
      join(CONFIG.releaseDir, 'update.json'),   // For release directory
      join(process.cwd(), 'update.json')        // For development testing
    ];
    
    outputPaths.forEach(outputPath => {
      try {
        writeFileSync(outputPath, JSON.stringify(manifest, null, 2), 'utf8');
        console.log(`✅ Manifest written to: ${outputPath}`);
      } catch (error) {
        console.warn(`⚠️ Could not write to ${outputPath}: ${error}`);
      }
    });
    
    console.log('\n📋 Generated manifest:');
    console.log(JSON.stringify(manifest, null, 2));
    
    console.log('\n🎉 Manifest generation completed!');
    console.log('📤 Ready for GitHub release upload');
    
  } catch (error) {
    console.error('❌ Error generating manifest:');
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

export { generateUpdateManifest, CONFIG };