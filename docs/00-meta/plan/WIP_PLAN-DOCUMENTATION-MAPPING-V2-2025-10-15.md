SYSTEM:
Du bist ein technischer Dokumentations-Refaktor-Assistent für das Projekt RawaLite.
Arbeite deterministisch, ohne kreative Abweichungen.

Ziele:
- Reorganisiere docs/ gemäß Mapping-Tabelle (Alt→Neu) unten.
- Erhalte Dateinamen, verschiebe nur Pfade.
- Bewahre Präfixe (VALIDATED-, SOLVED-, DEPRECATED-, WIP_).
- Erzeuge/aktualisiere INDEX.md in jedem Top-Level-Bereich (final/plan/wip/sessions).
- Aktualisiere DOCS_SITEMAP.md (Kurzüberblick: Bereich, Dateien, letzte Änderung, Status).
- Gib am Ende einen Markdown-Tree der neuen Struktur aus.

REGELN:
- Keine Inhalte verändern.
- Keine doppelten Dateien erzeugen.
- Fehlende Unterordner anlegen.
- Wenn eine Alt-Datei keinem Mapping zugeordnet werden kann: am Ende „UNMAPPED“ tabellarisch aufführen.

INPUT (Mapping-Tabelle Alt→Neu):
#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(process.cwd(), 'docs');
const APPLY = process.argv.includes('--apply'); // optional: Dateien verschieben

// Regeln: Altordner → Neu (Top-Level v2)
const MAP = new Map([
  ['00-meta','00-meta'],
  ['01-standards','01-core'],
  ['02-architecture','01-core'],
  ['03-development','02-dev'],
  ['04-testing','02-dev'],
  ['05-database','03-data'],
  ['06-paths','01-core'],
  ['07-ipc','01-core'],
  ['08-ui','04-ui'],
  ['09-pdf','04-ui'],
  ['10-security','01-core'],
  ['11-deployment','05-deploy'],
  ['12-update-manager','05-deploy'],
  ['13-deprecated','06-lessons/deprecated'],
  ['14-implementations','02-dev/final'],
  ['15-session-summary','06-lessons/sessions']
]);

function targetSubdir(name) {
  // Erhalte Unterstruktur final/plan/wip/sessions aus altem Pfad
  // Defaults: lose Dateien → final
  const low = name.toLowerCase();
  if (low.includes('/final/')) return 'final';
  if (low.includes('/plan/')) return 'plan';
  if (low.includes('/wip/')) return 'wip';
  if (low.includes('/sessions/')) return 'sessions';
  return 'final';
}

function* walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) { yield* walk(p); }
    else if (entry.isFile() && p.toLowerCase().endsWith('.md')) { yield p; }
  }
}

const rows = [];
for (const [srcTop, dstTop] of MAP.entries()) {
  const srcDir = path.join(ROOT, srcTop);
  if (!fs.existsSync(srcDir)) continue;
  for (const fp of walk(srcDir)) {
    const rel = path.relative(ROOT, fp).replaceAll('\\','/');
    const sub = targetSubdir(rel);
    const file = path.basename(fp);
    const dst = path.join(ROOT, dstTop, sub, file);

    rows.push({ old: rel, new: dst.replaceAll('\\','/') });
  }
}

// Ausgabe als Markdown-Tabelle
const md = [
  '# Mapping Alt → Neu (v2)',
  '',
  '| Alt | Neu |',
  '|---|---|',
  ...rows.map(r => `| ${r.old} | ${r.new} |`),
  ''
].join('\n');

const outDir = path.resolve(process.cwd(), 'docs/00-meta/plan');
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, 'DOCUMENTATION-MAPPING-v2.md'), md, 'utf8');
console.log('✅ Mapping geschrieben nach docs/00-meta/plan/DOCUMENTATION-MAPPING-v2.md');
console.log(`Anzahl Dateien: ${rows.length}`);

// Optional: anwenden
if (APPLY) {
  for (const r of rows) {
    const src = path.join(ROOT, r.old);
    const dst = path.join(r.new);
    const dstDir = path.dirname(dst);
    fs.mkdirSync(dstDir, { recursive: true });
    fs.renameSync(src, dst);
  }
  console.log('🚚 Dateien verschoben (--apply). Bitte Links prüfen & Index neu generieren.');
}


OUTPUT:
1) Bestätigungs-Log verschobener Dateien (Alt → Neu)
2) Neue Ordnerstruktur als Markdown-Tree
3) Aktualisierte DOCS_SITEMAP.md (Vorschau)
4) Liste UNMAPPED (falls vorhanden)
