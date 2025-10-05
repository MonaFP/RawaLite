// ABI-Checker vor jeder Installation
// Warnt bei ABI-Mismatches und versucht Auto-Fix

const fs = require('node:fs');
const path = require('node:path');

console.log('🔍 [ABI-Check] Checking Electron ABI compatibility...');

try {
  // Check if better-sqlite3 exists
  const sqlitePath = path.join(__dirname, '..', 'node_modules', 'better-sqlite3');
  if (!fs.existsSync(sqlitePath)) {
    console.log('ℹ️ [ABI-Check] better-sqlite3 not installed yet - OK');
    process.exit(0);
  }

  // Get Electron version
  const electronPkg = require('../node_modules/electron/package.json');
  const electronVersion = electronPkg.version;
  
  // Check .npmrc configuration
  const npmrcPath = path.join(__dirname, '..', '.npmrc');
  if (fs.existsSync(npmrcPath)) {
    const npmrcContent = fs.readFileSync(npmrcPath, 'utf8');
    if (!npmrcContent.includes(`target=${electronVersion}`)) {
      console.log('⚠️ [ABI-Check] .npmrc target version mismatch');
      console.log(`   Expected: target=${electronVersion}`);
      console.log(`   Will be fixed by rebuild script`);
    }
  }

  // Try to load better-sqlite3 to check ABI
  try {
    const Database = require('better-sqlite3');
    const testDb = new Database(':memory:');
    testDb.close();
    console.log('✅ [ABI-Check] better-sqlite3 ABI compatible');
  } catch (error) {
    if (error.message.includes('NODE_MODULE_VERSION')) {
      console.log('❌ [ABI-Check] ABI mismatch detected!');
      console.log('   Will trigger rebuild after install...');
      
      // Create flag file for post-install rebuild
      const flagPath = path.join(__dirname, '..', '.needs-abi-rebuild');
      fs.writeFileSync(flagPath, `ABI mismatch detected at ${new Date().toISOString()}\n${error.message}`);
    } else {
      console.log('ℹ️ [ABI-Check] Other SQLite error (not ABI related)');
    }
  }

} catch (error) {
  console.log('ℹ️ [ABI-Check] Check failed, but continuing...', error.message);
}

console.log('✅ [ABI-Check] Complete');
process.exit(0);