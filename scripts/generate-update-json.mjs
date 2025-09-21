#!/usr/bin/env node
/**
 * Generate update.json manifest for Custom In-App Updater
 * This creates a proper update manifest that the updater expects
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read package.json for current version
const packageJsonPath = path.join(__dirname, '..', 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
const version = packageJson.version;

// Generate update.json manifest
const updateManifest = {
  version: version,
  releaseDate: new Date().toISOString(),
  platforms: {
    win32: {
      url: `https://github.com/MonaFP/RawaLite/releases/download/v${version}/rawalite-Setup-${version}.exe`,
      sha512: null, // Will be calculated by electron-builder
      size: null    // Will be filled by electron-builder
    }
  },
  releaseNotes: `RawaLite v${version} - Custom In-App Update`,
  mandatory: false
};

// Write to dist folder
const distPath = path.join(__dirname, '..', 'dist');
if (!fs.existsSync(distPath)) {
  fs.mkdirSync(distPath, { recursive: true });
}

const updateJsonPath = path.join(distPath, 'update.json');
fs.writeFileSync(updateJsonPath, JSON.stringify(updateManifest, null, 2));

console.log(`✅ Generated update.json for v${version}`);
console.log(`📄 File: ${updateJsonPath}`);
console.log(`🔗 URL: ${updateManifest.platforms.win32.url}`);