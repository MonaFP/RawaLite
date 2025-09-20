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
  
  // Version aus VersionService extrahieren (suche nach getPackageJsonFallback mit package.json version)
  const fallbackMatch = versionServiceContent.match(/return\s*["']([0-9]+\.[0-9]+\.[0-9]+)["'];.*\/\/.*fallback/);
  if (!fallbackMatch) {
    console.error('❌ Could not find getPackageJsonFallback version pattern in VersionService.ts');
    process.exit(1);
  }
  
  const versionServiceVersion = fallbackMatch[1];
  
  // Vergleiche Versionen
  if (packageVersion !== versionServiceVersion) {
    console.error(`❌ Version mismatch!`);
    console.error(`📦 package.json: ${packageVersion}`);
    console.error(`🔧 VersionService fallback: ${versionServiceVersion}`);
    process.exit(1);
  }
  
  console.log(`📦 package.json version: ${packageVersion}`);
  console.log(`🔧 VersionService fallback: ${versionServiceVersion}`);
  
  console.log('✅ Versions are synchronized!');
  process.exit(0);
  
} catch (error) {
  console.error('❌ Error validating version sync:', error.message);
  process.exit(1);
}