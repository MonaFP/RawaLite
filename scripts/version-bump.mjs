import { readFile, writeFile, access } from "node:fs/promises";
import { constants as FS } from "node:fs";

const PKG_PATH = "package.json";
const SERVICE_PATH = "src/services/VersionService.ts";
const ISO_DATE = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

function isSemver(v) {
  return /^\d+\.\d+\.\d+(?:-[0-9A-Za-z-.]+)?$/.test(v);
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
  const clearPre = () => (s.pre = "");
  switch (type) {
    case "major": s.major += 1; s.minor = 0; s.patch = 0; clearPre(); break;
    case "minor": s.minor += 1; s.patch = 0; clearPre(); break;
    case "patch": s.patch += 1; clearPre(); break;
    case "prerelease":
      if (!preid) throw new Error("prerelease needs --preid <tag>");
      if (!s.pre) { s.patch += 1; s.pre = `${preid}.0`; }
      else {
        const [id, num] = s.pre.split(".");
        s.pre = id === preid && !Number.isNaN(+num) ? `${id}.${+num + 1}` : `${preid}.0`;
      }
      break;
    default: throw new Error(`Unknown bump type: ${type}`);
  }
  return toSemver(s);
}
async function exists(p){ try{ await access(p,FS.F_OK); return true;}catch{ return false;} }

function compareSemver(a, b) {
  const A = parseSemver(a), B = parseSemver(b);
  if (A.major !== B.major) return A.major > B.major ? 1 : -1;
  if (A.minor !== B.minor) return A.minor > B.minor ? 1 : -1;
  if (A.patch !== B.patch) return A.patch > B.patch ? 1 : -1;
  if (A.pre && !B.pre) return -1;
  if (!A.pre && B.pre) return 1;
  return A.pre === B.pre ? 0 : (A.pre > B.pre ? 1 : -1);
}

async function main() {
  const args = process.argv.slice(2);
  if (!args.length) {
    console.error("Usage: pnpm version:bump <patch|minor|major|prerelease|X.Y.Z> [--dry-run] [--preid alpha]");
    process.exit(1);
  }
  const target = args[0];
  const dryRun = args.includes("--dry-run");
  const preid = (() => {
    const i = args.indexOf("--preid");
    return i >= 0 ? args[i+1] : undefined;
  })();

  // package.json lesen
  const pkgRaw = await readFile(PKG_PATH, "utf8");
  const pkg = JSON.parse(pkgRaw);
  const current = pkg.version;
  if (!isSemver(current)) throw new Error(`package.json version is not semver: ${current}`);

  // Zielversion berechnen
  const next = ["patch","minor","major","prerelease"].includes(target)
    ? incSemver(current, target, preid)
    : (isSemver(target) ? target : (()=>{ throw new Error(`Invalid target version: ${target}`) })());

  if (next === current) {
    console.log(`[Info] Version unchanged (${current})`);
    process.exit(0);
  }

  // package.json schreiben
  const newPkg = { ...pkg, version: next };
  const pkgOut = JSON.stringify(newPkg, null, 2) + "\n";

  // VersionService.ts -> nur BUILD_DATE aktualisieren, BASE_VERSION gibt es NICHT mehr
  let serviceOut = null;
  let buildDateBefore = null;
  if (await exists(SERVICE_PATH)) {
    const serviceRaw = await readFile(SERVICE_PATH, "utf8");
    const hasBuildDate = /BUILD_DATE\s*=/.test(serviceRaw);
    if (hasBuildDate) {
      buildDateBefore = (serviceRaw.match(/BUILD_DATE\s*=\s*["'](\d{4}-\d{2}-\d{2})["']/)?.[1]) ?? null;
      serviceOut = serviceRaw.replace(
        /BUILD_DATE\s*=\s*["']\d{4}-\d{2}-\d{2}["']/,
        `BUILD_DATE = "${ISO_DATE}"`
      );
    } else {
      // BUILD_DATE nicht vorhanden, aber das ist OK - wir modifizieren nicht
      serviceOut = serviceRaw; // Datei unverändert lassen
    }
    
    // Package.json Fallback Version auch aktualisieren (falls vorhanden)
    if (serviceOut && /return\s+["']\d+\.\d+\.\d+["'];.*\/\/.*package\.json.*fallback/i.test(serviceOut)) {
      serviceOut = serviceOut.replace(
        /return\s+["'](\d+\.\d+\.\d+)["'];(.*)\/\/.*package\.json.*fallback/i,
        `return "${next}"; $2// Current package.json version as absolute fallback`
      );
    }
  }

  console.log("— Version-Bump —");
  console.log(`  package.json: ${current} → ${next}`);
  if (serviceOut !== null) {
    console.log(`  BUILD_DATE:   ${buildDateBefore ?? "(n/a)"} → ${ISO_DATE}`);
  }
  if (dryRun) {
    console.log("\n[Dry-Run] No files written.");
    return;
  }

  await writeFile(PKG_PATH, pkgOut, "utf8");
  if (serviceOut !== null) {
    await writeFile(SERVICE_PATH, serviceOut, "utf8");
  }

  // Post-check
  const verify = JSON.parse(await readFile(PKG_PATH, "utf8")).version;
  if (verify !== next) throw new Error("Post-write verification failed for package.json");

  console.log("\n✅ Bumped & synced (pkg + BUILD_DATE).");
  console.log(`git add -A && git commit -m "v${next}: bump" && git tag v${next}`);
  console.log("pnpm build && pnpm lint && pnpm typecheck");
}

main().catch(e => { console.error("❌ Fehler:", e.message); process.exit(1); });
