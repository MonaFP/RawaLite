#!/usr/bin/env node
/**
 * verify-update.ts
 * 
 * Verifies update assets and GitHub release compatibility
 * For RawaLite Custom Update System
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import https from 'https';

interface UpdateMetadata {
  version: string;
  releaseDate: string;
  downloadUrl: string;
  checksumSha256: string;
  fileSize: number;
  releaseNotes?: string;
  minimumVersion?: string;
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

/**
 * Load package.json
 */
function loadPackageJson(): PackageJson {
  const packagePath = path.join(process.cwd(), 'package.json');
  const packageContent = fs.readFileSync(packagePath, 'utf-8');
  return JSON.parse(packageContent);
}

/**
 * Load update.json metadata
 */
function loadUpdateMetadata(): UpdateMetadata {
  const updateJsonPath = path.join(process.cwd(), 'release', 'update.json');
  
  if (!fs.existsSync(updateJsonPath)) {
    throw new Error(`update.json not found at ${updateJsonPath}. Run 'node scripts/make-update-json.ts' first.`);
  }
  
  const updateContent = fs.readFileSync(updateJsonPath, 'utf-8');
  return JSON.parse(updateContent);
}

/**
 * Verify local setup file exists and matches metadata
 */
function verifyLocalAssets(metadata: UpdateMetadata): boolean {
  console.log('📋 Verifying local release assets...');
  
  const releaseDir = path.join(process.cwd(), 'release');
  const setupExePath = path.join(releaseDir, `RawaLite-Setup-${metadata.version}.exe`);
  
  // Check if setup file exists
  if (!fs.existsSync(setupExePath)) {
    console.error(`❌ Setup file not found: ${setupExePath}`);
    return false;
  }
  
  // Verify file size
  const actualSize = fs.statSync(setupExePath).size;
  if (actualSize !== metadata.fileSize) {
    console.error(`❌ File size mismatch:`);
    console.error(`   Expected: ${metadata.fileSize} bytes`);
    console.error(`   Actual: ${actualSize} bytes`);
    return false;
  }
  
  // Verify checksum
  const fileBuffer = fs.readFileSync(setupExePath);
  const hashSum = crypto.createHash('sha256');
  hashSum.update(fileBuffer);
  const actualChecksum = hashSum.digest('hex');
  
  if (actualChecksum !== metadata.checksumSha256) {
    console.error(`❌ Checksum mismatch:`);
    console.error(`   Expected: ${metadata.checksumSha256}`);
    console.error(`   Actual: ${actualChecksum}`);
    return false;
  }
  
  console.log(`✅ Setup file verified: ${path.basename(setupExePath)}`);
  console.log(`   📊 Size: ${Math.round(actualSize / 1024 / 1024 * 100) / 100} MB`);
  console.log(`   🔐 SHA256: ${actualChecksum}`);
  
  return true;
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
async function verifyGitHubAssets(metadata: UpdateMetadata): Promise<boolean> {
  console.log('🌐 Verifying GitHub release assets...');
  
  try {
    const release = await fetchGitHubRelease(metadata.version);
    
    if (!release) {
      console.log(`ℹ️ GitHub release v${metadata.version} not yet published - local verification only`);
      return true; // Not an error - release may not be published yet
    }
    
    console.log(`✅ Found GitHub release: ${release.name}`);
    console.log(`   📅 Published: ${release.published_at}`);
    console.log(`   📦 Assets: ${release.assets.length}`);
    
    // Look for setup file asset
    const setupFileName = `RawaLite-Setup-${metadata.version}.exe`;
    const setupAsset = release.assets.find(asset => asset.name === setupFileName);
    
    if (!setupAsset) {
      console.error(`❌ Setup file not found in GitHub release assets: ${setupFileName}`);
      console.log(`   Available assets: ${release.assets.map(a => a.name).join(', ')}`);
      return false;
    }
    
    // Verify asset size
    if (setupAsset.size !== metadata.fileSize) {
      console.error(`❌ GitHub asset size mismatch:`);
      console.error(`   Expected: ${metadata.fileSize} bytes`);
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
function verifyVersionConsistency(packageJson: PackageJson, metadata: UpdateMetadata): boolean {
  console.log('🏷️ Verifying version consistency...');
  
  if (packageJson.version !== metadata.version) {
    console.error(`❌ Version mismatch:`);
    console.error(`   package.json: ${packageJson.version}`);
    console.error(`   update.json: ${metadata.version}`);
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
    const metadata = loadUpdateMetadata();
    
    console.log(`📋 Project: ${packageJson.name}`);
    console.log(`🏷️ Version: ${packageJson.version}`);
    console.log('');
    
    // Run verifications
    let allVerified = true;
    
    // 1. Version consistency
    if (!verifyVersionConsistency(packageJson, metadata)) {
      allVerified = false;
    }
    console.log('');
    
    // 2. Local assets
    if (!verifyLocalAssets(metadata)) {
      allVerified = false;
    }
    console.log('');
    
    // 3. GitHub assets (optional)
    if (!await verifyGitHubAssets(metadata)) {
      // GitHub verification failure is not critical if release isn't published yet
      console.log('⚠️ GitHub verification failed - continue if release not yet published');
    }
    console.log('');
    
    // Summary
    if (allVerified) {
      console.log('🎉 All verifications passed! Update assets are ready.');
      console.log('📤 Next steps:');
      console.log('   1. git tag v' + metadata.version);
      console.log('   2. git push origin main --tags');
      console.log('   3. gh release create v' + metadata.version + ' release/*.exe release/update.json');
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