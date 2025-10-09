#!/usr/bin/env node

/**
 * 🚨 CRITICAL ASSET VALIDATION SCRIPT
 * 
 * Prevents "Failed to parse URL from" errors by validating GitHub release assets
 * 
 * Usage:
 *   node scripts/validate-release-assets.mjs v1.0.37
 *   pnpm validate:assets v1.0.37
 */

import { execSync } from 'child_process';
import { readFileSync } from 'fs';

const VERSION = process.argv[2];
if (!VERSION) {
  console.error('❌ Usage: node validate-release-assets.mjs <version>');
  console.error('   Example: node validate-release-assets.mjs v1.0.37');
  process.exit(1);
}

console.log(`🔍 Validating release assets for ${VERSION}...`);

try {
  // Check if release exists
  const releaseOutput = execSync(`gh release view ${VERSION} --json assets,name,tagName`, { encoding: 'utf8' });
  const release = JSON.parse(releaseOutput);
  
  console.log(`📋 Release: ${release.name} (${release.tagName})`);
  
  // Validate assets array
  if (!release.assets || release.assets.length === 0) {
    console.error('');
    console.error('🚨 CRITICAL ERROR: No assets found in release!');
    console.error('');
    console.error('📋 This will cause "Failed to parse URL from" error in UpdateManager');
    console.error('');
    console.error('🔧 IMMEDIATE ACTION REQUIRED:');
    console.error('   1. Delete release: gh release delete ' + VERSION + ' --yes');
    console.error('   2. Build assets: pnpm clean && pnpm build && pnpm dist');
    console.error('   3. Recreate with assets: gh release create ' + VERSION + ' --generate-notes dist-release/RawaLite-Setup-*.exe');
    console.error('');
    process.exit(1);
  }
  
  console.log(`✅ Found ${release.assets.length} asset(s):`);
  
  // Validate each asset
  let hasExecutable = false;
  let hasBlockmap = false;
  
  for (const asset of release.assets) {
    console.log(`   📦 ${asset.name} (${formatBytes(asset.size)})`);
    
    // Check for executable
    if (asset.name.includes('.exe') && !asset.name.includes('.blockmap')) {
      hasExecutable = true;
      
      // Validate executable name pattern
      const versionNumber = VERSION.replace('v', '');
      const expectedPattern = new RegExp(`^RawaLite-Setup-${versionNumber.replace(/\./g, '\\.')}\.exe$`);
      
      if (!expectedPattern.test(asset.name)) {
        console.warn(`⚠️  Asset name doesn't match expected pattern: RawaLite-Setup-${versionNumber}.exe`);
      }
      
      // Validate executable size
      if (asset.size < 50000000) { // Less than 50MB
        console.error(`❌ Executable size too small: ${formatBytes(asset.size)} (expected >50MB)`);
        process.exit(1);
      }
      
      if (asset.size > 200000000) { // More than 200MB
        console.warn(`⚠️  Executable size unusually large: ${formatBytes(asset.size)}`);
      }
    }
    
    // Check for blockmap
    if (asset.name.includes('.blockmap')) {
      hasBlockmap = true;
    }
  }
  
  // Validate required assets
  if (!hasExecutable) {
    console.error('❌ No .exe file found in release assets!');
    console.error('   UpdateManager requires executable for installation');
    process.exit(1);
  }
  
  if (!hasBlockmap) {
    console.warn('⚠️  No .blockmap file found (recommended for update efficiency)');
  }
  
  // Test asset URLs
  console.log('🌐 Testing asset download URLs...');
  for (const asset of release.assets) {
    if (asset.browser_download_url) {
      console.log(`   ✅ ${asset.name}: ${asset.browser_download_url}`);
    } else if (asset.url) {
      console.log(`   ✅ ${asset.name}: ${asset.url}`);
    } else {
      console.error(`   ❌ ${asset.name}: No download URL!`);
      console.error('   🚨 This WILL cause "Failed to parse URL from" error in UpdateManager');
      console.error('   🔧 GitHub may still be processing assets - wait a few minutes and retry');
      process.exit(1);
    }
  }
  
  console.log('');
  console.log('🎉 Asset validation successful!');
  console.log('   ✅ Release has proper assets');
  console.log('   ✅ Executable found and properly sized');
  console.log('   ✅ Download URLs are available');
  console.log('   ✅ UpdateManager should work correctly');
  
} catch (error) {
  console.error('❌ Validation failed:', error.message);
  
  if (error.message.includes('release not found')) {
    console.error('');
    console.error('🔧 Release not found. Create it first:');
    console.error(`   gh release create ${VERSION} --generate-notes`);
  }
  
  process.exit(1);
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}