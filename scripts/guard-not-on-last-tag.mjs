import { execSync } from "node:child_process";
import { readFile } from "node:fs/promises";

function sh(cmd) {
  return execSync(cmd, { encoding: "utf8" }).trim();
}

try {
  const pkg = JSON.parse(await readFile("package.json","utf8"));
  const current = pkg.version;

  // letzten Tag holen (falls keiner: ok)
  let lastTag = "";
  try { lastTag = sh("git describe --tags --abbrev=0"); } catch {}

  if (!lastTag) {
    console.log("Kein Tag vorhanden – Guard übersprungen.");
    process.exit(0);
  }

  // v1.8.5 → 1.8.5
  if (lastTag.startsWith("v")) lastTag = lastTag.slice(1);

  if (lastTag === current) {
    console.error(`❌ Version ${current} ist identisch mit letztem Tag v${lastTag}. Bitte zuerst bumpen (pnpm version:bump …).`);
    process.exit(2);
  }

  console.log(`OK: package.json=${current} ist != letztem Tag v${lastTag}.`);
} catch (e) {
  console.error("Guard-Fehler:", e.message);
  process.exit(3);
}
