#!/usr/bin/env node

/**
 * 🔍 PRE-RELEASE VALIDATION SCRIPT
 * 
 * Comprehensive validation before any release to prevent critical issues
 * Includes asset validation for existing releases
 * 
 * Usage:
 *   node scripts/pre-release-validation.mjs
 *   pnpm validate:pre-release
 */

import { execSync } from 'child_process';
import { readFileSync } from 'fs';

console.log('🔍 RawaLite Pre-Release Validation');
console.log('=================================');

let hasErrors = false;

// Get current version from package.json
const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));
const currentVersion = packageJson.version;
const currentTag = `v${currentVersion}`;

console.log(`📦 Current Version: ${currentVersion}`);
console.log('');

// 1. Critical Fixes Validation
console.log('1️⃣ Validating Critical Fixes...');
try {
  execSync('pnpm validate:critical-fixes', { stdio: 'inherit' });
  console.log('   ✅ Critical fixes validated');
} catch (error) {
  console.log('   ❌ Critical fixes validation failed!');
  hasErrors = true;
}
console.log('');

// 2. Test Suite
console.log('2️⃣ Running Test Suite...');
try {
  execSync('pnpm test:critical-fixes', { stdio: 'inherit' });
  console.log('   ✅ Critical fix tests passed');
} catch (error) {
  console.log('   ❌ Critical fix tests failed!');
  hasErrors = true;
}
console.log('');

// 3. Git Status Check
console.log('3️⃣ Checking Git Status...');
try {
  const gitStatus = execSync('git status --porcelain', { encoding: 'utf8' });
  if (gitStatus.trim()) {
    console.log('   ❌ Working tree not clean:');
    console.log(gitStatus);
    hasErrors = true;
  } else {
    console.log('   ✅ Working tree clean');
  }
} catch (error) {
  console.log('   ❌ Git status check failed:', error.message);
  hasErrors = true;
}
console.log('');

// 4. Check if current version already exists as release
console.log('4️⃣ Checking Release Status...');
try {
  const releaseOutput = execSync(`gh release view ${currentTag} --json tagName,assets`, { encoding: 'utf8' });
  const release = JSON.parse(releaseOutput);
  
  console.log(`   📋 Release ${currentTag} already exists`);
  
  // Validate existing release assets
  if (!release.assets || release.assets.length === 0) {
    console.log('   🚨 CRITICAL: Existing release has NO ASSETS!');
    console.log('   📋 This causes "Failed to parse URL from" errors');
    console.log('   🔧 Fix: Delete release and recreate with assets');
    hasErrors = true;
  } else {
    console.log(`   ✅ Release has ${release.assets.length} asset(s)`);
    
    // Check for executable
    const hasExe = release.assets.some(asset => asset.name.includes('.exe'));
    if (!hasExe) {
      console.log('   ❌ No .exe file found in release assets!');
      hasErrors = true;
    } else {
      console.log('   ✅ Executable asset found');
    }
  }
  
} catch (error) {
  if (error.message.includes('release not found')) {
    console.log(`   📋 Release ${currentTag} does not exist yet - OK for new release`);
  } else {
    console.log('   ❌ GitHub release check failed:', error.message);
    hasErrors = true;
  }
}
console.log('');

// 5. Build Test
console.log('5️⃣ Testing Build Process...');
try {
  execSync('pnpm build', { stdio: 'inherit' });
  console.log('   ✅ Build successful');
} catch (error) {
  console.log('   ❌ Build failed!');
  hasErrors = true;
}
console.log('');

// 6. TypeScript & Lint Check
console.log('6️⃣ Code Quality Checks...');
try {
  execSync('pnpm typecheck', { stdio: 'pipe' });
  console.log('   ✅ TypeScript check passed');
} catch (error) {
  console.log('   ❌ TypeScript errors found!');
  hasErrors = true;
}

try {
  execSync('pnpm lint', { stdio: 'pipe' });
  console.log('   ✅ ESLint check passed');
} catch (error) {
  console.log('   ⚠️  ESLint warnings found (non-blocking)');
}
console.log('');

// Final Result
console.log('📊 VALIDATION SUMMARY');
console.log('===================');

if (hasErrors) {
  console.log('❌ Pre-release validation FAILED!');
  console.log('');
  console.log('🔧 Required actions:');
  console.log('   1. Fix all validation errors above');
  console.log('   2. Run validation again');
  console.log('   3. Only proceed with release after all checks pass');
  console.log('');
  process.exit(1);
} else {
  console.log('✅ Pre-release validation PASSED!');
  console.log('');
  console.log('🚀 Ready for release:');
  console.log(`   - Version: ${currentVersion}`);
  console.log('   - All critical fixes validated');
  console.log('   - Tests passing');
  console.log('   - Working tree clean');
  console.log('   - Build successful');
  console.log('');
  console.log('🎯 Next steps:');
  console.log('   1. Version bump: pnpm safe:version [patch|minor|major]');
  console.log('   2. Build assets: pnpm dist');
  console.log('   3. Create release: gh release create vX.X.X --generate-notes');
  console.log('   4. Validate assets: pnpm validate:release-assets vX.X.X');
  console.log('');
}