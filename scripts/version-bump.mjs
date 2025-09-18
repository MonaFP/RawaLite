// Node 20+, ESM. PNPM-only.
// Usage:
//   pnpm version:bump patch
//   pnpm version:bump minor
//   pnpm version:bump major
//   pnpm version:bump 1.7.0
//   pnpm version:bump patch --dry-run
// Optional: --preid alpha (für 1.7.0-alpha.0)
//
// Effekt:
// - package.json: version wird erhöht/gesetzt
// - src/services/VersionService.ts: BASE_VERSION & BUILD_DATE werden synchronisiert
// - Sicherheitschecks: Semver-Validierung, Konsistenzprüfung

import { readFile, writeFile, access } from "node:fs/promises";
import { constants as FS } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PROJECT_ROOT = path.resolve(__dirname, "..");
const PKG_PATH = path.join(PROJECT_ROOT, "package.json");
const SERVICE_PATH = path.join(PROJECT_ROOT, "src", "services", "VersionService.ts");

// ----- helpers -----

const ISO_DATE = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

function isSemver(v) {
  // very small semver check: 1.2.3 or 1.2.3-prerelease.1
  return /^\d+\.\d+\.\d+(-[0-9A-Za-z-.]+)?$/.test(v);
}

function parseSemver(v) {
  const [core, pre = ""] = v.split("-");
  const [major, minor, patch] = core.split(".").map(Number);
  return { major, minor, patch, pre };
}

function toSemver({ major, minor, patch, pre }) {
  return `${major}.${minor}.${patch}${pre ? "-" + pre : ""}`;
}

function incSemver(current, type, preid) {
  const s = parseSemver(current);

  const clearPre = () => { s.pre = ""; };

  switch (type) {
    case "major":
      s.major += 1; s.minor = 0; s.patch = 0; clearPre(); break;
    case "minor":
      s.minor += 1; s.patch = 0; clearPre(); break;
    case "patch":
      s.patch += 1; clearPre(); break;
    case "prerelease": {
      // 1.7.0 -> 1.7.1-alpha.0 if no pre; if pre exists and matches id -> bump numeric
      if (!preid) throw new Error("prerelease bump requires --preid <tag>");
      if (!s.pre) {
        s.patch += 1;
        s.pre = `${preid}.0`;
      } else {
        const [id, num] = s.pre.split(".");
        if (id !== preid || isNaN(Number(num))) {
          s.pre = `${preid}.0`;
        } else {
          s.pre = `${id}.${Number(num) + 1}`;
        }
      }
      break;
    }
    default:
      throw new Error(`Unknown bump type: ${type}`);
  }
  return toSemver(s);
}

async function ensureFile(p) {
  try { await access(p, FS.F_OK); }
  catch { throw new Error(`Datei fehlt: ${p}`); }
}

function replaceOnce(src, pattern, value) {
  if (!pattern.test(src)) {
    throw new Error(`Erwartetes Pattern nicht gefunden:\n${pattern}`);
  }
  return src.replace(pattern, value);
}

function extractBaseVersionFromService(content) {
  const m = content.match(/BASE_VERSION\s*=\s*['"](\d+\.\d+\.\d(?:-[0-9A-Za-z-.]+)?)['"]/);
  return m?.[1] ?? null;
}

function extractBuildDateFromService(content) {
  const m = content.match(/BUILD_DATE\s*=\s*['"](\d{4}-\d{2}-\d{2})['"]/);
  return m?.[1] ?? null;
}

// ----- main -----

async function main() {
  const args = process.argv.slice(2);
  if (args.length < 1) {
    console.error("Usage: pnpm version:bump <patch|minor|major|prerelease|X.Y.Z> [--dry-run] [--preid alpha]");
    process.exit(1);
  }

  let target = args[0];
  const dryRun = args.includes("--dry-run");
  const preidFlagIdx = args.indexOf("--preid");
  const preid = preidFlagIdx >= 0 ? args[preidFlagIdx + 1] : undefined;

  await ensureFile(PKG_PATH);
  await ensureFile(SERVICE_PATH);

  const pkgRaw = await readFile(PKG_PATH, "utf8");
  const pkg = JSON.parse(pkgRaw);
  const currentPkgVersion = pkg.version;

  if (!isSemver(currentPkgVersion)) {
    throw new Error(`package.json version ist kein gültiges Semver: ${currentPkgVersion}`);
  }

  const serviceRaw = await readFile(SERVICE_PATH, "utf8");
  const currentServiceVersion = extractBaseVersionFromService(serviceRaw);

  if (!currentServiceVersion) {
    throw new Error(`BASE_VERSION in VersionService.ts nicht gefunden.`);
  }
  if (!isSemver(currentServiceVersion)) {
    throw new Error(`VersionService BASE_VERSION ist kein gültiges Semver: ${currentServiceVersion}`);
  }

  // Entscheide neue Version
  let nextVersion;
  if (["patch", "minor", "major", "prerelease"].includes(target)) {
    // nimm die höhere der beiden als Basis, um "Zurückstufen" zu vermeiden
    const basis = (compareSemver(currentPkgVersion, currentServiceVersion) >= 0)
      ? currentPkgVersion
      : currentServiceVersion;
    nextVersion = incSemver(basis, target, preid);
  } else {
    // direkte Angabe X.Y.Z
    if (!isSemver(target)) {
      throw new Error(`Ungültige Zielversion: ${target}`);
    }
    nextVersion = target;
  }

  // Idempotenz: wenn next == current -> Hinweis
  if (nextVersion === currentPkgVersion && nextVersion === currentServiceVersion) {
    console.log(`[Info] Zielversion entspricht bereits dem Status: ${nextVersion}`);
    process.exit(0);
  }

  // package.json aktualisieren
  const newPkg = { ...pkg, version: nextVersion };
  const pkgOut = JSON.stringify(newPkg, null, 2) + "\n";

  // VersionService.ts aktualisieren
  let serviceOut = serviceRaw;
  serviceOut = replaceOnce(
    serviceOut,
    /BASE_VERSION\s*=\s*['"]\d+\.\d+\.\d(?:-[0-9A-Za-z-.]+)?['"]/,
    `BASE_VERSION = '${nextVersion}'`
  );

  // BUILD_DATE (sofern vorhanden) setzen/aktualisieren – ansonsten optional einfügen
  if (/BUILD_DATE\s*=/.test(serviceOut)) {
    serviceOut = replaceOnce(
      serviceOut,
      /BUILD_DATE\s*=\s*['"]\d{4}-\d{2}-\d{2}['"]/,
      `BUILD_DATE = '${ISO_DATE}'`
    );
  } else {
    // Füge BUILD_DATE direkt hinter BASE_VERSION ein (konservativ)
    serviceOut = serviceOut.replace(
      /BASE_VERSION\s*=\s*['"]\d+\.\d+\.\d(?:-[0-9A-Za-z-.]+)?['"]\s*;?/,
      (m) => `${m}\nexport const BUILD_DATE = '${ISO_DATE}';`
    );
  }

  // Dry run?
  console.log("— Version-Bump —");
  console.log(`  package.json:     ${currentPkgVersion} → ${nextVersion}`);
  console.log(`  VersionService.ts:${currentServiceVersion} → ${nextVersion}`);
  const existingBuildDate = extractBuildDateFromService(serviceRaw);
  console.log(`  BUILD_DATE:       ${existingBuildDate ?? "(neu)"} → ${ISO_DATE}`);
  if (dryRun) {
    console.log("\n[Dry-Run] Keine Dateien geschrieben.");
    return;
  }

  await writeFile(PKG_PATH, pkgOut, "utf8");
  await writeFile(SERVICE_PATH, serviceOut, "utf8");

  // Post-Check
  const postService = await readFile(SERVICE_PATH, "utf8");
  const synced = extractBaseVersionFromService(postService) === nextVersion && JSON.parse(await readFile(PKG_PATH, "utf8")).version === nextVersion;

  if (!synced) {
    throw new Error("Nach dem Schreiben sind die Versionen nicht synchron. Bitte prüfen.");
  }

  console.log("\n✅ Versionen erfolgreich aktualisiert & synchronisiert.");
  console.log("Tipp: Commit + Tag setzen:");
  console.log(`   git add -A && git commit -m "v${nextVersion}: bump" && git tag v${nextVersion}`);
  console.log("   pnpm build && pnpm lint && pnpm typecheck");
}

// Semver Compare: returns -1,0,1 (ignores prerelease weight mostly; simple compare)
function compareSemver(a, b) {
  const A = parseSemver(a);
  const B = parseSemver(b);
  if (A.major !== B.major) return A.major > B.major ? 1 : -1;
  if (A.minor !== B.minor) return A.minor > B.minor ? 1 : -1;
  if (A.patch !== B.patch) return A.patch > B.patch ? 1 : -1;
  // Treat prerelease as lower weight than stable
  if (A.pre && !B.pre) return -1;
  if (!A.pre && B.pre) return 1;
  if (A.pre === B.pre) return 0;
  return A.pre > B.pre ? 1 : (A.pre < B.pre ? -1 : 0);
}

main().catch((err) => {
  console.error("❌ Fehler:", err.message);
  process.exit(1);
});
