#!/usr/bin/env node
// CI-Guard: Template-Integrität und Migrationsprobleme-Check
// Verhindert beschädigte Templates und veraltete Relikte

import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

let exitCode = 0;

console.log('🔍 RawaLite CI-Guard: Template-Migrations-Check');
console.log('=' .repeat(60));

const templatesDir = './templates';
const templates = readdirSync(templatesDir).filter(f => f.endsWith('.html'));

console.log(`📋 Checking ${templates.length} HTML templates for migration issues...`);

// Definierte Probleme, die erkannt werden sollen
const MIGRATION_CHECKS = {
  // Strukturelle Vollständigkeit
  missingTitle: {
    test: (content) => !content.includes('<title>'),
    error: 'Fehlender <title>-Tag - Template-Struktur beschädigt'
  },
  
  orphanedCSS: {
    test: (content) => {
      // CSS ohne style-Tags erkennen
      const cssPattern = /^\s*[.#][a-zA-Z-]+\s*\{/gm;
      const stylePattern = /<style[^>]*>/;
      return cssPattern.test(content) && !stylePattern.test(content);
    },
    error: 'CSS-Code ohne <style>-Tags gefunden - Template verstümmelt'
  },
  
  brokenHTML: {
    test: (content) => {
      // Schwere HTML-Brüche
      return content.includes('}snachweis') || 
             content.includes('<!-- DIN 5008') && !content.includes('<style>');
    },
    error: 'Korrupte HTML-Struktur - Merge-Konflikt oder fehlerhafte Migration'
  },
  
  // Debug-Relikte (strenger Check)
  debugBoxes: {
    test: (content) => content.includes('border.*red') || content.includes('debug-box'),
    error: 'Debug-Boxen im Template gefunden - Development-Relikte entfernen'
  },
  
  temporaryContent: {
    test: (content) => /\b(debug|DEBUG|test|TEST|temporär|temp|TEMP|todo|TODO|fixme|FIXME)\b/.test(content),
    error: 'Temporäre Debug-Inhalte im Template - Migration unvollständig'
  },
  
  // Template-Konsistenz
  missingHandlebarsHelpers: {
    test: (content) => {
      const helpers = ['formatCurrency', 'formatDate'];
      return helpers.some(helper => 
        content.includes(`{{${helper}`) && 
        !content.includes('{{formatCurrency this.') // Loop-Context OK
      );
    },
    error: 'Handlebars-Helper außerhalb von Loop-Kontext - Formatierung kann fehlschlagen'
  },
  
  incompleteConditionals: {
    test: (content) => {
      const openIfs = (content.match(/\{\{#if/g) || []).length;
      const closeIfs = (content.match(/\{\{\/if\}\}/g) || []).length;
      return openIfs !== closeIfs;
    },
    error: 'Unvollständige {{#if}}/{{/if}} Blöcke - Template-Rendering wird fehlschlagen'
  },
  
  incompleteLoops: {
    test: (content) => {
      const openEach = (content.match(/\{\{#each/g) || []).length;
      const closeEach = (content.match(/\{\{\/each\}\}/g) || []).length;
      return openEach !== closeEach;
    },
    error: 'Unvollständige {{#each}}/{{/each}} Blöcke - Loop-Rendering wird fehlschlagen'
  }
};

// Template-spezifische Checks
const TEMPLATE_SPECIFIC_CHECKS = {
  'offer.html': [
    {
      test: (content) => !content.includes('{{offer.offerNumber}}'),
      error: 'Angebots-Template muss {{offer.offerNumber}} enthalten'
    },
    {
      test: (content) => !content.includes('{{#each offer.lineItems}}'),
      error: 'Angebots-Template muss Positionen-Loop enthalten'
    }
  ],
  
  'invoice.html': [
    {
      test: (content) => !content.includes('{{invoice.invoiceNumber}}'),
      error: 'Rechnungs-Template muss {{invoice.invoiceNumber}} enthalten'
    },
    {
      test: (content) => !content.includes('{{#each invoice.lineItems}}'),
      error: 'Rechnungs-Template muss Positionen-Loop enthalten'
    }
  ],
  
  'timesheet.html': [
    {
      test: (content) => !content.includes('{{timesheet.timesheetNumber}}'),
      error: 'Timesheet-Template muss {{timesheet.timesheetNumber}} enthalten'
    },
    {
      test: (content) => !content.includes('{{#each timesheet.activities}}'),
      error: 'Timesheet-Template muss Aktivitäten-Loop enthalten'
    }
  ]
};

// Template-Checks durchführen
templates.forEach(templateFile => {
  const templatePath = join(templatesDir, templateFile);
  let content;
  
  try {
    content = readFileSync(templatePath, 'utf8');
  } catch (err) {
    console.error(`❌ ${templateFile}: Datei kann nicht gelesen werden - ${err.message}`);
    exitCode = 1;
    return;
  }
  
  console.log(`\n📄 Checking template: ${templateFile}`);
  
  let issues = 0;
  
  // Allgemeine Migrations-Checks
  Object.entries(MIGRATION_CHECKS).forEach(([checkName, check]) => {
    if (check.test(content)) {
      console.error(`  ❌ ${checkName}: ${check.error}`);
      issues++;
      exitCode = 1;
    }
  });
  
  // Template-spezifische Checks
  if (TEMPLATE_SPECIFIC_CHECKS[templateFile]) {
    TEMPLATE_SPECIFIC_CHECKS[templateFile].forEach((check, index) => {
      if (check.test(content)) {
        console.error(`  ❌ specific-${index}: ${check.error}`);
        issues++;
        exitCode = 1;
      }
    });
  }
  
  if (issues === 0) {
    console.log(`  ✅ Template ist strukturell korrekt (${content.length} chars)`);
  } else {
    console.error(`  ⚠️  ${issues} Problem(e) gefunden in ${templateFile}`);
  }
});

// Zusammenfassung
console.log('\n' + '='.repeat(60));

if (exitCode === 0) {
  console.log('✅ Alle Templates sind migrationssicher und strukturell korrekt');
  console.log('🔒 Keine Debug-Relikte oder Korruptionen gefunden');
} else {
  console.error('❌ Template-Migrationsprobleme gefunden!');
  console.error('🚨 Diese müssen vor Release/Deployment behoben werden');
  console.error('\n💡 Häufige Lösungen:');
  console.error('   - Beschädigte Templates aus Git-History wiederherstellen');
  console.error('   - Debug-Boxen und temporäre Inhalte entfernen');
  console.error('   - HTML-Struktur und Handlebars-Syntax validieren');
  console.error('   - Template-spezifische Variablen und Loops prüfen');
}

process.exit(exitCode);