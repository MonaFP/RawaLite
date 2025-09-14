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
  
  // Version aus VersionService extrahieren (suche nach VERSION = 'x.y.z')
  const versionMatch = versionServiceContent.match(/VERSION\s*=\s*['"`]([^'"`]+)['"`]/);
  if (!versionMatch) {
    console.error('❌ Could not find VERSION constant in VersionService.ts');
    process.exit(1);
  }
  
  const serviceVersion = versionMatch[1];
  
  console.log(`📦 package.json version: ${packageVersion}`);
  console.log(`🔧 VersionService version: ${serviceVersion}`);
  
  if (packageVersion === serviceVersion) {
    console.log('✅ Versions are synchronized!');
    process.exit(0);
  } else {
    console.error('❌ Version mismatch detected!');
    console.error(`   package.json: ${packageVersion}`);
    console.error(`   VersionService: ${serviceVersion}`);
    console.error('');
    console.error('💡 Fix: Update VersionService.ts VERSION constant to match package.json');
    process.exit(1);
  }
  
} catch (error) {
  console.error('❌ Error validating version sync:', error.message);
  process.exit(1);
}