#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

// Read migration index
const indexPath = 'src/main/db/migrations/index.ts';
const indexContent = fs.readFileSync(indexPath, 'utf8');

// Extract all imports
const importMatches = indexContent.match(/import \* as migration\d+ from '\.\/(.*?)';/g) || [];
const imports = importMatches.map(match => {
  const parts = match.match(/migration(\d+) from '\.\/(.*?)'/);
  return { version: parseInt(parts[1]), file: parts[2] };
});

// Extract all migration definitions  
const defMatches = indexContent.match(/version: (\d+),\s*name: '([^']+)'/g) || [];
const definitions = defMatches.map(match => {
  const parts = match.match(/version: (\d+),\s*name: '([^']+)'/);
  return { version: parseInt(parts[1]), name: parts[2] };
});

console.log('🔍 MIGRATION AUDIT RESULTS:');
console.log('==========================================');

console.log('\n📁 IMPORTS (', imports.length, 'total):');
imports.forEach(imp => {
  console.log(`   ${imp.version.toString().padStart(3, '0')}: ${imp.file}`);
});

console.log('\n📋 DEFINITIONS (', definitions.length, 'total):');
definitions.forEach(def => {
  console.log(`   ${def.version.toString().padStart(3, ' ')}: ${def.name}`);
});

console.log('\n⚠️  MISMATCHES:');
let mismatchCount = 0;
imports.forEach(imp => {
  const def = definitions.find(d => d.version === imp.version);
  if (!def) {
    console.log(`   Missing definition for version ${imp.version} (import: ${imp.file})`);
    mismatchCount++;
  } else if (def.name !== imp.file) {
    console.log(`   Version ${imp.version}: import='${imp.file}' vs name='${def.name}'`);
    mismatchCount++;
  }
});

// Check for missing sequential numbers
const importVersions = imports.map(i => i.version).sort((a,b) => a-b);
const defVersions = definitions.map(d => d.version).sort((a,b) => a-b);

console.log('\n🔢 VERSION GAPS:');
for (let i = 1; i <= Math.max(...importVersions); i++) {
  if (!importVersions.includes(i)) {
    console.log(`   Missing import version: ${i}`);
  }
  if (!defVersions.includes(i)) {
    console.log(`   Missing definition version: ${i}`);
  }
}

const maxVersion = Math.max(...defVersions);
console.log(`\n✅ Highest migration version: ${maxVersion}`);

if (mismatchCount > 0) {
  console.log(`\n🚨 CRITICAL: ${mismatchCount} mismatches found!`);
  process.exit(1);
} else {
  console.log('\n✅ All imports match definitions');
}