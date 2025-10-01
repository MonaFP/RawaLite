import { execSync } from 'node:child_process';
import fs from 'node:fs';

const pkg = JSON.parse(fs.readFileSync('package.json','utf8'));
const electronVersion = (pkg.devDependencies && pkg.devDependencies.electron) || (pkg.dependencies && pkg.dependencies.electron);

if (!electronVersion) {
  console.warn('[validate:electron-abi] Keine Electron-Version gefunden.');
  process.exit(0);
}

try {
  const ver = electronVersion.replace(/^[^0-9.]*/, '');
  const cmd = `node -e "console.log(require('node-abi').getAbi('${ver}', 'electron'))"`;
  const out = execSync(cmd).toString().trim();
  console.log('[validate:electron-abi] Electron ABI:', out);
} catch {
  console.error('[validate:electron-abi] Fehler bei ABI-Bestimmung. Fehlt devDep \'node-abi\'?');
  process.exit(1);
}