// Ultimate .npmrc Sync - stellt sicher, dass .npmrc immer aktuell ist
// Läuft automatisch bei verschiedenen Hooks

const fs = require('node:fs');
const path = require('node:path');

const npmrcPath = path.join(__dirname, '..', '.npmrc');

try {
  // Get current Electron version
  const electronPkg = require('../node_modules/electron/package.json');
  const electronVersion = electronPkg.version;
  
  console.log(`🔧 [npmrc-sync] Syncing .npmrc with Electron ${electronVersion}`);
  
  // Generate correct .npmrc content
  const correctContent = `runtime=electron
target=${electronVersion}
disturl=https://atom.io/download/atom-shell
build_from_source=true
`;

  // Check if .npmrc exists and has correct content
  let needsUpdate = false;
  
  if (!fs.existsSync(npmrcPath)) {
    console.log('📝 [npmrc-sync] Creating .npmrc...');
    needsUpdate = true;
  } else {
    const currentContent = fs.readFileSync(npmrcPath, 'utf8');
    if (!currentContent.includes(`target=${electronVersion}`)) {
      console.log('🔄 [npmrc-sync] Updating .npmrc target version...');
      needsUpdate = true;
    } else {
      console.log('✅ [npmrc-sync] .npmrc is up to date');
    }
  }
  
  if (needsUpdate) {
    fs.writeFileSync(npmrcPath, correctContent);
    console.log('✅ [npmrc-sync] .npmrc updated successfully');
    
    // Verify
    const newContent = fs.readFileSync(npmrcPath, 'utf8');
    if (newContent.includes(`target=${electronVersion}`)) {
      console.log('✅ [npmrc-sync] Verification passed');
    } else {
      console.error('❌ [npmrc-sync] Verification failed');
      process.exit(1);
    }
  }
  
} catch (error) {
  console.error('❌ [npmrc-sync] Failed:', error.message);
  process.exit(1);
}

console.log('✅ [npmrc-sync] Complete');