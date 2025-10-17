import { createRequire } from 'node:module';
const requireModule = createRequire(import.meta.url);

const critical = ['better-sqlite3']; // ggf. erweitern
let fail = false;

for (const mod of critical) {
  try {
    requireModule(mod);
    console.log(`[guard:native] OK: ${mod}`);
  } catch (e) {
    fail = true;
    console.error(`[guard:native] FAIL '${mod}': ${e.code || e.name} - ${e.message}`);
  }
}
if (fail) process.exit(1);