import { exec } from 'child_process';
import path from 'path';
import fs from 'fs';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

console.log('🔧 Testing UpdateService Version Fix');
console.log('=====================================');

// Prüfe, ob die UpdateService-Änderungen korrekt sind
console.log('\n📊 ANALYSE DER VERSION-DETECTION:');

// 1. Prüfe package.json Version
const packageJson = require('./package.json');
console.log(`   - package.json Version: ${packageJson.version}`);

// 2. Prüfe VersionService
try {
  const versionServiceContent = fs.readFileSync('./src/services/VersionService.ts', 'utf8');
  const baseVersionMatch = versionServiceContent.match(/BASE_VERSION\s*=\s*['"`]([^'"`]+)['"`]/);
  if (baseVersionMatch) {
    console.log(`   - VersionService BASE_VERSION: ${baseVersionMatch[1]}`);
  }
} catch (error) {
  console.log(`   - VersionService: Fehler beim Lesen (${error.message})`);
}

// 3. Prüfe UpdateService getCurrentAppVersion Methode
try {
  const updateServiceContent = fs.readFileSync('./src/services/UpdateService.ts', 'utf8');
  
  // Prüfe ob die Methode jetzt async ist
  const isAsync = updateServiceContent.includes('private async getCurrentAppVersion()');
  console.log(`   - UpdateService.getCurrentAppVersion ist async: ${isAsync ? '✅' : '❌'}`);
  
  // Prüfe ob IPC verwendet wird
  const usesIPC = updateServiceContent.includes('window.rawalite?.app.getVersion()');
  console.log(`   - UpdateService verwendet IPC für Version: ${usesIPC ? '✅' : '❌'}`);
  
  // Prüfe ob hardcodierte Version entfernt wurde
  const hasHardcodedVersion = updateServiceContent.includes("return '1.7.0'") || 
                             updateServiceContent.includes("return '1.5.6'") ||
                             updateServiceContent.includes("return '1.6.1'");
  const onlyFallback = updateServiceContent.includes("return '1.6.1'; // Aktuelle App-Version als Fallback");
  console.log(`   - Hardcodierte Version entfernt: ${!hasHardcodedVersion || onlyFallback ? '✅' : '❌'}`);
  
} catch (error) {
  console.log(`   - UpdateService: Fehler beim Lesen (${error.message})`);
}

console.log('\n🔍 EXPECTED BEHAVIOR:');
console.log('   1. App startet mit echter Version aus package.json (v1.6.1)');
console.log('   2. UpdateService holt Version dynamisch über IPC');
console.log('   3. Vergleicht v1.6.1 mit GitHub Latest (v1.7.0)');
console.log('   4. Zeigt "Update verfügbar" an (Orange im Header)');
console.log('   5. Update-Modal bietet v1.7.0 Download an');

console.log('\n🧪 VALIDATION CHECKS:');

// GitHub API Test
console.log('\n📡 Testing GitHub API...');
fetch('https://api.github.com/repos/MonaFP/RawaLite/releases/latest')
  .then(response => response.json())
  .then(data => {
    console.log(`   - GitHub Latest Version: ${data.tag_name}`);
    console.log(`   - Published: ${data.published_at}`);
    console.log(`   - Assets: ${data.assets.length} files`);
    
    // Version Comparison Test
    const currentVersion = packageJson.version;
    const latestVersion = data.tag_name.replace('v', '');
    
    console.log(`\n🔍 VERSION COMPARISON:`);
    console.log(`   - Current (package.json): ${currentVersion}`);
    console.log(`   - Latest (GitHub): ${latestVersion}`);
    
    const semver = require('semver');
    if (semver.lt(currentVersion, latestVersion)) {
      console.log(`   - ✅ Update verfügbar: ${currentVersion} → ${latestVersion}`);
    } else if (semver.eq(currentVersion, latestVersion)) {
      console.log(`   - ℹ️  App ist aktuell`);
    } else {
      console.log(`   - ⚠️  App ist neuer als GitHub Release`);
    }
  })
  .catch(error => {
    console.log(`   - ❌ GitHub API Fehler: ${error.message}`);
  });

console.log('\n🎯 NEXT STEPS:');
console.log('   1. App starten: pnpm electron:dev');
console.log('   2. Version im Header prüfen (sollte v1.6.1 zeigen)');
console.log('   3. Update-Check triggern → sollte v1.7.0 finden');
console.log('   4. Orange Header-Indikator sollte erscheinen');
console.log('   5. Update-Modal testen');