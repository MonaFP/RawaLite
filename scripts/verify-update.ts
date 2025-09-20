#!/usr/bin/env tsx
/**
 * 🔍 RawaLite Custom Update Verifier
 * 
 * Verifies update assets, SHA512 checksums, and GitHub release compatibility
 * For RawaLite Custom In-App Update System
 */

import { readFileSync, existsSync, statSync } from 'fs';
import { join, basename } from 'path';
import { createHash } from 'crypto';
import https from 'https';

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

interface PackageJson {
  version: string;
  name: string;
}

interface GitHubRelease {
  tag_name: string;
  name: string;
  published_at: string;
  assets: Array<{
    name: string;
    size: number;
    browser_download_url: string;
  }>;
}

interface PackageJson {
  version: string;
  name: string;
}

interface GitHubRelease {
  tag_name: string;
  name: string;
  published_at: string;
  assets: Array<{
    name: string;
    size: number;
    browser_download_url: string;
  }>;
}

// === CONFIGURATION ===
const CONFIG = {
  githubRepo: 'MonaFP/RawaLite',
  releaseDir: join(process.cwd(), 'release'),
  distDir: join(process.cwd(), 'dist')
};

// === UTILITIES ===
function calculateSHA512(filePath: string): string {
  const fileBuffer = readFileSync(filePath);
  const hash = createHash('sha512');
  hash.update(fileBuffer);
  return hash.digest('base64');
}

/**
 * Load package.json
 */
function loadPackageJson(): PackageJson {
  const packagePath = join(process.cwd(), 'package.json');
  const packageContent = readFileSync(packagePath, 'utf-8');
  return JSON.parse(packageContent);
}

/**
 * Load update.json manifest
 */
function loadUpdateManifest(): UpdateManifest {
  const manifestPaths = [
    join(CONFIG.releaseDir, 'update.json'),
    join(CONFIG.distDir, 'update.json'),
    join(process.cwd(), 'update.json')
  ];
  
  for (const manifestPath of manifestPaths) {
    if (existsSync(manifestPath)) {
      const manifestContent = readFileSync(manifestPath, 'utf-8');
      return JSON.parse(manifestContent);
    }
  }
  
  throw new Error(`update.json not found. Searched: ${manifestPaths.join(', ')}\nRun 'npm run make:update-json' first.`);
}

/**
 * Find NSIS installer file based on manifest
 */
function findNSISFile(manifest: UpdateManifest): string {
  const nsisFile = manifest.files.find(file => file.kind === 'nsis');
  if (!nsisFile) {
    throw new Error('No NSIS file found in manifest');
  }
  
  // Look for the file in release and dist directories
  const searchPaths = [
    join(CONFIG.releaseDir, nsisFile.name),
    join(CONFIG.distDir, nsisFile.name)
  ];
  
  for (const filePath of searchPaths) {
    if (existsSync(filePath)) {
      return filePath;
    }
  }
  
  throw new Error(`NSIS installer not found: ${nsisFile.name}. Searched: ${searchPaths.join(', ')}`);
}

/**
 * Verify local setup file exists and matches metadata
 */
function verifyLocalAssets(manifest: UpdateManifest): boolean {
  console.log('📋 Verifying local release assets...');
  
  try {
    // Find the NSIS installer file
    const nsisFilePath = findNSISFile(manifest);
    const nsisFile = manifest.files[0]; // Should be the NSIS file
    
    console.log(`🎯 Verifying: ${basename(nsisFilePath)}`);
    
    // Verify file size
    const actualSize = statSync(nsisFilePath).size;
    if (actualSize !== nsisFile.size) {
      console.error(`❌ File size mismatch:`);
      console.error(`   Expected: ${nsisFile.size} bytes`);
      console.error(`   Actual: ${actualSize} bytes`);
      return false;
    }
    
    // Verify SHA512 checksum
    const actualSha512 = calculateSHA512(nsisFilePath);
    if (actualSha512 !== nsisFile.sha512) {
      console.error(`❌ SHA512 checksum mismatch:`);
      console.error(`   Expected: ${nsisFile.sha512.substring(0, 32)}...`);
      console.error(`   Actual: ${actualSha512.substring(0, 32)}...`);
      return false;
    }
    
    console.log(`✅ Setup file verified: ${basename(nsisFilePath)}`);
    console.log(`   📊 Size: ${Math.round(actualSize / 1024 / 1024 * 100) / 100} MB`);
    console.log(`   🔐 SHA512: ${actualSha512.substring(0, 32)}...`);
    
    return true;
    
  } catch (error) {
    console.error(`❌ Local asset verification failed: ${error}`);
    return false;
  }
}

/**
 * Fetch GitHub release information
 */
function fetchGitHubRelease(version: string): Promise<GitHubRelease | null> {
  return new Promise((resolve, reject) => {
    const url = `https://api.github.com/repos/MonaFP/RawaLite/releases/tags/v${version}`;
    
    console.log(`🌐 Fetching GitHub release: ${url}`);
    
    const req = https.get(url, {
      headers: {
        'User-Agent': 'RawaLite-Update-Verifier/1.0',
        'Accept': 'application/vnd.github.v3+json'
      }
    }, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          if (res.statusCode === 404) {
            console.log(`ℹ️ GitHub release v${version} not found (404)`);
            resolve(null);
            return;
          }
          
          if (res.statusCode !== 200) {
            reject(new Error(`GitHub API returned status ${res.statusCode}: ${data}`));
            return;
          }
          
          const release = JSON.parse(data);
          resolve(release);
        } catch (error) {
          reject(new Error(`Failed to parse GitHub API response: ${error}`));
        }
      });
    });
    
    req.on('error', (error) => {
      reject(new Error(`GitHub API request failed: ${error.message}`));
    });
    
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('GitHub API request timeout'));
    });
  });
}

/**
 * Verify GitHub release assets match local metadata
 */
async function verifyGitHubAssets(manifest: UpdateManifest): Promise<boolean> {
  console.log('🌐 Verifying GitHub release assets...');
  
  try {
    const release = await fetchGitHubRelease(manifest.version);
    
    if (!release) {
      console.log(`ℹ️ GitHub release v${manifest.version} not yet published - local verification only`);
      return true; // Not an error - release may not be published yet
    }
    
    console.log(`✅ Found GitHub release: ${release.name}`);
    console.log(`   📅 Published: ${release.published_at}`);
    console.log(`   📦 Assets: ${release.assets.length}`);
    
    // Look for NSIS setup file asset
    const nsisFile = manifest.files[0]; // Should be the NSIS file
    const setupAsset = release.assets.find(asset => asset.name === nsisFile.name);
    
    if (!setupAsset) {
      console.error(`❌ Setup file not found in GitHub release assets: ${nsisFile.name}`);
      console.log(`   Available assets: ${release.assets.map(a => a.name).join(', ')}`);
      return false;
    }
    
    // Verify asset size
    if (setupAsset.size !== nsisFile.size) {
      console.error(`❌ GitHub asset size mismatch:`);
      console.error(`   Expected: ${nsisFile.size} bytes`);
      console.error(`   GitHub asset: ${setupAsset.size} bytes`);
      return false;
    }
    
    console.log(`✅ GitHub asset verified: ${setupAsset.name}`);
    console.log(`   📊 Size: ${Math.round(setupAsset.size / 1024 / 1024 * 100) / 100} MB`);
    console.log(`   🔗 Download URL: ${setupAsset.browser_download_url}`);
    
    return true;
    
  } catch (error) {
    console.error(`❌ GitHub verification failed: ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

/**
 * Verify version consistency
 */
function verifyVersionConsistency(packageJson: PackageJson, manifest: UpdateManifest): boolean {
  console.log('🏷️ Verifying version consistency...');
  
  if (packageJson.version !== manifest.version) {
    console.error(`❌ Version mismatch:`);
    console.error(`   package.json: ${packageJson.version}`);
    console.error(`   update.json: ${manifest.version}`);
    return false;
  }
  
  console.log(`✅ Version consistent: ${packageJson.version}`);
  return true;
}

/**
 * Main verification
 */
async function main() {
  try {
    console.log('🔍 === RawaLite Update Assets Verification ===');
    
    // Load configuration
    const packageJson = loadPackageJson();
    const manifest = loadUpdateManifest();
    
    console.log(`📋 Project: ${packageJson.name}`);
    console.log(`🏷️ Version: ${packageJson.version}`);
    console.log('');
    
    // Run verifications
    let allVerified = true;
    
    // 1. Version consistency
    if (!verifyVersionConsistency(packageJson, manifest)) {
      allVerified = false;
    }
    console.log('');
    
    // 2. Local assets
    if (!verifyLocalAssets(manifest)) {
      allVerified = false;
    }
    console.log('');
    
    // 3. GitHub assets (optional)
    if (!await verifyGitHubAssets(manifest)) {
      // GitHub verification failure is not critical if release isn't published yet
      console.log('⚠️ GitHub verification failed - continue if release not yet published');
    }
    console.log('');
    
    // Summary
    if (allVerified) {
      console.log('🎉 All verifications passed! Update assets are ready.');
      console.log('📤 Next steps:');
      console.log('   1. git tag v' + manifest.version);
      console.log('   2. git push origin main --tags');
      console.log('   3. gh release create v' + manifest.version + ' release/*.exe release/update.json');
    } else {
      console.log('❌ Verification failed. Please fix issues before releasing.');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('❌ Verification error:');
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}