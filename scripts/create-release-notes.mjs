#!/usr/bin/env node

/**
 * Script to create a new release notes file based on the template
 * Usage: pnpm create:release-notes <version> [title]
 * Example: pnpm create:release-notes 1.8.92 "Bug Fixes & Performance"
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline';

// Resolve paths properly in ES modules
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, '..');
const docsDir = path.join(projectRoot, 'docs', 'releases');
const templatePath = path.join(docsDir, 'TEMPLATE.md');

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Date formatting helper
function formatDate() {
  const date = new Date();
  return `${date.getDate()}. ${['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 
    'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'][date.getMonth()]} ${date.getFullYear()}`;
}

async function promptInput(question) {
  return new Promise(resolve => {
    rl.question(question, answer => {
      resolve(answer);
    });
  });
}

async function createReleaseNotes() {
  try {
    // Get version from arguments or prompt
    let version = process.argv[2];
    if (!version) {
      version = await promptInput('Bitte gib die Versionsnummer ein (z.B. 1.8.92): ');
      if (!version) {
        console.error('❌ Keine Version angegeben!');
        process.exit(1);
      }
    }
    
    // Format version to ensure correct format (add v prefix if missing)
    if (!version.startsWith('v') && !version.startsWith('V')) {
      version = `v${version}`;
    }
    
    // Normalize version number format
    version = version.replace(/^[vV]/, '').trim();
    
    // Get title from arguments or prompt
    let title = process.argv[3];
    if (!title) {
      title = await promptInput('Bitte gib den Titel für dieses Release ein: ');
      if (!title) {
        console.log('⚠️ Kein Titel angegeben, verwende Standard-Titel...');
        title = 'Feature Update & Bug Fixes';
      }
    }
    
    // Determine filename
    const fileName = `RELEASE_NOTES_V${version.replace(/\./g, '')}.md`;
    const filePath = path.join(docsDir, fileName);
    
    // Check if file already exists
    try {
      await fs.access(filePath);
      const overwrite = await promptInput(`⚠️ Die Datei ${fileName} existiert bereits. Überschreiben? (j/n): `);
      if (overwrite.toLowerCase() !== 'j') {
        console.log('❌ Operation abgebrochen.');
        process.exit(0);
      }
    } catch (err) {
      // File doesn't exist, which is good
    }
    
    // Read template
    const templateExists = await fs.access(templatePath).then(() => true).catch(() => false);
    let template;
    
    if (templateExists) {
      template = await fs.readFile(templatePath, 'utf8');
    } else {
      console.log('⚠️ Template nicht gefunden, verwende einfaches Template...');
      template = `# RawaLite ${version} - {TITLE}

## 🔧 Verbesserungen

- **Feature 1**: Beschreibung
- **Feature 2**: Beschreibung
- **Feature 3**: Beschreibung

## 🐞 Fehlerbehebungen

- **Fix 1**: Beschreibung
- **Fix 2**: Beschreibung
- **Fix 3**: Beschreibung

## 🧰 Technische Verbesserungen

- Technisches Detail 1
- Technisches Detail 2
- Technisches Detail 3

---

**Release-Datum**: {DATE}
`;
    }
    
    // Replace placeholders
    const releaseNotes = template
      .replace(/{VERSION}/g, version)
      .replace(/{TITLE}/g, title)
      .replace(/{DATE}/g, formatDate());
    
    // Write file
    await fs.writeFile(filePath, releaseNotes);
    
    console.log(`✅ Release Notes für Version ${version} erfolgreich erstellt:`);
    console.log(`📝 ${filePath}`);
    
  } catch (error) {
    console.error('❌ Fehler beim Erstellen der Release Notes:', error);
  } finally {
    rl.close();
  }
}

createReleaseNotes();