#!/usr/bin/env node

/**
 * Test Asset Matching for UpdateManager Compatibility
 * Tests both v1.0.32 legacy format and v1.0.35+ format
 */

// Mock release data
const mockReleases = {
  'v1.0.32': {
    tag_name: 'v1.0.32',
    assets: [
      { name: 'RawaLite.Setup.1.0.32.exe', browser_download_url: 'https://github.com/MonaFP/RawaLite/releases/download/v1.0.32/RawaLite.Setup.1.0.32.exe' }
    ]
  },
  'v1.0.35': {
    tag_name: 'v1.0.35',
    assets: [
      { name: 'RawaLite-Setup-1.0.35.exe', browser_download_url: 'https://github.com/MonaFP/RawaLite/releases/download/v1.0.35/RawaLite-Setup-1.0.35.exe' }
    ]
  },
  'v1.0.36': {
    tag_name: 'v1.0.36',
    assets: [
      { name: 'RawaLite-Setup-1.0.36.exe', browser_download_url: 'https://github.com/MonaFP/RawaLite/releases/download/v1.0.36/RawaLite-Setup-1.0.36.exe' }
    ]
  }
};

// Universal Asset Matching Function (same as UpdateManagerService)
function findSetupAsset(release) {
  return release.assets.find((a) => 
    // Legacy pattern: RawaLite.Setup.1.0.32.exe (v1.0.32 and earlier)
    a.name.match(/RawaLite\.Setup\.\d+\.\d+\.\d+\.exe$/i) ||
    // Current pattern: RawaLite-Setup-1.0.35.exe (v1.0.34+)
    a.name.match(/RawaLite-Setup-\d+\.\d+\.\d+\.exe$/i) ||
    // Fallback patterns for any Setup.exe
    (a.name.includes('.exe') && a.name.includes('Setup')) ||
    a.name.match(/RawaLite.*Setup.*\.exe$/i)
  );
}

// Test all scenarios
console.log('🧪 UpdateManager Asset Matching Test\n');

Object.entries(mockReleases).forEach(([version, release]) => {
  const asset = findSetupAsset(release);
  console.log(`${version}:`);
  console.log(`  Asset Name: ${asset ? asset.name : 'NOT FOUND'}`);
  console.log(`  Download URL: ${asset ? asset.browser_download_url : 'N/A'}`);
  console.log(`  Status: ${asset ? '✅ FOUND' : '❌ MISSING'}`);
  console.log('');
});

// Test v1.0.32 trying to find v1.0.35
console.log('🔍 Cross-Version Compatibility Test:');
console.log('v1.0.32 trying to read v1.0.35:');
const v32CanFindV35 = findSetupAsset(mockReleases['v1.0.35']);
console.log(`  Result: ${v32CanFindV35 ? '✅ COMPATIBLE' : '❌ INCOMPATIBLE'}`);