/**
 * IPC Type Validation Script für RawaLite
 * Prüft ob alle IPC-Calls typsicher sind
 */

import { readFileSync } from 'fs';
import { join } from 'path';

console.log('🔍 IPC Type Safety Validator');
console.log('============================\n');

// 1. Preload.ts analysieren
const preloadPath = join(process.cwd(), 'electron', 'preload.ts');
const preloadContent = readFileSync(preloadPath, 'utf-8');

console.log('📋 Preload.ts Analyse:');

// Strict Type Imports prüfen
const hasStrictTypes = preloadContent.includes("import type {");
console.log(`  Strikte Type Imports: ${hasStrictTypes ? '✅' : '❌'}`);

// Any-Types zählen
const anyMatches = preloadContent.match(/:\s*any/g) || [];
console.log(`  'any' Types gefunden: ${anyMatches.length}`);

// Typed APIs prüfen
const hasTypedAPIs = preloadContent.includes('RawaliteAPI') && preloadContent.includes('ElectronAPI');
console.log(`  Typed API Interfaces: ${hasTypedAPIs ? '✅' : '❌'}`);

console.log('\n📊 IPC Channel Coverage:');

// IPC Channels extrahieren
const ipcInvokes = preloadContent.match(/ipcRenderer\.invoke\(['"`]([^'"`]+)['"`]/g) || [];
const channels = ipcInvokes.map(match => match.match(/['"`]([^'"`]+)['"`]/)?.[1]).filter(Boolean);

console.log(`  Gefundene IPC Channels: ${channels.length}`);
channels.forEach(channel => console.log(`    - ${channel}`));

// 2. Main.ts analysieren
const mainPath = join(process.cwd(), 'electron', 'main.ts');
const mainContent = readFileSync(mainPath, 'utf-8');

console.log('\n📋 Main.ts Analyse:');

// IPC Handlers zählen
const ipcHandlers = mainContent.match(/ipcMain\.handle\(/g) || [];
console.log(`  IPC Handlers: ${ipcHandlers.length}`);

// Type Imports prüfen
const mainHasTypes = mainContent.includes("import type");
console.log(`  Type Imports: ${mainHasTypes ? '✅' : '❌'}`);

// 3. Konsistenz-Check
console.log('\n🔍 Konsistenz-Analyse:');

const expectedChannels = [
  'db:load', 'db:save',
  'app:restart', 'app:getVersion',
  'shell:openExternal',
  'updater:check-for-updates', 'updater:start-download', 'updater:install-and-restart', 'updater:get-version',
  'pdf:generate', 'pdf:getStatus'
];

const missingChannels = expectedChannels.filter(channel => !channels.includes(channel));
const extraChannels = channels.filter(channel => !expectedChannels.includes(channel));

if (missingChannels.length === 0 && extraChannels.length === 0) {
  console.log('  ✅ Alle erwarteten IPC Channels vorhanden');
} else {
  if (missingChannels.length > 0) {
    console.log(`  ❌ Fehlende Channels: ${missingChannels.join(', ')}`);
  }
  if (extraChannels.length > 0) {
    console.log(`  ⚠️  Zusätzliche Channels: ${extraChannels.join(', ')}`);
  }
}

// 4. Empfehlungen
console.log('\n💡 Empfehlungen:');

if (anyMatches.length > 0) {
  console.log(`  - Ersetze ${anyMatches.length} 'any' Types durch spezifische Interfaces`);
}

if (!hasStrictTypes) {
  console.log('  - Füge strikte Type Imports hinzu');
}

if (!mainHasTypes) {
  console.log('  - Erweitere main.ts um Type Imports für bessere Type Safety');
}

console.log('\n🎯 Type Safety Score:', 
  Math.round(((hasStrictTypes ? 30 : 0) + 
              (hasTypedAPIs ? 30 : 0) + 
              (anyMatches.length === 0 ? 40 : Math.max(0, 40 - anyMatches.length * 10))) * 1) + '%');

console.log('\n✅ IPC Type Validation abgeschlossen');