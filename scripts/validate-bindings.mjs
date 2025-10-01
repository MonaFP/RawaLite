import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const suspects = ['better-sqlite3']; // ggf. erweitern

let fail = false;
const hasBindings = fs.existsSync(path.join(root, 'node_modules', 'bindings', 'package.json'));

for (const pkg of suspects) {
  const pj = path.join(root, 'node_modules', pkg, 'package.json');
  if (!fs.existsSync(pj)) continue;
  const src = fs.readFileSync(pj, 'utf8');
  if (/node-gyp|bindings|prebuild(-ify)?/i.test(src) && !hasBindings) {
    console.error(`[guard:native] '${pkg}' deutet auf 'bindings' hin – Paket 'bindings' fehlt.`);
    fail = true;
  }
}
if (fail) process.exit(1);
console.log('[guard:native] bindings-Check OK');