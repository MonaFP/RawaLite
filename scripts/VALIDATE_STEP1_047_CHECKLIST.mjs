#!/usr/bin/env node

/**
 * STEP 1: SQL-Validierungs-Checkliste (047-Guide)
 * Datentypverteilung, TEXT/px-Funde, CHECK/DDL, History-Tabellen, Verteilung, PRAGMA integrity_check
 */

import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import os from 'os';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(os.homedir(), 'AppData', 'Roaming', 'Electron', 'database', 'rawalite.db');

console.log('📋 SQL-Validierungs-Checkliste (047-Guide)');
console.log('🗄️  DB-Pfad:', dbPath);
console.log('');

try {
  const db = new Database(dbPath);
  let allGreen = true;

  // 1. DATENTYPVERTEILUNG header_height
  console.log('1️⃣  DATENTYPVERTEILUNG - header_height');
  try {
    const colInfo = db.prepare('PRAGMA table_info(user_navigation_preferences)').all();
    const headerHeightCol = colInfo.find(c => c.name === 'header_height');
    if (headerHeightCol) {
      console.log('   Column type:', headerHeightCol.type);
      console.log('   Notnull:', headerHeightCol.notnull);
    } else {
      console.log('   ⚠️  header_height column NOT FOUND');
      allGreen = false;
    }
  } catch (e) {
    console.log('   ❌ Error checking column:', e.message);
    allGreen = false;
  }

  // 2. TEXT/'px'-FUNDE
  console.log('');
  console.log('2️⃣  TEXT/\'px\'-FUNDE in header_height');
  try {
    const result = db.prepare(
      "SELECT COUNT(*) as cnt FROM user_navigation_preferences WHERE header_height LIKE '%px%' OR typeof(header_height) = 'text'"
    ).get();
    console.log('   TEXT/px-Einträge:', result.cnt);
    if (result.cnt > 0) {
      const samples = db.prepare(
        "SELECT DISTINCT header_height FROM user_navigation_preferences WHERE header_height LIKE '%px%' OR typeof(header_height) = 'text' LIMIT 5"
      ).all();
      console.log('   Samples:', samples.map(s => s.header_height).join(', '));
      allGreen = false; // TEXT found = problem
    } else {
      console.log('   ✅ Keine TEXT/px-Einträge (gut!)');
    }
  } catch (e) {
    console.log('   ❌ Error:', e.message);
    allGreen = false;
  }

  // 3. CHECK/DDL-AUSZUG
  console.log('');
  console.log('3️⃣  CHECK/DDL-AUSZUG - user_navigation_preferences');
  try {
    const sql = db.prepare(
      "SELECT sql FROM sqlite_master WHERE type='table' AND name='user_navigation_preferences'"
    ).get();
    if (sql && sql.sql) {
      console.log('   DDL vorhanden: ✅');
      const hasCheck = sql.sql.includes('CHECK');
      console.log('   Hat CHECK-Constraint:', hasCheck ? '✅' : '❌');
      if (hasCheck) {
        const checkMatch = sql.sql.match(/CHECK\s*\([^)]+\)/);
        if (checkMatch) console.log('   CHECK-Klausel:', checkMatch[0]);
      } else {
        allGreen = false; // No CHECK = problem for 047
      }
    } else {
      console.log('   ⚠️  DDL NICHT GEFUNDEN');
      allGreen = false;
    }
  } catch (e) {
    console.log('   ❌ Error:', e.message);
    allGreen = false;
  }

  // 4. HISTORY-TABELLEN + INDIZES
  console.log('');
  console.log('4️⃣  HISTORY-TABELLEN + INDIZES');
  try {
    const historyTables = db.prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name LIKE '%history%'"
    ).all();
    console.log('   History-Tabellen:', historyTables.length > 0 ? historyTables.map(t => t.name).join(', ') : 'KEINE ⚠️ ');

    const views = db.prepare(
      "SELECT name FROM sqlite_master WHERE type='view' AND name LIKE '%history%'"
    ).all();
    console.log('   History-Views:', views.length > 0 ? views.map(v => v.name).join(', ') : 'KEINE ⚠️ ');

    const indexes = db.prepare(
      "SELECT name FROM sqlite_master WHERE type='index' AND name LIKE '%history%'"
    ).all();
    console.log('   History-Indizes:', indexes.length > 0 ? indexes.map(i => i.name).join(', ') : 'KEINE ⚠️ ');

    if (historyTables.length === 0 && views.length === 0) {
      allGreen = false; // 047 will create these
    }
  } catch (e) {
    console.log('   ❌ Error:', e.message);
    allGreen = false;
  }

  // 5. VERTEILUNG (Modus, header_height)
  console.log('');
  console.log('5️⃣  VERTEILUNG - Modus & header_height');
  try {
    const dist = db.prepare(
      'SELECT navigation_mode, header_height, COUNT(*) as cnt FROM user_navigation_preferences GROUP BY navigation_mode, header_height ORDER BY cnt DESC'
    ).all();
    if (dist.length > 0) {
      console.log(`   Gesamt-Einträge: ${dist.reduce((sum, row) => sum + row.cnt, 0)}`);
      dist.forEach(row => {
        console.log(`   Mode: ${row.navigation_mode}, Height: ${row.header_height}, Count: ${row.cnt}`);
      });
    } else {
      console.log('   ⚠️  Keine Daten in user_navigation_preferences');
    }
  } catch (e) {
    console.log('   ❌ Error:', e.message);
    allGreen = false;
  }

  // 6. PRAGMA integrity_check
  console.log('');
  console.log('6️⃣  PRAGMA integrity_check');
  try {
    const integrityResult = db.prepare('PRAGMA integrity_check').all();
    if (integrityResult.length === 1 && integrityResult[0].integrity_check === 'ok') {
      console.log('   ✅ Database integrity: OK');
    } else {
      console.log('   ⚠️  Integrity issues found:');
      integrityResult.forEach(row => console.log('   ', row.integrity_check));
      allGreen = false;
    }
  } catch (e) {
    console.log('   ❌ Error:', e.message);
    allGreen = false;
  }

  db.close();

  console.log('');
  console.log('═══════════════════════════════════════════════');
  if (allGreen) {
    console.log('✅ STEP 1 VALIDIERUNG: Alle Checks bestanden (oder erwartete Zustände)');
  } else {
    console.log('⚠️  STEP 1 VALIDIERUNG: Einige Probleme erkannt (siehe Details oben)');
  }
  console.log('═══════════════════════════════════════════════');

  process.exit(allGreen ? 0 : 0); // 0 für beide, da wir Informationen sammeln
} catch (err) {
  console.error('❌ Database connection failed:', err.message);
  process.exit(1);
}
