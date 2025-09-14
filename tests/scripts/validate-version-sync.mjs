#!/usr/bin/env node
/**
 * Version Synchronisation Validator für RawaLite
 * Prüft ob package.json Version mit VersionService.ts BASE_VERSION synchron ist
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🔍 Version Synchronisation Validator');
console.log('====================================\n');

try {
  // 1. package.json Version lesen
  const packageJsonPath = join(__dirname, 'package.json');
  const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
  const packageVersion = packageJson.version;

  console.log(`📦 package.json Version: ${packageVersion}`);

  // 2. VersionService.ts BASE_VERSION extrahieren
  const versionServicePath = join(__dirname, 'src', 'services', 'VersionService.ts');
  const versionServiceContent = readFileSync(versionServicePath, 'utf-8');
  
  // Regex um BASE_VERSION zu finden
  const baseVersionMatch = versionServiceContent.match(/private readonly BASE_VERSION = ['"`]([^'"`]+)['"`];/);
  
  if (!baseVersionMatch) {
    throw new Error('❌ BASE_VERSION nicht in VersionService.ts gefunden');
  }

  const baseVersion = baseVersionMatch[1];
  console.log(`⚙️  VersionService BASE_VERSION: ${baseVersion}`);

  // 3. BUILD_DATE extrahieren (optional)
  const buildDateMatch = versionServiceContent.match(/private readonly BUILD_DATE = ['"`]([^'"`]+)['"`];/);
  const buildDate = buildDateMatch ? buildDateMatch[1] : 'nicht gefunden';
  console.log(`📅 VersionService BUILD_DATE: ${buildDate}\n`);

  // 4. Synchronisation prüfen
  if (packageVersion === baseVersion) {
    console.log('✅ SYNC: Versionen sind synchron!');
    console.log(`   Beide verwenden Version: ${packageVersion}\n`);
    
    // Zusätzliche Checks
    console.log('🔎 Zusätzliche Validierungen:');
    
    // Semantic Versioning Format prüfen
    const semverPattern = /^\d+\.\d+\.\d+$/;
    if (semverPattern.test(packageVersion)) {
      console.log('✅ Semantic Versioning Format korrekt (X.Y.Z)');
    } else {
      console.log('⚠️  Semantic Versioning Format ungewöhnlich');
    }
    
    // BUILD_DATE Format prüfen
    const datePattern = /^\d{4}-\d{2}-\d{2}$/;
    if (buildDate !== 'nicht gefunden' && datePattern.test(buildDate)) {
      console.log('✅ BUILD_DATE Format korrekt (YYYY-MM-DD)');
    } else if (buildDate !== 'nicht gefunden') {
      console.log('⚠️  BUILD_DATE Format ungewöhnlich');
    }
    
    process.exit(0);
  } else {
    console.log('❌ DESYNC: Versionen sind nicht synchron!');
    console.log(`   package.json:     ${packageVersion}`);
    console.log(`   VersionService:   ${baseVersion}\n`);
    
    console.log('🔧 Lösungsvorschläge:');
    console.log('1. VersionService.ts BASE_VERSION anpassen:');
    console.log(`   private readonly BASE_VERSION = '${packageVersion}';`);
    console.log('2. Oder package.json Version anpassen:');
    console.log(`   "version": "${baseVersion}"`);
    
    process.exit(1);
  }

} catch (error) {
  console.error('❌ Fehler beim Version-Check:', error.message);
  process.exit(1);
}