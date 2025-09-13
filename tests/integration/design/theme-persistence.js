/**
 * Test für Theme-Persistenz Problem - Lösung validieren
 * Das Problem war: CSS verwendete alte englische Theme-Namen
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

console.log('🐛 Theme-Persistenz Problem - Lösung validieren\n');

// Check CSS file for correct theme names
function validateCSSThemes() {
  const cssPath = path.join(__dirname, 'src', 'index.css');
  const cssContent = fs.readFileSync(cssPath, 'utf8');
  
  console.log('🎨 CSS-Theme-Namen Validierung:');
  
  // Check for old English names (should NOT exist)
  const oldThemes = ['green', 'blue', 'purple', 'orange', 'red'];
  const newThemes = ['salbeigrün', 'himmelblau', 'lavendel', 'pfirsich', 'rosé'];
  
  let hasOldThemes = false;
  let hasNewThemes = false;
  
  oldThemes.forEach(theme => {
    if (cssContent.includes(`data-theme="${theme}"`)) {
      console.log(`  ❌ Gefunden: data-theme="${theme}" (alt)`);
      hasOldThemes = true;
    }
  });
  
  newThemes.forEach(theme => {
    if (cssContent.includes(`data-theme="${theme}"`)) {
      console.log(`  ✅ Gefunden: data-theme="${theme}" (neu)`);
      hasNewThemes = true;
    }
  });
  
  if (!hasOldThemes && hasNewThemes) {
    console.log('  🎯 CSS-Theme-Namen: KORREKT - Alle deutsche Namen');
  } else if (hasOldThemes) {
    console.log('  ⚠️ CSS-Theme-Namen: PROBLEM - Noch alte englische Namen gefunden');
  } else {
    console.log('  ❌ CSS-Theme-Namen: FEHLER - Keine Theme-Definitionen gefunden');
  }
  
  return !hasOldThemes && hasNewThemes;
}

// Check themes.ts for correct IDs
function validateThemesJS() {
  const themesPath = path.join(__dirname, 'src', 'lib', 'themes.ts');
  const themesContent = fs.readFileSync(themesPath, 'utf8');
  
  console.log('\n🔧 themes.ts Theme-IDs Validierung:');
  
  const newThemes = ['salbeigrün', 'himmelblau', 'lavendel', 'pfirsich', 'rosé'];
  let allCorrect = true;
  
  newThemes.forEach(theme => {
    if (themesContent.includes(`id: '${theme}'`)) {
      console.log(`  ✅ Theme-ID: '${theme}' gefunden`);
    } else {
      console.log(`  ❌ Theme-ID: '${theme}' NICHT gefunden`);
      allCorrect = false;
    }
  });
  
  return allCorrect;
}

// Main validation
const cssValid = validateCSSThemes();
const themesValid = validateThemesJS();

console.log('\n🎯 Problem-Diagnose:');
console.log('====================');

if (cssValid && themesValid) {
  console.log('✅ GELÖST: CSS und JS verwenden konsistente deutsche Theme-Namen');
  console.log('✅ Theme-Persistenz sollte jetzt funktionieren');
  
  console.log('\n📋 Test-Schritte:');
  console.log('1. 🚀 App starten: pnpm dev');
  console.log('2. 🎨 Einstellungen → Farbthema ändern (z.B. Himmelblau)');
  console.log('3. 🧭 Navigation umschalten (Header/Sidebar)');
  console.log('4. 🔃 App reload (F5 oder View → Reload)');
  console.log('5. ✅ Verifikation: Theme und Navigation bleiben erhalten');
  
} else {
  console.log('❌ PROBLEM: CSS und JS haben inkonsistente Theme-Namen');
  if (!cssValid) console.log('   → CSS: Korrigiere data-theme Attribute');
  if (!themesValid) console.log('   → JS: Korrigiere Theme-IDs in themes.ts');
}

console.log('\n🔍 Ursprüngliches Problem:');
console.log('   CSS: data-theme="green" ← englisch');
console.log('   JS:  theme: "salbeigrün" ← deutsch');
console.log('   Resultat: CSS findet Theme nicht → Standard-Styling');

console.log('\n✅ Lösung:');
console.log('   CSS: data-theme="salbeigrün" ← deutsch');
console.log('   JS:  theme: "salbeigrün" ← deutsch');
console.log('   Resultat: CSS findet Theme → Korrekte Farben!');