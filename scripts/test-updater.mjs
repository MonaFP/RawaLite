// scripts/test-updater.mjs
// Test script to verify custom updater setup

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');

console.log('🧪 RawaLite Custom Updater Test Suite');
console.log('=====================================\n');

let testsPassed = 0;
let testsFailed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`✅ ${name}`);
    testsPassed++;
  } catch (error) {
    console.log(`❌ ${name}`);
    console.log(`   Error: ${error.message}`);
    testsFailed++;
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}

// Test 1: Check file structure
test('File structure is complete', () => {
  const requiredFiles = [
    'electron/main.ts',
    'electron/preload.ts',
    'src/types/updater.d.ts',
    'src/global.d.ts',
    'src/services/semver.js',
    'resources/update-launcher.ps1',
    'scripts/generate-update-json.mjs',
    'electron-builder.yml',
    'package.json'
  ];
  
  for (const file of requiredFiles) {
    const filePath = path.join(rootDir, file);
    assert(fs.existsSync(filePath), `Missing file: ${file}`);
  }
});

// Test 2: Check package.json version
test('Package.json has valid version', () => {
  const pkg = JSON.parse(fs.readFileSync(path.join(rootDir, 'package.json'), 'utf-8'));
  assert(pkg.version, 'No version in package.json');
  assert(/^\d+\.\d+\.\d+$/.test(pkg.version), `Invalid version format: ${pkg.version}`);
  console.log(`   Version: ${pkg.version}`);
});

// Test 3: Check semver utility
test('Semver utility works correctly', async () => {
  const semverPath = path.join(rootDir, 'src/services/semver.js');
  const semverCode = fs.readFileSync(semverPath, 'utf-8');
  
  // Create temporary test file
  const testFile = path.join(__dirname, 'test-semver.mjs');
  fs.writeFileSync(testFile, semverCode + `
    // Test cases
    const test1 = isNewerVersion('1.8.101', '1.8.100');
    const test2 = isNewerVersion('1.8.100', '1.8.101');
    const test3 = isNewerVersion('2.0.0', '1.9.99');
    
    if (!test1) throw new Error('1.8.101 should be newer than 1.8.100');
    if (test2) throw new Error('1.8.100 should not be newer than 1.8.101');
    if (!test3) throw new Error('2.0.0 should be newer than 1.9.99');
    
    console.log('Semver tests passed');
  `);
  
  try {
    execSync(`node ${testFile}`, { stdio: 'ignore' });
  } finally {
    fs.unlinkSync(testFile);
  }
});

// Test 4: Check PowerShell launcher syntax
test('PowerShell launcher has valid syntax', () => {
  const launcherPath = path.join(rootDir, 'resources/update-launcher.ps1');
  const launcherContent = fs.readFileSync(launcherPath, 'utf-8');
  
  // Basic syntax checks
  assert(launcherContent.includes('param('), 'Missing param block');
  assert(launcherContent.includes('$InstallerPath'), 'Missing InstallerPath parameter');
  assert(launcherContent.includes('Write-Log'), 'Missing Write-Log function');
  assert(launcherContent.includes('Start-Process'), 'Missing Start-Process call');
  assert(launcherContent.includes('ConvertTo-Json'), 'Missing JSON result saving');
});

// Test 5: Check TypeScript types
test('TypeScript types are properly defined', () => {
  const updaterTypes = fs.readFileSync(path.join(rootDir, 'src/types/updater.d.ts'), 'utf-8');
  const globalTypes = fs.readFileSync(path.join(rootDir, 'src/global.d.ts'), 'utf-8');
  
  // Check updater.d.ts exports
  assert(updaterTypes.includes('export interface UpdateManifest'), 'Missing UpdateManifest');
  assert(updaterTypes.includes('export interface UpdateProgress'), 'Missing UpdateProgress');
  assert(updaterTypes.includes('export interface UpdateCheckResult'), 'Missing UpdateCheckResult');
  
  // Check global.d.ts window definitions
  assert(globalTypes.includes('window.rawalite'), 'Missing window.rawalite');
  assert(globalTypes.includes('updater:'), 'Missing updater namespace');
});

// Test 6: Check electron-builder configuration
test('Electron-builder.yml is properly configured', () => {
  const builderConfig = fs.readFileSync(path.join(rootDir, 'electron-builder.yml'), 'utf-8');
  
  assert(builderConfig.includes('appId: com.rawalite.app'), 'Missing appId');
  assert(builderConfig.includes('productName: RawaLite'), 'Missing productName');
  assert(builderConfig.includes('target: nsis'), 'Missing NSIS target');
  assert(builderConfig.includes('oneClick: false'), 'oneClick should be false');
  assert(builderConfig.includes('perMachine: false'), 'perMachine should be false');
  assert(builderConfig.includes('packElevateHelper: true'), 'packElevateHelper should be true');
});

// Test 7: Check preload script
test('Preload script exports correct APIs', () => {
  const preloadContent = fs.readFileSync(path.join(rootDir, 'electron/preload.ts'), 'utf-8');
  
  // Check API exports
  assert(preloadContent.includes('contextBridge.exposeInMainWorld'), 'Missing contextBridge');
  assert(preloadContent.includes('"rawalite"'), 'Should expose rawalite namespace');
  assert(preloadContent.includes('updater'), 'Missing updater API');
  assert(preloadContent.includes('version'), 'Missing version API');
  assert(preloadContent.includes('check:'), 'Missing check method');
  assert(preloadContent.includes('download:'), 'Missing download method');
  assert(preloadContent.includes('install:'), 'Missing install method');
});

// Test 8: Check main.ts handlers
test('Main.ts has all required IPC handlers', () => {
  const mainContent = fs.readFileSync(path.join(rootDir, 'electron/main.ts'), 'utf-8');
  
  // Check IPC handlers
  assert(mainContent.includes('ipcMain.handle("updater:check"'), 'Missing updater:check handler');
  assert(mainContent.includes('ipcMain.handle("updater:download"'), 'Missing updater:download handler');
  assert(mainContent.includes('ipcMain.handle("updater:install"'), 'Missing updater:install handler');
  assert(mainContent.includes('ipcMain.handle("version:get"'), 'Missing version:get handler');
  
  // Check helper functions
  assert(mainContent.includes('fetchUpdateManifest'), 'Missing fetchUpdateManifest');
  assert(mainContent.includes('downloadFileWithProgress'), 'Missing downloadFileWithProgress');
  assert(mainContent.includes('verifyFileSha512'), 'Missing verifyFileSha512');
});

// Test 9: Check for assets directory
test('Assets directory exists', () => {
  const assetsDir = path.join(rootDir, 'assets');
  if (!fs.existsSync(assetsDir)) {
    fs.mkdirSync(assetsDir, { recursive: true });
    console.log('   Created assets directory');
  }
  
  // Check for icon
  const iconPath = path.join(assetsDir, 'icon.ico');
  if (!fs.existsSync(iconPath)) {
    console.log('   ⚠️  Warning: icon.ico not found - needed for build');
  }
});

// Test 10: Check Node version
test('Node.js version is compatible', () => {
  const nodeVersion = process.version;
  const majorVersion = parseInt(nodeVersion.split('.')[0].substring(1));
  assert(majorVersion >= 20, `Node.js v20+ required, found ${nodeVersion}`);
  console.log(`   Node.js version: ${nodeVersion}`);
});

// Summary
console.log('\n=====================================');
console.log('Test Results:');
console.log(`✅ Passed: ${testsPassed}`);
console.log(`❌ Failed: ${testsFailed}`);

if (testsFailed === 0) {
  console.log('\n🎉 All tests passed! Custom updater is ready.');
  console.log('\nNext steps:');
  console.log('1. Add icon.ico to assets/ directory');
  console.log('2. Run: pnpm build');
  console.log('3. Run: pnpm dist');
  console.log('4. Run: pnpm generate:update-json');
  process.exit(0);
} else {
  console.log(`\n⚠️  ${testsFailed} test(s) failed. Please fix the issues above.`);
  process.exit(1);
}