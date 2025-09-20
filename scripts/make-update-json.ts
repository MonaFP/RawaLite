#!/usr/bin/env node
/**
 * make-update-json.ts
 * 
 * Creates update.json metadata for GitHub-based Custom Update System
 * Used by RawaLite Custom Update System instead of electron-updater
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

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
  [key: string]: any;
}

/**
 * Calculate SHA256 checksum of a file
 */
function calculateChecksum(filePath: string): string {
  const fileBuffer = fs.readFileSync(filePath);
  const hashSum = crypto.createHash('sha256');
  hashSum.update(fileBuffer);
  return hashSum.digest('hex');
}

/**
 * Get file size in bytes
 */
function getFileSize(filePath: string): number {
  const stats = fs.statSync(filePath);
  return stats.size;
}

/**
 * Load package.json for version info
 */
function loadPackageJson(): PackageJson {
  const packagePath = path.join(process.cwd(), 'package.json');
  const packageContent = fs.readFileSync(packagePath, 'utf-8');
  return JSON.parse(packageContent);
}

/**
 * Generate update metadata
 */
function generateUpdateMetadata(setupExePath: string, version: string): UpdateMetadata {
  console.log(`📦 Generating update metadata for version ${version}`);
  console.log(`📁 Setup file: ${setupExePath}`);
  
  // Verify setup file exists
  if (!fs.existsSync(setupExePath)) {
    throw new Error(`Setup file not found: ${setupExePath}`);
  }
  
  const checksum = calculateChecksum(setupExePath);
  const fileSize = getFileSize(setupExePath);
  const setupFileName = path.basename(setupExePath);
  
  console.log(`📊 File size: ${Math.round(fileSize / 1024 / 1024 * 100) / 100} MB`);
  console.log(`🔐 SHA256: ${checksum}`);
  
  const metadata: UpdateMetadata = {
    version,
    releaseDate: new Date().toISOString(),
    downloadUrl: `https://github.com/MonaFP/RawaLite/releases/download/v${version}/${setupFileName}`,
    checksumSha256: checksum,
    fileSize,
    releaseNotes: `RawaLite v${version} - Automatic update available`,
    minimumVersion: "1.8.0" // Minimum supported version for updates
  };
  
  return metadata;
}

/**
 * Write update.json file
 */
function writeUpdateJson(metadata: UpdateMetadata, outputPath: string) {
  const updateJsonContent = JSON.stringify(metadata, null, 2);
  fs.writeFileSync(outputPath, updateJsonContent);
  console.log(`✅ Update metadata written to: ${outputPath}`);
  console.log(`📄 Content preview:`);
  console.log(updateJsonContent);
}

/**
 * Main execution
 */
function main() {
  try {
    console.log('🚀 === RawaLite Custom Update Metadata Generator ===');
    
    // Load version from package.json
    const packageJson = loadPackageJson();
    const version = packageJson.version;
    
    console.log(`📋 Project: ${packageJson.name}`);
    console.log(`🏷️ Version: ${version}`);
    
    // Define paths
    const releaseDir = path.join(process.cwd(), 'release');
    const setupExePath = path.join(releaseDir, `RawaLite-Setup-${version}.exe`);
    const updateJsonPath = path.join(releaseDir, 'update.json');
    
    // Verify release directory exists
    if (!fs.existsSync(releaseDir)) {
      throw new Error(`Release directory not found: ${releaseDir}\nRun 'pnpm dist' first to create release assets.`);
    }
    
    // Generate metadata
    const metadata = generateUpdateMetadata(setupExePath, version);
    
    // Write update.json
    writeUpdateJson(metadata, updateJsonPath);
    
    console.log('🎉 Update metadata generation completed successfully!');
    console.log('📤 Files ready for GitHub release upload:');
    console.log(`   • ${path.basename(setupExePath)}`);
    console.log(`   • update.json`);
    
  } catch (error) {
    console.error('❌ Error generating update metadata:');
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { generateUpdateMetadata, writeUpdateJson };