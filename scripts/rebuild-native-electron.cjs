// Erzwingt Electron-ABI für better-sqlite3 – robust gegen versehentliche Node-Rebuilds.
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

console.log('🔧 [Rebuild] Starting Electron-ABI rebuild for better-sqlite3...');

// Get exact Electron version
const ver = require('../node_modules/electron/package.json').version; // exakte Version ohne ^
console.log(`🎯 [Rebuild] Target Electron version: ${ver}`);

// Set Electron build environment
process.env.npm_config_runtime = 'electron';
process.env.npm_config_target  = ver;
process.env.npm_config_disturl = 'https://atom.io/download/atom-shell';
process.env.npm_config_build_from_source = 'true';

console.log('🔄 [Rebuild] Environment configured for Electron');
console.log(`   Runtime: ${process.env.npm_config_runtime}`);
console.log(`   Target: ${process.env.npm_config_target}`);

// Update .npmrc to match current Electron version
const npmrcPath = path.join(__dirname, '..', '.npmrc');
const npmrcContent = `runtime=electron
target=${ver}
disturl=https://atom.io/download/atom-shell
build_from_source=true
`;

try {
  fs.writeFileSync(npmrcPath, npmrcContent);
  console.log('✅ [Rebuild] Updated .npmrc with current Electron version');
} catch (error) {
  console.warn('⚠️ [Rebuild] Could not update .npmrc:', error.message);
}

// Run rebuild - try different approaches
console.log('🚀 [Rebuild] Rebuilding better-sqlite3...');

let rebuildSuccess = false;

// First try: Standard rebuild
console.log('🔄 [Rebuild] Attempt 1: Standard rebuild...');
const r1 = spawnSync('pnpm', ['rebuild', 'better-sqlite3', '--verbose'], { stdio: 'inherit', shell: true });

if (r1.status === 0) {
  rebuildSuccess = true;
  console.log('✅ [Rebuild] Standard rebuild successful');
} else {
  console.log('⚠️ [Rebuild] Standard rebuild failed, trying reinstall...');
  
  // Second try: Remove and reinstall
  console.log('🔄 [Rebuild] Attempt 2: Remove and reinstall...');
  const r2 = spawnSync('pnpm', ['remove', 'better-sqlite3'], { stdio: 'inherit', shell: true });
  if (r2.status === 0) {
    const r3 = spawnSync('pnpm', ['add', 'better-sqlite3'], { stdio: 'inherit', shell: true });
    if (r3.status === 0) {
      rebuildSuccess = true;
      console.log('✅ [Rebuild] Reinstall successful');
    }
  }
}

if (rebuildSuccess) {
  console.log('✅ [Rebuild] better-sqlite3 rebuilt successfully for Electron');
  
  // Test the build (Note: ABI mismatch in Node context is expected when built for Electron)
  try {
    const Database = require('better-sqlite3');
    const testDb = new Database(':memory:');
    testDb.close();
    console.log('✅ [Rebuild] ABI test passed - better-sqlite3 is working');
  } catch (error) {
    if (error.message.includes('NODE_MODULE_VERSION 125') && error.message.includes('NODE_MODULE_VERSION 127')) {
      console.log('ℹ️ [Rebuild] Expected ABI mismatch in Node context (built for Electron ABI 125)');
      console.log('✅ [Rebuild] Build successful - better-sqlite3 is ready for Electron');
    } else {
      console.error('❌ [Rebuild] Unexpected ABI test error:', error.message);
      process.exit(1);
    }
  }
  
  // Clean up flag file if it exists
  const flagPath = path.join(__dirname, '..', '.needs-abi-rebuild');
  if (fs.existsSync(flagPath)) {
    fs.unlinkSync(flagPath);
    console.log('🧹 [Rebuild] Removed ABI rebuild flag');
  }
  
} else {
  console.error('❌ [Rebuild] All rebuild attempts failed');
  process.exit(1);
}

process.exit(0);