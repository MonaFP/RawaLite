#!/usr/bin/env node
/**
 * validate-version-sync.mjs
 * 
 * Validiert dass package.json Version und VersionService Version synchron sind.
 * Teil der CI Guards gemäß COPILOT_INSTRUCTIONS.md
 */

import { readFileSync } from 'fs';
import { join } from 'path';

console.log('🔍 Version Sync Validator - Checking package.json vs VersionService...');

try {
  // package.json Version lesen
  const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));
  const packageVersion = packageJson.version;
  
  // VersionService.ts Version lesen
  const versionServicePath = join('src', 'services', 'VersionService.ts');
  const versionServiceContent = readFileSync(versionServicePath, 'utf8');
  
  // Version aus VersionService extrahieren (suche nach BASE_VERSION = packageJson.version)
  const versionMatch = versionServiceContent.match(/BASE_VERSION\s*=\s*packageJson\.version/);
  if (!versionMatch) {
    console.error('❌ Could not find BASE_VERSION = packageJson.version pattern in VersionService.ts');
    process.exit(1);
  }
  
  // Since VersionService uses packageJson.version directly, they are always synchronized
  console.log(`📦 package.json version: ${packageVersion}`);
  console.log(`🔧 VersionService version: ${packageVersion} (via packageJson.version)`);
  
  console.log('✅ Versions are synchronized (VersionService uses packageJson.version directly)!');
  process.exit(0);
  
} catch (error) {
  console.error('❌ Error validating version sync:', error.message);
  process.exit(1);
}