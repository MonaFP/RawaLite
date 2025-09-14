#!/usr/bin/env node
/**
 * Automatischer Version-Sync für RawaLite
 * Synchronisiert package.json Version mit VersionService.ts BASE_VERSION
 * 
 * Usage:
 *   node sync-versions.mjs                    # Interactive mode
 *   node sync-versions.mjs --version 1.7.0   # Set specific version
 *   node sync-versions.mjs --from-package    # Use package.json as source
 *   node sync-versions.mjs --from-service    # Use VersionService as source
 */

import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const args = process.argv.slice(2);

console.log('🔄 RawaLite Version Synchronizer');
console.log('================================\n');

// Helper Functions
function validateSemVer(version) {
  const semverPattern = /^\d+\.\d+\.\d+$/;
  return semverPattern.test(version);
}

function getCurrentDate() {
  return new Date().toISOString().split('T')[0]; // YYYY-MM-DD
}

function readCurrentVersions() {
  // package.json lesen
  const packageJsonPath = join(__dirname, 'package.json');
  const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
  const packageVersion = packageJson.version;

  // VersionService.ts lesen
  const versionServicePath = join(__dirname, 'src', 'services', 'VersionService.ts');
  const versionServiceContent = readFileSync(versionServicePath, 'utf-8');
  
  const baseVersionMatch = versionServiceContent.match(/private readonly BASE_VERSION = ['"`]([^'"`]+)['"`];/);
  const buildDateMatch = versionServiceContent.match(/private readonly BUILD_DATE = ['"`]([^'"`]+)['"`];/);
  
  if (!baseVersionMatch) {
    throw new Error('BASE_VERSION nicht in VersionService.ts gefunden');
  }

  return {
    packageVersion,
    baseVersion: baseVersionMatch[1],
    buildDate: buildDateMatch ? buildDateMatch[1] : null,
    versionServiceContent,
    versionServicePath,
    packageJsonPath,
    packageJson
  };
}

function updateVersionService(content, newVersion, newBuildDate) {
  // BASE_VERSION updaten
  content = content.replace(
    /private readonly BASE_VERSION = ['"`][^'"`]+['"`];/,
    `private readonly BASE_VERSION = '${newVersion}';`
  );
  
  // BUILD_DATE updaten
  content = content.replace(
    /private readonly BUILD_DATE = ['"`][^'"`]+['"`];/,
    `private readonly BUILD_DATE = '${newBuildDate}';`
  );
  
  return content;
}

function updatePackageJson(packageJson, newVersion) {
  packageJson.version = newVersion;
  return packageJson;
}

try {
  const current = readCurrentVersions();
  
  console.log('📊 Aktuelle Versionen:');
  console.log(`   package.json:     ${current.packageVersion}`);
  console.log(`   VersionService:   ${current.baseVersion}`);
  console.log(`   BUILD_DATE:       ${current.buildDate || 'nicht gefunden'}\n`);

  let targetVersion = null;
  let updateBuildDate = true;

  // Command Line Arguments parsen
  if (args.includes('--version')) {
    const versionIndex = args.indexOf('--version');
    if (versionIndex !== -1 && args[versionIndex + 1]) {
      targetVersion = args[versionIndex + 1];
      if (!validateSemVer(targetVersion)) {
        throw new Error(`Ungültiges Semantic Versioning Format: ${targetVersion}`);
      }
    }
  } else if (args.includes('--from-package')) {
    targetVersion = current.packageVersion;
    console.log(`🎯 Setze VersionService auf package.json Version: ${targetVersion}`);
  } else if (args.includes('--from-service')) {
    targetVersion = current.baseVersion;
    console.log(`🎯 Setze package.json auf VersionService Version: ${targetVersion}`);
  }

  // Wenn bereits synchron und keine spezifische Version angegeben
  if (!targetVersion && current.packageVersion === current.baseVersion) {
    console.log('✅ Versionen sind bereits synchron!');
    console.log('   Keine Aktion erforderlich.\n');
    
    console.log('💡 Verwendung für Updates:');
    console.log('   pnpm version:sync --version 1.7.0');
    console.log('   pnpm version:sync --from-package');
    console.log('   pnpm version:sync --from-service');
    process.exit(0);
  }

  // Interactive Mode wenn keine Argumente
  if (!targetVersion) {
    console.log('⚠️  Versionen sind nicht synchron!');
    console.log('   Wähle eine der Optionen:');
    console.log(`   1. Verwende package.json Version: ${current.packageVersion}`);
    console.log(`   2. Verwende VersionService Version: ${current.baseVersion}`);
    console.log('   3. Neue Version eingeben');
    console.log('\n   Tipp: Verwende Command Line Arguments für Automation');
    process.exit(1);
  }

  const newBuildDate = getCurrentDate();

  console.log(`🔄 Synchronisiere auf Version: ${targetVersion}`);
  console.log(`📅 Aktualisiere BUILD_DATE: ${newBuildDate}\n`);

  // package.json updaten
  const updatedPackageJson = updatePackageJson(current.packageJson, targetVersion);
  writeFileSync(current.packageJsonPath, JSON.stringify(updatedPackageJson, null, 2) + '\n');
  console.log('✅ package.json aktualisiert');

  // VersionService.ts updaten
  const updatedVersionService = updateVersionService(current.versionServiceContent, targetVersion, newBuildDate);
  writeFileSync(current.versionServicePath, updatedVersionService);
  console.log('✅ VersionService.ts aktualisiert');

  console.log('\n🎉 Version Synchronisation abgeschlossen!');
  console.log(`   Neue Version: ${targetVersion}`);
  console.log(`   BUILD_DATE: ${newBuildDate}`);
  
  console.log('\n📋 Nächste Schritte:');
  console.log('   1. git add -A && git commit -m "v' + targetVersion + ': Version bump"');
  console.log('   2. git tag v' + targetVersion);
  console.log('   3. git push origin main --tags');
  console.log('   4. pnpm build && pnpm dist  # Build new distributables');

} catch (error) {
  console.error('❌ Fehler beim Version-Sync:', error.message);
  process.exit(1);
}