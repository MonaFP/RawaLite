#!/usr/bin/env node
/**
 * RawaLite Release Verification Script
 * 
 * Validates SHA512 checksums in latest.yml match actual installer files
 * Prevents SHA512 checksum mismatches that cause update failures
 * 
 * Usage: node scripts/verify-release.mjs
 */

import { readFileSync, statSync } from 'fs';
import { createHash } from 'crypto';
import { join } from 'path';
import { parse } from 'yaml';

const RELEASE_DIR = './release';
const LATEST_YML = join(RELEASE_DIR, 'latest.yml');

/**
 * Calculate SHA512 checksum of a file
 */
function calculateSHA512(filePath) {
  try {
    const fileBuffer = readFileSync(filePath);
    return createHash('sha512').update(fileBuffer).digest('base64');
  } catch (error) {
    console.error(`❌ Error calculating SHA512 for ${filePath}:`, error.message);
    return null;
  }
}

/**
 * Get file size in bytes
 */
function getFileSize(filePath) {
  try {
    return statSync(filePath).size;
  } catch (error) {
    console.error(`❌ Error getting file size for ${filePath}:`, error.message);
    return null;
  }
}

/**
 * Parse latest.yml and validate checksums
 */
function verifyRelease() {
  console.log('🔍 RawaLite Release Verification Starting...\n');

  // Check if latest.yml exists
  try {
    statSync(LATEST_YML);
  } catch (error) {
    console.error(`❌ latest.yml not found at ${LATEST_YML}`);
    process.exit(1);
  }

  // Parse latest.yml
  let latestData;
  try {
    const yamlContent = readFileSync(LATEST_YML, 'utf8');
    latestData = parse(yamlContent);
    console.log('✅ latest.yml parsed successfully');
  } catch (error) {
    console.error('❌ Error parsing latest.yml:', error.message);
    process.exit(1);
  }

  // Extract file information
  const { version, files } = latestData;
  console.log(`📦 Version: ${version}`);
  console.log(`📁 Files to verify: ${files.length}\n`);

  let errors = 0;
  let warnings = 0;

  // Verify each file
  for (const fileInfo of files) {
    const { url, sha512, size } = fileInfo;
    const fileName = url.split('/').pop(); // Extract filename from URL
    const filePath = join(RELEASE_DIR, fileName);

    console.log(`🔍 Verifying: ${fileName}`);

    // Check if file exists
    try {
      statSync(filePath);
    } catch (error) {
      console.error(`  ❌ File not found: ${filePath}`);
      errors++;
      continue;
    }

    // Verify file size
    const actualSize = getFileSize(filePath);
    if (actualSize !== size) {
      console.error(`  ❌ Size mismatch: expected ${size}, got ${actualSize}`);
      errors++;
      continue;
    }
    console.log(`  ✅ Size: ${size} bytes`);

    // Verify SHA512 checksum
    const actualSHA512 = calculateSHA512(filePath);
    if (!actualSHA512) {
      errors++;
      continue;
    }

    if (actualSHA512 !== sha512) {
      console.error(`  ❌ SHA512 mismatch:`);
      console.error(`     Expected: ${sha512}`);
      console.error(`     Actual:   ${actualSHA512}`);
      errors++;
    } else {
      console.log(`  ✅ SHA512: ${sha512.substring(0, 16)}...`);
    }

    console.log('');
  }

  // Final report
  console.log('📊 Verification Summary:');
  console.log(`   Files checked: ${files.length}`);
  console.log(`   Errors: ${errors}`);
  console.log(`   Warnings: ${warnings}\n`);

  if (errors > 0) {
    console.error('❌ Release verification FAILED!');
    console.error('   Please regenerate release assets or fix checksum issues.');
    process.exit(1);
  } else {
    console.log('✅ Release verification PASSED!');
    console.log('   All files match their checksums in latest.yml');
  }
}

// Run verification
verifyRelease();