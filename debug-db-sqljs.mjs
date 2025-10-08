// Node-context database debugger using sql.js
// Alternative to debug-db.cjs that doesn't require better-sqlite3 ABI compatibility
// Uses sql.js for read-only database inspection in Node.js context

import fs from 'fs';
import path from 'path';
import os from 'os';
import { createRequire } from 'node:module';
const requireModule = createRequire(import.meta.url);

async function initSqlJs() {
  try {
    // Try to load sql.js
    const initSqlJs = requireModule('sql.js');
    return await initSqlJs();
  } catch (error) {
    console.error('❌ sql.js not available. Please install:');
    console.error('   pnpm add sql.js');
    console.error('\nAlternatively, use the Electron-context version:');
    console.error('   pnpm dev:all (then use database through app)');
    process.exit(1);
  }
}

async function debugDatabase() {
  console.log('🔍 RawaLite Database Debug (Node-context safe)');
  console.log('📦 Using sql.js (ABI-independent)\n');

  try {
    // Initialize sql.js
    const SQL = await initSqlJs();
    
    // Production database path (same as original debug-db.cjs)
    const dbPath = path.join(os.homedir(), 'AppData', 'Roaming', 'rawalite', 'database', 'rawalite.db');
    console.log('📍 Database path:', dbPath);
    
    // Check if database exists
    if (!fs.existsSync(dbPath)) {
      console.log('❌ Database not found at expected location');
      console.log('💡 Make sure RawaLite has been run at least once');
      
      // Try alternative paths
      const altPaths = [
        path.join(os.homedir(), 'AppData', 'Local', 'rawalite', 'database', 'rawalite.db'),
        path.join(process.cwd(), 'rawalite.db'),
        path.join(process.cwd(), 'src', 'rawalite.db')
      ];
      
      console.log('\n🔍 Checking alternative locations:');
      for (const altPath of altPaths) {
        if (fs.existsSync(altPath)) {
          console.log(`✅ Found alternative: ${altPath}`);
          dbPath = altPath;
          break;
        } else {
          console.log(`❌ Not found: ${altPath}`);
        }
      }
      
      if (!fs.existsSync(dbPath)) {
        console.log('\n💡 To create a database, start RawaLite normally');
        process.exit(1);
      }
    }

    // Load database
    console.log('📚 Loading database with sql.js...');
    const filebuffer = fs.readFileSync(dbPath);
    const db = new SQL.Database(filebuffer);
    console.log('✅ Database loaded successfully\n');

    // === Migration Status Check ===
    console.log('=== Migration Status Check ===');
    try {
      const migrationTableCheck = db.exec("SELECT name FROM sqlite_master WHERE type='table' AND name='migrations'");
      
      if (migrationTableCheck.length > 0 && migrationTableCheck[0].values.length > 0) {
        console.log('✅ Migrations table exists');
        
        const migrationsResult = db.exec('SELECT * FROM migrations ORDER BY id');
        if (migrationsResult.length > 0 && migrationsResult[0].values.length > 0) {
          const migrations = migrationsResult[0].values.map(row => {
            const columns = migrationsResult[0].columns;
            const migration = {};
            columns.forEach((col, idx) => migration[col] = row[idx]);
            return migration;
          });
          
          console.log('Applied migrations:', migrations.map(m => m.filename));
        } else {
          console.log('No migrations found in table');
        }
      } else {
        console.log('❌ No migrations table found!');
      }
    } catch (error) {
      console.log('❌ Migration check failed:', error.message);
    }

    // === Numbering Circles Check ===
    console.log('\n=== Numbering Circles Check ===');
    try {
      const circlesResult = db.exec('SELECT * FROM numbering_circles');
      
      if (circlesResult.length > 0 && circlesResult[0].values.length > 0) {
        const circles = circlesResult[0].values.map(row => {
          const columns = circlesResult[0].columns;
          const circle = {};
          columns.forEach((col, idx) => circle[col] = row[idx]);
          return circle;
        });
        
        console.log('Found numbering circles:', circles.length);
        if (circles.length > 0) {
          console.log('Sample circle:', circles[0]); // Debug: show full circle structure
          circles.forEach(c => {
            const id = c.id || c.type || 'unknown';
            const current = c.current || c.last_number || 'unknown';
            const name = c.name || 'unnamed';
            console.log('  -', id, ':', current, `(${name})`);
          });
        }
      } else {
        console.log('❌ No numbering circles found');
      }
    } catch (error) {
      console.log('❌ Numbering circles check failed:', error.message);
    }

    // === Settings Check ===
    console.log('\n=== Settings Check ===');
    try {
      const settingsResult = db.exec('SELECT * FROM settings');
      
      if (settingsResult.length > 0 && settingsResult[0].values.length > 0) {
        const settings = settingsResult[0].values.map(row => {
          const columns = settingsResult[0].columns;
          const setting = {};
          columns.forEach((col, idx) => setting[col] = row[idx]);
          return setting;
        });
        
        console.log('Found settings:', settings.length);
        if (settings.length > 0) {
          console.log('Settings sample:', Object.keys(settings[0])); // Show available fields
          
          // Check for logo data specifically
          const logoSetting = settings.find(s => s.logo);
          if (logoSetting) {
            const logo = logoSetting.logo;
            console.log('Logo data found:');
            console.log('  Type:', typeof logo);
            console.log('  Length:', logo?.length || 0);
            console.log('  Starts with data:image:', logo?.startsWith('data:image/') || false);
          }
        }
      } else {
        console.log('❌ No settings found');
      }
    } catch (error) {
      console.log('❌ Settings check failed:', error.message);
    }

    // === Tables Check ===
    console.log('\n=== Tables Check ===');
    try {
      const tablesResult = db.exec("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name");
      
      if (tablesResult.length > 0 && tablesResult[0].values.length > 0) {
        const tableNames = tablesResult[0].values.map(row => row[0]);
        console.log('Available tables:', tableNames.join(', '));
        
        // Show row counts for main tables
        console.log('\n📊 Table Statistics:');
        for (const tableName of tableNames) {
          try {
            const countResult = db.exec(`SELECT COUNT(*) as count FROM "${tableName}"`);
            const count = countResult[0]?.values[0]?.[0] || 0;
            console.log(`  ${tableName}: ${count} rows`);
          } catch (e) {
            console.log(`  ${tableName}: Error counting rows`);
          }
        }
      } else {
        console.log('❌ No tables found');
      }
    } catch (error) {
      console.log('❌ Tables check failed:', error.message);
    }

    // === Schema Version ===
    console.log('\n=== Schema Version ===');
    try {
      const versionResult = db.exec('PRAGMA user_version');
      if (versionResult.length > 0 && versionResult[0].values.length > 0) {
        const version = versionResult[0].values[0][0];
        console.log('Database schema version:', version);
      } else {
        console.log('No schema version found');
      }
    } catch (error) {
      console.log('❌ Schema version check failed:', error.message);
    }

    // === Status Data Investigation ===
    console.log('\n=== Status Data Investigation ===');
    try {
      // Check offers status distribution
      const offersStatusResult = db.exec(`
        SELECT status, COUNT(*) as count 
        FROM offers 
        GROUP BY status 
        ORDER BY count DESC
      `);
      
      if (offersStatusResult.length > 0 && offersStatusResult[0].values.length > 0) {
        console.log('Offers Status Distribution:');
        offersStatusResult[0].values.forEach(([status, count]) => {
          console.log(`  ${status}: ${count}`);
        });
      } else {
        console.log('No offers status data found');
      }
    } catch (error) {
      console.log('Offers status check failed:', error.message);
    }

    try {
      // Check invoices status distribution
      const invoicesStatusResult = db.exec(`
        SELECT status, COUNT(*) as count 
        FROM invoices 
        GROUP BY status 
        ORDER BY count DESC
      `);
      
      if (invoicesStatusResult.length > 0 && invoicesStatusResult[0].values.length > 0) {
        console.log('Invoices Status Distribution:');
        invoicesStatusResult[0].values.forEach(([status, count]) => {
          console.log(`  ${status}: ${count}`);
        });
      } else {
        console.log('No invoices status data found');
      }
    } catch (error) {
      console.log('Invoices status check failed:', error.message);
    }

    // Close database
    db.close();
    console.log('\n✅ Database check completed');
    console.log('💡 This version uses sql.js (Node-context safe)');
    console.log('🔧 For write operations, use the Electron app interface');

  } catch (error) {
    console.error('❌ Database error:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('   1. Ensure sql.js is installed: pnpm add sql.js');
    console.log('   2. Make sure RawaLite has been run at least once');
    console.log('   3. Check that database file exists and is readable');
    console.log('   4. For ABI issues, use: pnpm dev:all (Electron context)');
  }
}

// Run the debug function
debugDatabase().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});