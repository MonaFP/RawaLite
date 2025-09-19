#!/usr/bin/env node
/**
 * 🔍 Build Freshness Validator
 * 
 * Prüft ob dist-electron Dateien älter als package.json sind
 * Verhindert Build-Cache-Probleme wie das v1.8.29 → v1.8.30 Issue
 * 
 * Usage:
 *   node scripts/validate-build-freshness.mjs
 *   pnpm guard:build:freshness
 */

import { statSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');
const packageJsonPath = join(projectRoot, 'package.json');
const distElectronDir = join(projectRoot, 'dist-electron');
const mainCjsPath = join(distElectronDir, 'main.cjs');
const preloadJsPath = join(distElectronDir, 'preload.js');

console.log('🔍 Build Freshness Validator - Checking for stale build artifacts...\n');

/**
 * Get file modification time safely
 */
function getFileTime(filePath) {
  try {
    return statSync(filePath).mtime;
  } catch (error) {
    return null;
  }
}

/**
 * Format time for display
 */
function formatTime(date) {
  if (!date) return 'NOT FOUND';
  return date.toLocaleString('de-DE', { 
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit'
  });
}

// Get modification times
const packageJsonTime = getFileTime(packageJsonPath);
const mainCjsTime = getFileTime(mainCjsPath);
const preloadJsTime = getFileTime(preloadJsPath);

console.log('📅 File Timestamps:');
console.log(`   package.json:     ${formatTime(packageJsonTime)}`);
console.log(`   main.cjs:         ${formatTime(mainCjsTime)}`);
console.log(`   preload.js:       ${formatTime(preloadJsTime)}\n`);

// Validation logic
let errors = 0;
let warnings = 0;

// Check if dist-electron directory exists
if (!existsSync(distElectronDir)) {
  console.log('⚠️  dist-electron/ directory not found');
  console.log('   → Run: pnpm build');
  warnings++;
} else {
  console.log('✅ dist-electron/ directory exists');
}

// Check if build files exist
if (!mainCjsTime) {
  console.log('❌ main.cjs not found');
  console.log('   → Run: pnpm build:main');
  errors++;
} else {
  console.log('✅ main.cjs exists');
}

if (!preloadJsTime) {
  console.log('❌ preload.js not found');
  console.log('   → Run: pnpm build:preload');
  errors++;
} else {
  console.log('✅ preload.js exists');
}

// Freshness validation (only if all files exist)
if (packageJsonTime && mainCjsTime && preloadJsTime) {
  console.log('\n🕐 Freshness Analysis:');
  
  const packageIsNewer = packageJsonTime > mainCjsTime || packageJsonTime > preloadJsTime;
  
  if (packageIsNewer) {
    console.log('⚠️  STALE BUILD DETECTED:');
    console.log('   package.json is newer than dist-electron/ files');
    console.log('   This could cause version-detection issues in production!');
    console.log('');
    console.log('🔧 Recommended fixes:');
    console.log('   • Clean build:    pnpm build:clean');
    console.log('   • Clean release:  pnpm dist:clean');
    console.log('   • Cache-free:     pnpm build:main:clean && pnpm build:preload:clean');
    warnings++;
  } else {
    console.log('✅ Build is fresh - dist-electron/ files are newer than package.json');
  }
}

console.log('\n📊 Summary:');
console.log(`   Errors: ${errors}`);
console.log(`   Warnings: ${warnings}\n`);

if (errors > 0) {
  console.log('❌ BUILD FRESHNESS CHECK FAILED');
  console.log('   Missing build artifacts detected.');
  process.exit(1);
} else if (warnings > 0) {
  console.log('⚠️  BUILD FRESHNESS WARNINGS');
  console.log('   Consider running clean build before release.');
  process.exit(0);
} else {
  console.log('✅ BUILD FRESHNESS CHECK PASSED');
  console.log('   All build artifacts are fresh and up-to-date.');
  process.exit(0);
}