#!/usr/bin/env node
/**
 * 🛡️ Release Asset Guard
 * 
 * Validiert dass alle kritischen Assets für electron-updater vorhanden sind:
 * - latest.yml
 * - .exe file
 * - .blockmap file  
 * 
 * HINWEIS: ZIP wurde aus der Build-Pipeline entfernt (electron-builder.yml optimiert)
 *          für schnellere Uploads und kleinere Release-Größen.
 *
 * Usage:
 *   node guard-release-assets.mjs
 *   pnpm guard:release:assets
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, '..');
const distDir = path.join(projectRoot, 'release');

console.log('🛡️ Release Asset Guard - Validating electron-updater assets...\n');

// Check if dist directory exists
if (!fs.existsSync(distDir)) {
  console.error('❌ release/ directory not found. Run `pnpm build && pnpm dist` first.');
  process.exit(1);
}

const files = fs.readdirSync(distDir);
console.log('📁 Found files in release/:', files.length > 0 ? files.join(', ') : 'none');

// Critical asset checks
const checks = [
  {
    name: 'latest.yml',
    pattern: /^latest\.yml$/,
    required: true,
    description: 'Auto-updater metadata file'
  },
  {
    name: '.exe installer',
    pattern: /.*\.exe$/,
    required: true,
    description: 'Windows installer executable'
  },
  {
    name: '.blockmap',
    pattern: /.*\.exe\.blockmap$/,
    required: true,
    description: 'Blockmap for differential updates'
  },
  {
    name: '.zip package',
    pattern: /.*\.zip$/,
    required: false,
    description: 'Portable Windows package (entfernt für optimierte Uploads)'
  }
];

let allPassed = true;
let criticalFailed = false;

console.log('\n🔍 Asset validation:\n');

for (const check of checks) {
  const found = files.find(f => check.pattern.test(f));
  
  if (found) {
    console.log(`✅ ${check.name}: ${found}`);
    
    // Additional validation for latest.yml
    if (check.name === 'latest.yml') {
      try {
        const latestPath = path.join(distDir, found);
        const content = fs.readFileSync(latestPath, 'utf-8');
        
        // Check if latest.yml contains required fields
        if (!content.includes('version:') || !content.includes('files:')) {
          console.log(`   ⚠️  Warning: latest.yml may be malformed`);
        } else {
          console.log(`   ✅ latest.yml contains required metadata`);
        }
      } catch (err) {
        console.log(`   ⚠️  Warning: Could not validate latest.yml content: ${err.message}`);
      }
    }
  } else {
    if (check.required) {
      console.log(`❌ ${check.name}: MISSING (${check.description})`);
      criticalFailed = true;
    } else {
      console.log(`⚠️  ${check.name}: missing (${check.description}) - optional`);
    }
    allPassed = false;
  }
}

console.log('\n📊 Summary:');

if (criticalFailed) {
  console.log('❌ CRITICAL ASSETS MISSING');
  console.log('   Release cannot proceed without required assets.');
  console.log('   Run: pnpm build && pnpm dist');
  process.exit(1);
} else if (!allPassed) {
  console.log('⚠️  Some optional assets missing, but release can proceed');
  console.log('   Consider running: pnpm build && pnpm dist');
  process.exit(0);
} else {
  console.log('✅ All assets present and accounted for!');
  console.log('   Release is ready for deployment.');
  process.exit(0);
}
