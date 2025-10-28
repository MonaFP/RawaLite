#!/usr/bin/env node

/**
 * VALIDATE_FIELD_MAPPER_REAL_DB_SYNC.mjs
 * 
 * Validiert Field Mapper Mappings gegen echte Produktions-DB
 * Findet veraltete/falsche Mappings und schlägt Korrekturen vor
 * 
 * Status: CRITICAL für Field Mapper Accuracy
 * Erstellt: 25.10.2025
 * 
 * USES SQL.js (WASM) für ABI-unabhängige DB-Analyse
 */

import initSqlJs from 'sql.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Real DB Path (Windows User Data)
const REAL_DB_PATH = 'C:\\Users\\ramon\\AppData\\Roaming\\Electron\\database\\rawalite.db';

// Field Mapper Path
const FIELD_MAPPER_PATH = path.join(__dirname, '..', 'src', 'lib', 'field-mapper.ts');

console.log('🔍 FIELD MAPPER vs REAL DB VALIDATION');
console.log('=====================================');

async function validateFieldMapperSync() {
  try {
    // 1. Prüfe ob Real DB existiert
    if (!fs.existsSync(REAL_DB_PATH)) {
      console.error(`❌ Real DB nicht gefunden: ${REAL_DB_PATH}`);
      return false;
    }

    // 2. SQL.js initialisieren
    const SQL = await initSqlJs({
      locateFile: file => `https://sql.js.org/dist/${file}`
    });
    
    // 3. Real DB laden
    const dbBuffer = fs.readFileSync(REAL_DB_PATH);
    const db = new SQL.Database(dbBuffer);
    
    // 4. Alle Tabellen extrahieren
    const tablesResult = db.exec(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name NOT LIKE 'sqlite_%'
      ORDER BY name
    `);
    
    const tables = tablesResult[0]?.values?.map(row => ({ name: row[0] })) || [];
    
    console.log(`📊 Real DB Tabellen: ${tables.length}`);
    
    // 5. Kern-Tabellen analysieren
    const coreTableAnalysis = {};
    const coreTables = ['customers', 'offers', 'invoices', 'packages', 'user_navigation_preferences'];
    
    for (const table of coreTables) {
      if (tables.find(t => t.name === table)) {
        const columnsResult = db.exec(`PRAGMA table_info(${table})`);
        const columns = columnsResult[0]?.values?.map(row => row[1]) || [];
        coreTableAnalysis[table] = columns;
        console.log(`✅ ${table}: ${columns.length} Spalten`);
      } else {
        console.log(`⚠️ ${table}: FEHLT in Real DB`);
      }
    }
    
    // 5. Field Mapper Mappings lesen
    const fieldMapperContent = fs.readFileSync(FIELD_MAPPER_PATH, 'utf-8');
    
    // 6. Customers Table Validation (kritischste Tabelle)
    console.log('\n🔍 CUSTOMERS TABLE VALIDATION:');
    console.log('===============================');
    
    const realCustomerColumns = coreTableAnalysis.customers || [];
    console.log(`Real DB customers Spalten: ${realCustomerColumns.join(', ')}`);
    
    // 7. Mapping-Probleme identifizieren
    const problemMappings = [];
    
    // Check für veraltete Customer-Mappings
    const deprecatedMappings = [
      'company_name', 'contact_person', 'address_street', 
      'address_city', 'address_zip', 'address_country', 
      'tax_id', 'tax_office'
    ];
    
    for (const mapping of deprecatedMappings) {
      if (fieldMapperContent.includes(`'${mapping}'`)) {
        if (!realCustomerColumns.includes(mapping)) {
          problemMappings.push({
            mapping,
            issue: 'VERALTET - existiert nicht in Real DB',
            table: 'customers'
          });
        }
      }
    }
    
    // 8. Fehlende Mappings identifizieren
    const missingMappings = [];
    for (const column of realCustomerColumns) {
      if (!fieldMapperContent.includes(`'${column}'`) && column !== 'id') {
        missingMappings.push({
          column,
          table: 'customers',
          suggestion: `'${camelCase(column)}': '${column}',`
        });
      }
    }
    
    // 9. Ergebnisse ausgeben
    console.log('\n📋 VALIDIERUNGS-ERGEBNISSE:');
    console.log('===========================');
    
    if (problemMappings.length > 0) {
      console.log(`❌ ${problemMappings.length} Problem-Mappings gefunden:`);
      problemMappings.forEach(problem => {
        console.log(`   - ${problem.mapping} (${problem.table}): ${problem.issue}`);
      });
    } else {
      console.log('✅ Keine Problem-Mappings gefunden');
    }
    
    if (missingMappings.length > 0) {
      console.log(`⚠️ ${missingMappings.length} Fehlende Mappings gefunden:`);
      missingMappings.forEach(missing => {
        console.log(`   - ${missing.table}.${missing.column}: ${missing.suggestion}`);
      });
    } else {
      console.log('✅ Alle wichtigen Spalten gemappt');
    }
    
    // 10. Navigation Tables Check
    console.log('\n🧭 NAVIGATION TABLES CHECK:');
    console.log('============================');
    
    const navTables = [
      'user_navigation_preferences',
      'user_navigation_mode_settings', 
      'user_focus_mode_preferences'
    ];
    
    for (const table of navTables) {
      if (tables.find(t => t.name === table)) {
        const columnsResult = db.exec(`PRAGMA table_info(${table})`);
        const columns = columnsResult[0]?.values?.length || 0;
        console.log(`✅ ${table}: ${columns} Spalten aktiv`);
      } else {
        console.log(`❌ ${table}: FEHLT in Real DB`);
      }
    }
    
    db.close();
    
    // 11. Final Status
    const totalIssues = problemMappings.length + missingMappings.length;
    console.log('\n🎯 FINAL STATUS:');
    console.log('================');
    console.log(`Problem-Mappings: ${problemMappings.length}`);
    console.log(`Fehlende Mappings: ${missingMappings.length}`);
    console.log(`Total Issues: ${totalIssues}`);
    
    if (totalIssues === 0) {
      console.log('✅ Field Mapper ist SYNC mit Real DB');
      return true;
    } else {
      console.log('❌ Field Mapper braucht Updates');
      return false;
    }
    
  } catch (error) {
    console.error('❌ Validation failed:', error.message);
    return false;
  }
}

// Helper: camelCase conversion
function camelCase(str) {
  return str.replace(/_([a-z])/g, (match, letter) => letter.toUpperCase());
}

// Run validation
validateFieldMapperSync().then(success => {
  process.exit(success ? 0 : 1);
});