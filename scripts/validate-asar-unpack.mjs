import fs from 'node:fs';

const pathYml = 'electron-builder.yml';
if (!fs.existsSync(pathYml)) {
  console.error('[validate:asar] electron-builder.yml nicht gefunden.');
  process.exit(1);
}

const yml = fs.readFileSync(pathYml,'utf8');
const ok = /asarUnpack:\s*-\s*node_modules\/better-sqlite3\/\*\*\/\*/m.test(yml);
if (!ok) {
  console.error("[validate:asar] 'better-sqlite3' fehlt in asarUnpack.");
  process.exit(1);
}
console.log('[validate:asar] OK');