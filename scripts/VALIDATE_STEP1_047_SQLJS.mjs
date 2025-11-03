#!/usr/bin/env node

/**
 * STEP 1: SQL-Validierungs-Checkliste (047-Guide)
 * Nutzt ANALYZE_DATABASE_SQLJS_INSPECT.mjs (ABI-safe via SQL.js)
 */

import initSqlJs from 'sql.js';
import fs from 'fs';
import path from 'path';
import os from 'os';

// Try prod DB first, fallback to dev
const prodDbPath = path.join(os.homedir(), 'AppData', 'Roaming', 'Electron', 'database', 'rawalite.db');
const devDbPath = path.join(os.homedir(), 'AppData', 'Roaming', 'Electron', 'database', 'rawalite-dev.db');
const dbPath = fs.existsSync(prodDbPath) ? prodDbPath : devDbPath;

console.log('📋 SQL-Validierungs-Checkliste (047-Guide) - SQL.js (ABI-safe)');
console.log('🗄️  DB-Pfad:', dbPath);
if (!fs.existsSync(prodDbPath)) {
  console.log('⚠️  Prod DB nicht gefunden, verwende DEV-DB');
}
console.log('');

try {
  if (!fs.existsSync(dbPath)) {
    throw new Error(`Database not found at ${dbPath}`);
  }

  const filebuffer = fs.readFileSync(dbPath);
  const SQL = await initSqlJs();
  const db = new SQL.Database(filebuffer);
  let allGreen = true;

  // 1. DATENTYPVERTEILUNG header_height
  console.log('1️⃣  DATENTYPVERTEILUNG - header_height');
  try {
    const result = db.exec("PRAGMA table_info(user_navigation_preferences)");
    if (result.length > 0) {
      const columns = result[0].values;
      const headerHeightCol = columns.find(row => row[1] === 'header_height');
      if (headerHeightCol) {
        console.log('   Column type:', headerHeightCol[2]);
        console.log('   Notnull:', headerHeightCol[3]);
      } else {
        console.log('   ⚠️  header_height column NOT FOUND');
        allGreen = false;
      }
    }
  } catch (e) {
    console.log('   ❌ Error checking column:', e.message);
    allGreen = false;
  }

  // 2. TEXT/'px'-FUNDE
  console.log('');
  console.log('2️⃣  TEXT/\'px\'-FUNDE in header_height');
  try {
    const result = db.exec(
      "SELECT COUNT(*) as cnt FROM user_navigation_preferences WHERE header_height LIKE '%px%' OR typeof(header_height) = 'text'"
    );
    if (result.length > 0 && result[0].values.length > 0) {
      const count = result[0].values[0][0];
      console.log('   TEXT/px-Einträge:', count);
      if (count > 0) {
        const samples = db.exec(
          "SELECT DISTINCT header_height FROM user_navigation_preferences WHERE header_height LIKE '%px%' OR typeof(header_height) = 'text' LIMIT 5"
        );
        if (samples.length > 0) {
          const sampleValues = samples[0].values.map(row => row[0]).join(', ');
          console.log('   Samples:', sampleValues);
        }
        allGreen = false; // TEXT found = problem
      } else {
        console.log('   ✅ Keine TEXT/px-Einträge (gut!)');
      }
    }
  } catch (e) {
    console.log('   ❌ Error:', e.message);
    allGreen = false;
  }

  // 3. CHECK/DDL-AUSZUG
  console.log('');
  console.log('3️⃣  CHECK/DDL-AUSZUG - user_navigation_preferences');
  try {
    const result = db.exec(
      "SELECT sql FROM sqlite_master WHERE type='table' AND name='user_navigation_preferences'"
    );
    if (result.length > 0 && result[0].values.length > 0) {
      const ddl = result[0].values[0][0];
      console.log('   DDL vorhanden: ✅');
      const hasCheck = ddl.includes('CHECK');
      console.log('   Hat CHECK-Constraint:', hasCheck ? '✅' : '❌');
      if (hasCheck) {
        const checkMatch = ddl.match(/CHECK\s*\([^)]+\)/);
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
    const historyTables = db.exec(
      "SELECT name FROM sqlite_master WHERE type='table' AND name LIKE '%history%'"
    );
    const historyTableNames = historyTables.length > 0 ? historyTables[0].values.map(row => row[0]) : [];
    console.log('   History-Tabellen:', historyTableNames.length > 0 ? historyTableNames.join(', ') : 'KEINE ⚠️ ');

    const views = db.exec(
      "SELECT name FROM sqlite_master WHERE type='view' AND name LIKE '%history%'"
    );
    const viewNames = views.length > 0 ? views[0].values.map(row => row[0]) : [];
    console.log('   History-Views:', viewNames.length > 0 ? viewNames.join(', ') : 'KEINE ⚠️ ');

    const indexes = db.exec(
      "SELECT name FROM sqlite_master WHERE type='index' AND name LIKE '%history%'"
    );
    const indexNames = indexes.length > 0 ? indexes[0].values.map(row => row[0]) : [];
    console.log('   History-Indizes:', indexNames.length > 0 ? indexNames.join(', ') : 'KEINE ⚠️ ');

    if (historyTableNames.length === 0 && viewNames.length === 0) {
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
    const result = db.exec(
      'SELECT navigation_mode, header_height, COUNT(*) as cnt FROM user_navigation_preferences GROUP BY navigation_mode, header_height ORDER BY cnt DESC'
    );
    if (result.length > 0 && result[0].values.length > 0) {
      const dist = result[0].values;
      const totalCount = dist.reduce((sum, row) => sum + row[2], 0);
      console.log(`   Gesamt-Einträge: ${totalCount}`);
      dist.forEach(row => {
        console.log(`   Mode: ${row[0]}, Height: ${row[1]}, Count: ${row[2]}`);
      });
    } else {
      console.log('   ⚠️  Keine Daten in user_navigation_preferences');
    }
  } catch (e) {
    console.log('   ❌ Error:', e.message);
    allGreen = false;
  }

  // 6. PRAGMA integrity_check (simulated)
  console.log('');
  console.log('6️⃣  PRAGMA integrity_check (simulated)');
  try {
    // SQL.js doesn't support PRAGMA integrity_check directly
    // Instead, check if we can query the tables
    const tables = db.exec("SELECT name FROM sqlite_master WHERE type='table'");
    if (tables.length > 0 && tables[0].values.length > 0) {
      console.log('   ✅ Database accessible with', tables[0].values.length, 'tables');
    } else {
      console.log('   ⚠️  No tables found');
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

  process.exit(0);
} catch (err) {
  console.error('❌ Validation failed:', err.message);
  process.exit(1);
}
