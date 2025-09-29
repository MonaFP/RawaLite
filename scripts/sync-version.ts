/**
 * 🔄 Versionssync-Mechanismus - RawaLite (Phase 2)
 * 
 * Synchronisiert Versionen zwischen:
 * - package.json
 * - Dokumentation (ARCHITEKTUR.md, standards.md, etc.)
 * - App UI (About-Dialog, Backup-Header)
 * - Electron Builder Config
 * 
 * @usage pnpm sync-version [new-version]
 */

import fs from 'node:fs/promises';
import path from 'node:path';

interface VersionConfig {
  current: string;
  new?: string;
}

interface FilePattern {
  path: string;
  patterns: Array<{
    search: RegExp;
    replace: (version: string) => string;
    description: string;
  }>;
}

/**
 * 📋 Alle Dateien die Versionen enthalten
 */
const VERSION_FILES: FilePattern[] = [
  // 📦 Package Configuration
  {
    path: 'package.json',
    patterns: [
      {
        search: /"version"\s*:\s*"[^"]+"/,
        replace: (v) => `"version": "${v}"`,
        description: 'NPM package version'
      }
    ]
  },
  
  // 📚 Documentation
  {
    path: 'docs/ARCHITEKTUR.md',
    patterns: [
      {
        search: />\s*\*\*Letzte Aktualisierung:\*\*.*\|\s*\*\*Version:\*\*\s*[^\n]+/,
        replace: (v) => `> **Letzte Aktualisierung:** ${getCurrentDate()} | **Version:** ${v}`,
        description: 'Architecture document version'
      }
    ]
  },
  
  {
    path: 'docs/standards.md',
    patterns: [
      {
        search: />\s*\*\*Letzte Aktualisierung:\*\*.*\|\s*\*\*Version:\*\*\s*[^\n]+/,
        replace: (v) => `> **Letzte Aktualisierung:** ${getCurrentDate()} | **Version:** ${v}`,
        description: 'Standards document version'
      }
    ]
  },
  
  {
    path: 'docs/debugging.md',
    patterns: [
      {
        search: />\s*\*\*Letzte Aktualisierung:\*\*.*\|\s*\*\*Version:\*\*\s*[^\n]+/,
        replace: (v) => `> **Letzte Aktualisierung:** ${getCurrentDate()} | **Version:** ${v}`,
        description: 'Debugging document version'
      }
    ]
  },
  
  {
    path: 'docs/WORKFLOWS.md',
    patterns: [
      {
        search: />\s*\*\*Letzte Aktualisierung:\*\*.*\|\s*\*\*Version:\*\*\s*[^\n]+/,
        replace: (v) => `> **Letzte Aktualisierung:** ${getCurrentDate()} | **Version:** ${v}`,
        description: 'Workflows document version'
      }
    ]
  },
  
  {
    path: 'PROJECT_OVERVIEW.md',
    patterns: [
      {
        search: /\*Version:\s*[^\*]+\*/,
        replace: (v) => `*Version: ${v} - Current Release*`,
        description: 'Project overview version'
      }
    ]
  },
  
  // 🎨 App UI Components
  {
    path: 'src/pages/EinstellungenPage.tsx',
    patterns: [
      {
        search: /version:\s*['"][^'"]+['"]/,
        replace: (v) => `version: '${v}'`,
        description: 'Settings page backup version'
      }
    ]
  },
  
  // 📱 Electron Builder
  {
    path: 'electron-builder.yml',
    patterns: [
      {
        search: /version:\s*[^\n]+/,
        replace: (v) => `version: ${v}`,
        description: 'Electron Builder version'
      }
    ]
  }
];

/**
 * 📅 Aktuelles Datum formatieren
 */
function getCurrentDate(): string {
  const now = new Date();
  const day = now.getDate().toString().padStart(2, '0');
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const year = now.getFullYear();
  
  const months = [
    'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
    'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'
  ];
  
  return `${day}. ${months[now.getMonth()]} ${year}`;
}

/**
 * 📖 Aktuelle Version aus package.json lesen
 */
async function getCurrentVersion(): Promise<string> {
  try {
    const packagePath = path.join(process.cwd(), 'package.json');
    const packageContent = await fs.readFile(packagePath, 'utf-8');
    const packageJson = JSON.parse(packageContent);
    return packageJson.version;
  } catch (error) {
    console.error('❌ Fehler beim Lesen der package.json:', error);
    throw error;
  }
}

/**
 * ✅ Version validieren
 */
function validateVersion(version: string): boolean {
  const semverRegex = /^(\d+)\.(\d+)\.(\d+)(?:-([a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*))?$/;
  return semverRegex.test(version);
}

/**
 * 🔍 Alle Vorkommen einer Version finden
 */
async function scanVersions(): Promise<Array<{file: string; line: number; content: string; version?: string}>> {
  const results: Array<{file: string; line: number; content: string; version?: string}> = [];
  
  for (const filePattern of VERSION_FILES) {
    try {
      const filePath = path.join(process.cwd(), filePattern.path);
      const content = await fs.readFile(filePath, 'utf-8');
      const lines = content.split('\n');
      
      lines.forEach((line, index) => {
        for (const pattern of filePattern.patterns) {
          if (pattern.search.test(line)) {
            // Versuche Version zu extrahieren
            const versionMatch = line.match(/(\d+\.\d+\.\d+(?:-[a-zA-Z0-9.-]+)?)/);
            const extractedVersion = versionMatch?.[1];
            
            results.push({
              file: filePattern.path,
              line: index + 1,
              content: line.trim(),
              version: extractedVersion
            });
          }
        }
      });
    } catch (error) {
      console.warn(`⚠️  Datei ${filePattern.path} nicht gefunden, wird übersprungen`);
    }
  }
  
  return results;
}

/**
 * 🔄 Version in allen Dateien aktualisieren
 */
async function updateVersions(newVersion: string): Promise<void> {
  console.log(`🚀 Aktualisiere alle Versionen auf ${newVersion}...`);
  
  let updatedFiles = 0;
  let totalReplacements = 0;
  
  for (const filePattern of VERSION_FILES) {
    try {
      const filePath = path.join(process.cwd(), filePattern.path);
      let content = await fs.readFile(filePath, 'utf-8');
      let fileModified = false;
      let fileReplacements = 0;
      
      for (const pattern of filePattern.patterns) {
        const originalContent = content;
        content = content.replace(pattern.search, (match) => {
          fileReplacements++;
          return pattern.replace(newVersion);
        });
        
        if (content !== originalContent) {
          fileModified = true;
          console.log(`   ✅ ${pattern.description} in ${filePattern.path}`);
        }
      }
      
      if (fileModified) {
        await fs.writeFile(filePath, content, 'utf-8');
        updatedFiles++;
        totalReplacements += fileReplacements;
        console.log(`📝 ${filePattern.path} aktualisiert (${fileReplacements} Änderungen)`);
      }
    } catch (error) {
      console.warn(`⚠️  Fehler bei ${filePattern.path}:`, error);
    }
  }
  
  console.log(`\n✨ Synchronisation abgeschlossen:`);
  console.log(`   📁 Dateien aktualisiert: ${updatedFiles}`);
  console.log(`   🔄 Gesamte Ersetzungen: ${totalReplacements}`);
}

/**
 * 📊 Version-Status-Report
 */
async function generateReport(): Promise<void> {
  console.log('📊 Versionsstatus-Report\n');
  
  const currentVersion = await getCurrentVersion();
  console.log(`📦 Aktuelle Hauptversion (package.json): ${currentVersion}\n`);
  
  const versionOccurrences = await scanVersions();
  
  // Gruppiere nach Versionen
  const versionGroups = versionOccurrences.reduce((groups, occurrence) => {
    const version = occurrence.version || 'unbekannt';
    if (!groups[version]) {
      groups[version] = [];
    }
    groups[version].push(occurrence);
    return groups;
  }, {} as Record<string, typeof versionOccurrences>);
  
  console.log('🔍 Gefundene Versionen:');
  Object.entries(versionGroups).forEach(([version, occurrences]) => {
    const status = version === currentVersion ? '✅' : '⚠️ ';
    console.log(`${status} ${version} (${occurrences.length} Vorkommen)`);
    
    occurrences.forEach(occ => {
      console.log(`     📁 ${occ.file}:${occ.line}`);
      console.log(`     📝 ${occ.content}`);
    });
    console.log();
  });
  
  // Warnung bei Inkonsistenzen
  const uniqueVersions = Object.keys(versionGroups).filter(v => v !== 'unbekannt');
  if (uniqueVersions.length > 1) {
    console.log('⚠️  WARNUNG: Inkonsistente Versionen erkannt!');
    console.log('   Führe `pnpm sync-version` aus, um zu synchronisieren.\n');
  } else {
    console.log('✅ Alle Versionen sind konsistent!\n');
  }
}

/**
 * 🎯 Hauptfunktion
 */
async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const command = args[0];
  
  console.log('🔄 RawaLite Version Sync Tool\n');
  
  try {
    switch (command) {
      case 'report':
      case 'status':
        await generateReport();
        break;
        
      case 'scan':
        const occurrences = await scanVersions();
        console.log(`🔍 ${occurrences.length} Versionsvorkommen gefunden:\n`);
        occurrences.forEach(occ => {
          console.log(`📁 ${occ.file}:${occ.line} → ${occ.version || 'unbekannt'}`);
          console.log(`   ${occ.content}`);
        });
        break;
        
      default:
        const newVersion = command;
        
        if (!newVersion) {
          console.log('📋 Verwendung:');
          console.log('   pnpm sync-version [version]     - Alle Versionen synchronisieren');
          console.log('   pnpm sync-version report        - Status-Report anzeigen');
          console.log('   pnpm sync-version scan          - Alle Versionen scannen');
          console.log('');
          console.log('📊 Zeige aktuellen Status:');
          await generateReport();
          return;
        }
        
        if (!validateVersion(newVersion)) {
          console.error('❌ Ungültiges Versionsformat. Verwende Semantic Versioning (z.B. 1.2.3)');
          process.exit(1);
        }
        
        const currentVersion = await getCurrentVersion();
        console.log(`📦 Aktuelle Version: ${currentVersion}`);
        console.log(`🎯 Neue Version: ${newVersion}\n`);
        
        if (currentVersion === newVersion) {
          console.log('ℹ️  Version ist bereits korrekt. Synchronisiere trotzdem alle Dateien...\n');
        }
        
        await updateVersions(newVersion);
        
        console.log('\n🎉 Version erfolgreich synchronisiert!');
        console.log(`   Alle Dateien verwenden jetzt Version ${newVersion}`);
    }
  } catch (error) {
    console.error('❌ Fehler beim Versionssync:', error);
    process.exit(1);
  }
}

// 🚀 Script ausführen
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { updateVersions, getCurrentVersion, scanVersions, generateReport };