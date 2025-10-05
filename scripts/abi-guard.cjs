// ABI Guard für alle Build-Szenarien
// Läuft vor wichtigen Build-Commands

const { execSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

console.log('🛡️ [ABI-Guard] Pre-build ABI verification...');

// Important: We can't test better-sqlite3 in Node.js context when built for Electron
// Instead, we check for known indicators of ABI problems

try {
  // Check if rebuild flag exists (indicates previous ABI issues)
  const flagPath = path.join(__dirname, '..', '.needs-abi-rebuild');
  if (fs.existsSync(flagPath)) {
    console.log('🔄 [ABI-Guard] Rebuild flag detected - auto-fixing...');
    
    try {
      execSync('node scripts/rebuild-native-electron.cjs', { 
        stdio: 'inherit',
        cwd: path.join(__dirname, '..')
      });
      console.log('✅ [ABI-Guard] ABI rebuild completed');
    } catch (fixError) {
      console.error('💥 [ABI-Guard] Critical: Rebuild failed');
      process.exit(1);
    }
  } else {
    // Check .npmrc consistency
    const electronPkg = require('../node_modules/electron/package.json');
    const electronVersion = electronPkg.version;
    
    const npmrcPath = path.join(__dirname, '..', '.npmrc');
    if (fs.existsSync(npmrcPath)) {
      const npmrcContent = fs.readFileSync(npmrcPath, 'utf8');
      if (!npmrcContent.includes(`target=${electronVersion}`)) {
        console.log('⚠️ [ABI-Guard] .npmrc version mismatch - syncing...');
        execSync('node scripts/sync-npmrc.cjs', { 
          stdio: 'inherit',
          cwd: path.join(__dirname, '..')
        });
      } else {
        console.log('✅ [ABI-Guard] .npmrc configuration looks correct');
      }
    }
    
    // Note: Actual ABI test happens when Electron starts
    console.log('ℹ️ [ABI-Guard] Note: Final ABI test occurs when Electron loads better-sqlite3');
  }

} catch (error) {
  console.warn('⚠️ [ABI-Guard] Check failed, but continuing...', error.message);
}

console.log('✅ [ABI-Guard] Verification complete');