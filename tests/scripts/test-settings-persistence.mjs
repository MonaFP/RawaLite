// ESM Version - test-settings-persistence.mjs
import path from 'path';
import fs from 'fs';
import initSqlJs from 'sql.js';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testSettingsPersistence() {
  console.log('🎨 Post-Fix Persistenz-Audit: Settings-Persistenz');
  console.log('='.repeat(60));
  
  const dbPath = path.join(process.env.APPDATA, 'RawaLite', 'database.sqlite');
  
  if (!fs.existsSync(dbPath)) {
    console.log('❌ Database-Datei nicht gefunden:', dbPath);
    return false;
  }
  
  console.log('✅ Database gefunden:', dbPath);
  
  try {
    const SQL = await initSqlJs();
    const data = fs.readFileSync(dbPath);
    const db = new SQL.Database(data);
    
    console.log('');
    console.log('🔍 Settings-Schema-Validierung:');
    
    // Prüfe Settings-Tabellenstruktur
    const columns = db.exec("PRAGMA table_info(settings)");
    const columnNames = columns.length && columns[0].values 
      ? columns[0].values.map(row => ({ name: row[1], type: row[2] }))
      : [];
    
    console.log('  Spalten:', columnNames.map(c => `${c.name}(${c.type})`).join(', '));
    
    const hasDesignSettings = columnNames.some(col => col.name === 'designSettings');
    console.log('  designSettings Spalte:', hasDesignSettings ? '✅ vorhanden' : '❌ fehlt');
    
    // Prüfe Settings-Daten
    console.log('');
    console.log('🎯 Settings-Datenvalidierung:');
    
    const settingsRows = db.exec("SELECT id, designSettings FROM settings WHERE id = 1");
    
    if (settingsRows.length && settingsRows[0].values && settingsRows[0].values.length > 0) {
      const settingsData = settingsRows[0].values[0];
      const designSettingsRaw = settingsData[1];
      
      console.log('  Settings ID:', settingsData[0]);
      console.log('  designSettings (raw):', designSettingsRaw || 'NULL');
      
      if (designSettingsRaw) {
        try {
          const designSettings = JSON.parse(designSettingsRaw);
          console.log('  ✅ designSettings JSON valid:');
          console.log('    theme:', designSettings.theme || 'undefined');
          console.log('    navigationMode:', designSettings.navigationMode || 'undefined');
          
          // Validiere erwartete Werte
          const validThemes = ['salbeigrün', 'himmelblau', 'lavendel', 'pfirsich', 'rosé'];
          const validNavModes = ['sidebar', 'header'];
          
          const isValidTheme = validThemes.includes(designSettings.theme);
          const isValidNavMode = validNavModes.includes(designSettings.navigationMode);
          
          console.log('    Theme gültig:', isValidTheme ? '✅' : '❌');
          console.log('    NavigationMode gültig:', isValidNavMode ? '✅' : '❌');
          
        } catch (parseError) {
          console.log('  ❌ designSettings JSON ungültig:', parseError.message);
        }
      } else {
        console.log('  ⚠️ designSettings ist NULL oder leer');
      }
    } else {
      console.log('  ❌ Keine Settings-Daten gefunden');
    }
    
    // Prüfe Default-Werte-Initialisierung
    console.log('');
    console.log('🔧 Default-Werte-Prüfung:');
    
    const allSettings = db.exec("SELECT * FROM settings WHERE id = 1");
    if (allSettings.length && allSettings[0].values && allSettings[0].values.length > 0) {
      const row = allSettings[0].values[0];
      const columns = allSettings[0].columns;
      
      const companyNameIndex = columns.indexOf('companyName');
      const nextCustomerNumberIndex = columns.indexOf('nextCustomerNumber');
      const designSettingsIndex = columns.indexOf('designSettings');
      
      console.log('  companyName:', row[companyNameIndex] || '(leer)');
      console.log('  nextCustomerNumber:', row[nextCustomerNumberIndex] || '(nicht gesetzt)');
      console.log('  designSettings vorhanden:', row[designSettingsIndex] ? '✅' : '❌');
    }
    
    db.close();
    console.log('');
    console.log('✅ Settings-Persistenz-Prüfung abgeschlossen');
    
    return true;
    
  } catch (err) {
    console.log('❌ Fehler bei Settings-Prüfung:', err.message);
    return false;
  }
}

// Top-level await in ESM
await testSettingsPersistence().catch(console.error);